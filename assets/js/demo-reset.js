// Shared Demo Reset control for all pages
// - Injects a header button in the existing header-right slot
// - Default behavior clears demo/local overrides and event caches, then reloads
// - Pages can register a custom handler via window.setDemoResetHandler(fn)
(function(){
  const CLASS_NAME = 'demo-reset-btn-top';
  const MAX_RETRIES = 12;
  let customHandler = window.demoResetCustomHandler || null;

  function defaultReset(){
    try {
      localStorage.removeItem('itineraries.extras');
      localStorage.removeItem('itineraries.deleted');
      localStorage.removeItem('itineraries.overrides');
      const keys = Object.keys(localStorage);
      keys.forEach((key)=>{
        if (key.startsWith('events.') || key.startsWith('events-')) {
          localStorage.removeItem(key);
        }
      });
    } catch(err) {
      console.warn('[demo-reset] failed to clear storage', err);
    }
    try { location.reload(); } catch(e) { /* ignore */ }
  }

  function attach(attempt){
    const target = document.querySelector('.site-header .header-right')
      || document.querySelector('.site-header .container')
      || document.querySelector('.site-header');
    if (!target) {
      if ((attempt||0) < MAX_RETRIES) {
        setTimeout(()=> attach((attempt||0)+1), 160);
      }
      return;
    }

    if (target.querySelector(`.${CLASS_NAME}`)) return;

    const btn = document.createElement('button');
    btn.className = `${CLASS_NAME} link-white`;
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Demo Reset to repo seed');
    btn.title = 'Demo Reset to repo seed';
    btn.textContent = 'Demo Reset';
    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      if (typeof customHandler === 'function') {
        customHandler();
      } else {
        defaultReset();
      }
    });
    target.appendChild(btn);
  }

  window.setDemoResetHandler = function(fn){
    customHandler = (typeof fn === 'function') ? fn : null;
    window.demoResetCustomHandler = customHandler;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ()=> attach(0));
  } else {
    attach(0);
  }
})();
