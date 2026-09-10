/**
 * SWEETWATER SERVICE SCHEDULER — BACKEND (Google Apps Script)
 * ------------------------------------------------------------
 * What this does once deployed:
 *   1. Stores every booking request in a Google Sheet ("Sweetwater Service
 *      Requests", created automatically on first use).
 *   2. Emails the ownership group on every new request.
 *   3. Emails the requester a confirmation.
 *   4. Prevents double-booking: availability is checked live by the website,
 *      and re-checked here inside a lock when a request is submitted, so two
 *      people can never take the same window even if they submit together.
 *
 * Deploy steps: see SETUP-SCHEDULER.md in the repository root.
 * After deploying, paste the Web app URL into the SCHED_API constant in
 * schedule.html (the paste spot is clearly marked).
 */

var CONFIG = {
  // Who gets notified about every new request (comma-add more addresses):
  OWNER_EMAILS: ['info@sweetwaternc.com'],
  // Fence requests also notify these addresses:
  FENCE_EMAILS: ['info@sweetwaternc.com'],
  BUSINESS_NAME: 'Sweetwater Landscapes',
  PHONE_TRIANGLE: '(919) 387-7103',
  PHONE_COASTAL: '(910) 623-1262',
  PHONE_FENCE: 'Kevin Papushak — (216) 401-5022',

  SHEET_NAME: 'Sweetwater Service Requests',
  // Real arrival windows (capacity-managed). "First available" is always
  // accepted — the dispatcher slots it manually.
  SLOTS: ['Morning 8-11', 'Midday 11-2', 'Afternoon 2-5'],
  FLEX_SLOT: 'First available',
  DIVISIONS: ['Landscaping', 'Fencing'],
  // How many bookings each division can take per window per day.
  // Raise this when more crews are available.
  CAPACITY: 1,
  MIN_DAYS_AHEAD: 1,
  MAX_DAYS_AHEAD: 120
};

var HEADERS = ['Received', 'Booking ID', 'Status', 'Date', 'Window', 'Division',
               'Service', 'Property type', 'Property', 'Name', 'Phone', 'Email', 'Notes'];

/* ---------------------------------------------------------------- storage */
function getSheet_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SS_ID');
  var ss;
  if (id) {
    try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(CONFIG.SHEET_NAME);
    props.setProperty('SS_ID', ss.getId());
  }
  var sheet = ss.getSheets()[0];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/* Count active bookings per "date|slot|division" key. */
function bookedCounts_(sheet, dateStr) {
  var counts = {};
  var last = sheet.getLastRow();
  if (last < 2) return counts;
  var rows = sheet.getRange(2, 1, last - 1, HEADERS.length).getValues();
  for (var i = 0; i < rows.length; i++) {
    var status = String(rows[i][2]).toLowerCase();
    if (status === 'cancelled' || status === 'declined') continue;
    var d = normDate_(rows[i][3]);
    if (d !== dateStr) continue;
    var key = rows[i][4] + '|' + rows[i][5];
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function normDate_(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v).slice(0, 10);
}

/* ---------------------------------------------------------------- http */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action === 'ping') return json_({ ok: true, service: 'sweetwater-scheduler' });
  if (p.action === 'availability') {
    var dateStr = String(p.date || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return json_({ ok: false, error: 'bad_date' });
    }
    var counts = bookedCounts_(getSheet_(), dateStr);
    var full = {};
    CONFIG.DIVISIONS.forEach(function (div) {
      full[div] = CONFIG.SLOTS.filter(function (slot) {
        return (counts[slot + '|' + div] || 0) >= CONFIG.CAPACITY;
      });
    });
    return json_({ ok: true, date: dateStr, full: full, capacity: CONFIG.CAPACITY });
  }
  return json_({ ok: false, error: 'unknown_action' });
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'bad_json' });
  }

  // Honeypot: bots fill every field; real visitors never see this one.
  if (data.website) return json_({ ok: true, id: 'SW-OK' });

  var clean = {
    division: oneOf_(data.division, CONFIG.DIVISIONS),
    service: cap_(data.service, 120),
    type: cap_(data.type, 60),
    date: String(data.date || '').slice(0, 10),
    slot: oneOf_(data.slot, CONFIG.SLOTS.concat([CONFIG.FLEX_SLOT])),
    property: cap_(data.property, 160),
    name: cap_(data.name, 100),
    phone: cap_(data.phone, 40),
    email: cap_(data.email, 120),
    notes: cap_(data.notes, 1500)
  };

  if (!clean.division || !clean.slot) return json_({ ok: false, error: 'bad_fields' });
  if (!clean.name || !clean.phone || !clean.property) return json_({ ok: false, error: 'missing_fields' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean.email)) return json_({ ok: false, error: 'bad_email' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean.date)) return json_({ ok: false, error: 'bad_date' });

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var reqDate = new Date(clean.date + 'T12:00:00');
  var daysAhead = Math.round((reqDate - today) / 86400000);
  if (isNaN(daysAhead) || daysAhead < CONFIG.MIN_DAYS_AHEAD || daysAhead > CONFIG.MAX_DAYS_AHEAD) {
    return json_({ ok: false, error: 'date_out_of_range' });
  }

  // Atomic slot claim: lock -> re-check -> write. This is what makes
  // simultaneous submissions safe.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
  } catch (err) {
    return json_({ ok: false, error: 'busy_try_again' });
  }

  var id;
  try {
    var sheet = getSheet_();
    if (clean.slot !== CONFIG.FLEX_SLOT) {
      var counts = bookedCounts_(sheet, clean.date);
      if ((counts[clean.slot + '|' + clean.division] || 0) >= CONFIG.CAPACITY) {
        return json_({ ok: false, error: 'slot_taken' });
      }
    }
    id = 'SW-' + Date.now().toString(36).toUpperCase();
    sheet.appendRow([new Date(), id, 'Requested', clean.date, clean.slot, clean.division,
                     clean.service, clean.type, clean.property, clean.name, clean.phone,
                     clean.email, clean.notes]);
  } finally {
    lock.releaseLock();
  }

  var mailError = null;
  try { sendOwnerEmail_(id, clean); } catch (err) { mailError = 'owner'; }
  try { sendConfirmationEmail_(id, clean); } catch (err) { mailError = (mailError ? 'both' : 'requester'); }

  return json_({ ok: true, id: id, mailError: mailError });
}

