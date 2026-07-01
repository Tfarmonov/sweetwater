(function(){
  /* dataLayer bridge — events fire into GTM once its container snippet is
     pasted into the marked slots in each page's <head> and <body>. */
  window.dataLayer = window.dataLayer || [];
  function track(eventName, data){
    var payload = data || {};
    payload.event = eventName;
    window.dataLayer.push(payload);
  }
  window.swTrack = track;

  var toggle = document.getElementById('navToggle');
  var menu = document.getElementById('mobile-menu');
  if(toggle && menu){
    toggle.addEventListener('click', function(){
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var reveals = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    reveals.forEach(function(el){ io.observe(el); });
  } else {
    reveals.forEach(function(el){ el.classList.add('visible'); });
  }

  var goButtons = document.querySelectorAll('.division-go[data-select]');
  goButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      var division = btn.getAttribute('data-select');
      var target = btn.getAttribute('data-href');
      track('division_select', { division: division });
      if(target){
        window.location.href = target + (target.indexOf('?') > -1 ? '&' : '?') + 'division=' + division;
      }
    });
  });

  /* Animated stat counters — <strong class="count" data-count="120" data-suffix="+"> */
  var counters = document.querySelectorAll('.count[data-count]');
  function animateCount(el){
    var end = parseInt(el.getAttribute('data-count'), 10);
    var suffix = el.getAttribute('data-suffix') || '';
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(reduced || !end){ el.textContent = end + suffix; return; }
    var start = null;
    var dur = 1400;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if(counters.length && 'IntersectionObserver' in window){
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(function(el){ cio.observe(el); });
  } else {
    counters.forEach(function(el){
      el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
    });
  }

  /* Before/after slider — .ba-slider containing .ba-after + .ba-range */
  document.querySelectorAll('.ba-slider').forEach(function(slider){
    var after = slider.querySelector('.ba-after');
    var divider = slider.querySelector('.ba-divider');
    var range = slider.querySelector('.ba-range');
    if(!after || !range) return;
    function setPos(val){
      after.style.clipPath = 'inset(0 0 0 ' + val + '%)';
      if(divider) divider.style.left = val + '%';
    }
    range.addEventListener('input', function(){ setPos(range.value); });
    setPos(range.value);
  });

  /* Season tab switcher — .season-tab[data-season] + .season-panel[data-season] */
  var seasonTabs = document.querySelectorAll('.season-tab');
  if(seasonTabs.length){
    seasonTabs.forEach(function(tab){
      tab.addEventListener('click', function(){
        var season = tab.getAttribute('data-season');
        seasonTabs.forEach(function(t){ t.setAttribute('aria-selected', t === tab ? 'true' : 'false'); });
        document.querySelectorAll('.season-panel').forEach(function(panel){
          panel.classList.toggle('active', panel.getAttribute('data-season') === season);
        });
        track('season_guide_view', { season: season });
      });
    });
  }

  /* Track phone taps and quote CTAs for GTM */
  document.querySelectorAll('a[href^="tel:"]').forEach(function(a){
    a.addEventListener('click', function(){
      track('phone_click', { number: a.getAttribute('href').replace('tel:','') });
    });
  });
  document.querySelectorAll('a[href*="contact.html"], a[href*="plans.html#estimate"]').forEach(function(a){
    a.addEventListener('click', function(){
      track('cta_click', { cta_text: (a.textContent || '').trim(), page: location.pathname });
    });
  });
})();
