# Turn on the Service Scheduler (10 minutes, free)

The scheduler backend lives in `backend/scheduler-apps-script.gs`. Deployed under
the business Google account, it gives the site:

- **Owner notifications** — every request emails the ownership group
- **Confirmation emails** — the requester gets a receipt with a booking ref
- **Live double-booking prevention** — the site greys out taken windows, and the
  server re-checks inside a lock at submit time, so simultaneous requests can
  never claim the same window
- **A Google Sheet** of every request ("Sweetwater Service Requests",
  auto-created) — change a row's Status to `Cancelled` or `Declined` to free
  its window again

No servers, no monthly fee. Runs entirely inside the Google account.

## One-time deploy

1. Sign in (in a browser) to the Google account that should send and receive
   booking email — e.g. the account behind **info@sweetwaternc.com**. A plain
   Gmail account works too.
2. Go to **script.google.com** → **New project**. Name it `Sweetwater Scheduler`.
3. Delete the placeholder in `Code.gs` and paste the full contents of
   `backend/scheduler-apps-script.gs`.
4. At the top of the file, set `OWNER_EMAILS` (and `FENCE_EMAILS`) to the real
   ownership addresses.
5. Click **Deploy → New deployment** → gear icon → **Web app**:
   - *Execute as:* **Me**
   - *Who has access:* **Anyone**
   - Click **Deploy**, approve the permissions prompt (Sheets + Mail).
6. Copy the **Web app URL** (it ends in `/exec`).
7. Open `schedule.html`, find the marked line near the bottom:
   ```js
   var SCHED_API = ""; /* ← PASTE YOUR APPS SCRIPT WEB APP URL HERE */
   ```
   paste the URL between the quotes, commit, and push (or hand the URL to
   Claude and ask it to wire it in).

## Verify it works

- Open the live schedule page, book tomorrow's Morning window → you should get
  the confirmation email, the owners get the notification, and a row appears in
  the Sheet.
- Reload the page, pick the same date → Morning shows as **Booked** and can't
  be selected. Submitting it anyway (e.g. from a stale tab) returns
  "window was just taken" and refreshes the slots.

## Day-to-day

- The Sheet is the source of truth. Statuses: `Requested` (new) → set to
  `Confirmed` after you call, or `Cancelled`/`Declined` to release the window.
- Capacity is `CAPACITY: 1` per window per division per day. When a second
  crew can take same-window jobs, raise it and redeploy
  (**Deploy → Manage deployments → ✏ → New version**).
- Email quotas: free Gmail allows ~100 recipients/day from Apps Script
  (Workspace: 1,500/day) — far above normal booking volume.

## Notes

- Until `SCHED_API` is set, the schedule page stays in demo mode (success
  message only, no email, no storage) and says nothing misleading about email.
- The contact and careers forms are still front-end demos; the same Apps
  Script pattern can be extended to them on request.