/* ---------------------------------------------------------------- email */
function sendOwnerEmail_(id, r) {
  var to = CONFIG.OWNER_EMAILS.slice();
  if (r.division === 'Fencing') {
    CONFIG.FENCE_EMAILS.forEach(function (a) { if (to.indexOf(a) < 0) to.push(a); });
  }
  var body =
    'New service request ' + id + '\n' +
    '--------------------------------\n' +
    'Date:        ' + r.date + '\n' +
    'Window:      ' + r.slot + '\n' +
    'Division:    ' + r.division + '\n' +
    'Service:     ' + r.service + '\n' +
    'Property:    ' + r.property + ' (' + r.type + ')\n' +
    'Contact:     ' + r.name + ' · ' + r.phone + ' · ' + r.email + '\n' +
    (r.notes ? 'Notes:       ' + r.notes + '\n' : '') +
    '--------------------------------\n' +
    'All requests: ' + SpreadsheetApp.openById(
        PropertiesService.getScriptProperties().getProperty('SS_ID')).getUrl();
  MailApp.sendEmail({
    to: to.join(','),
    subject: '[' + id + '] ' + r.date + ' ' + r.slot + ' — ' + r.division + ' request from ' + r.name,
    body: body,
    name: CONFIG.BUSINESS_NAME + ' Scheduler'
  });
}

function sendConfirmationEmail_(id, r) {
  var body =
    'Hi ' + r.name + ',\n\n' +
    'We received your service request — here are the details:\n\n' +
    '  Booking ref: ' + id + '\n' +
    '  Date:        ' + r.date + '\n' +
    '  Window:      ' + r.slot + '\n' +
    '  Service:     ' + r.service + ' (' + r.division + ')\n' +
    '  Property:    ' + r.property + '\n\n' +
    'Your window is on hold. A member of our team will confirm within one ' +
    'business day, and your crew will text when they are en route.\n\n' +
    'Need to change anything? Reply to this email or call us:\n' +
    '  Triangle:  ' + CONFIG.PHONE_TRIANGLE + '\n' +
    '  Coastal:   ' + CONFIG.PHONE_COASTAL + '\n' +
    '  Fencing:   ' + CONFIG.PHONE_FENCE + '\n\n' +
    '— ' + CONFIG.BUSINESS_NAME;
  MailApp.sendEmail({
    to: r.email,
    subject: CONFIG.BUSINESS_NAME + ' — request received for ' + r.date + ' (' + id + ')',
    body: body,
    name: CONFIG.BUSINESS_NAME
  });
}

/* ---------------------------------------------------------------- util */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
function cap_(v, n) { return String(v == null ? '' : v).trim().slice(0, n); }
function oneOf_(v, list) { return list.indexOf(v) >= 0 ? v : null; }
