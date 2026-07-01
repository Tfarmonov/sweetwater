(function(){
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
      if(target){
        window.location.href = target + (target.indexOf('?') > -1 ? '&' : '?') + 'division=' + division;
      }
    });
  });
})();
