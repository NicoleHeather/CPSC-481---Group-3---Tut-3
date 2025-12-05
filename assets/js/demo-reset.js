/* Lightweight global Demo Reset attach helper
   - Idempotent: if `.demo-reset-btn-top` exists, does nothing
   - Attaches to `#demo-reset-container` if present, otherwise to the header
   - Calls `window.demoResetAll()` when available
   - Uses MutationObserver to recover if the header is injected later
*/
(function(){
  'use strict';

  function createButton(container){
    if(!container || container.querySelector('.demo-reset-btn-top')) return null;
    var btn = document.createElement('button');
    btn.className = 'demo-reset-btn-top';
    btn.type = 'button';
    btn.textContent = 'Demo Reset';
    btn.setAttribute('aria-label','Demo Reset');
    // conservative inline visible styling so it's obvious without relying on CSS
    btn.style.background = '#fff';
    btn.style.color = '#111';
    btn.style.border = '1px solid rgba(0,0,0,0.06)';
    btn.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
    btn.style.position = 'absolute';
    btn.style.right = '12px';
    btn.style.top = '50%';
    btn.style.transform = 'translateY(-50%)';
    btn.style.padding = '8px 10px';
    btn.style.zIndex = 999999;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      try{
        if(typeof window.demoResetAll === 'function'){
          window.demoResetAll();
        } else if (typeof window.saveEventsToStorage === 'function'){
          // best-effort fallback
          try{ window.saveEventsToStorage(); }catch(_){/*ignore*/}
        } else {
          alert('Demo Reset: no handler registered on this page.');
        }
      }catch(err){ console.warn('Demo Reset handler failed', err); alert('Demo Reset failed — see console.'); }
    });
    try{ container.appendChild(btn); }catch(e){ /* ignore */ }
    return btn;
  }

  function attachOnce(){
    if(document.querySelector('.demo-reset-btn-top')) return true;
    var container = document.getElementById('demo-reset-container') || document.querySelector('header.site-header') || document.body;
    if(!container) return false;
    createButton(container);
    return !!document.querySelector('.demo-reset-btn-top');
  }

  // Try immediately (if header is in DOM)
  if(attachOnce()) return;

  // Wait for DOMContentLoaded if needed, then try again
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ attachOnce(); });
  } else {
    // try again after a short tick
    setTimeout(attachOnce, 50);
  }

  // Observe for header insertion / replacement and attach when available
  var root = document.documentElement || document.body;
  try{
    var mo = new MutationObserver(function(mutations){
      if(document.querySelector('.demo-reset-btn-top')){ mo.disconnect(); return; }
      // small heuristic: if header or demo container appeared, try attach
      for(var i=0;i<mutations.length;i++){
        var m = mutations[i];
        if(m.addedNodes && m.addedNodes.length){
          for(var j=0;j<m.addedNodes.length;j++){
            var n = m.addedNodes[j];
            if(n.nodeType !== 1) continue;
            if(n.matches && (n.matches('header') || n.matches('.site-header') || n.id === 'demo-reset-container')){ attachOnce(); }
            if(n.querySelector && (n.querySelector('header') || n.querySelector('#demo-reset-container'))){ attachOnce(); }
          }
        }
      }
    });
    mo.observe(root, { childList: true, subtree: true });
  }catch(e){ /* MutationObserver not available — that's fine */ }

})();
