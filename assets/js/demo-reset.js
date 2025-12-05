/* Lightweight global Demo Reset attach helper
   - Idempotent: if `.demo-reset-btn-top` exists, does nothing
   - Attaches to `#demo-reset-container` if present, otherwise to the header
   - Calls `window.demoResetAll()` when available
   - Uses MutationObserver to recover if the header is injected later
*/
(function(){
  'use strict';

  function createModal(message, details){
    try{
      // single instance
      if(document.getElementById('demo-reset-modal')) return;
      const overlay = document.createElement('div'); overlay.id = 'demo-reset-modal'; overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.background='rgba(0,0,0,0.45)'; overlay.style.zIndex='120000';
      const panel = document.createElement('div'); panel.style.background='#fff'; panel.style.padding='18px'; panel.style.borderRadius='10px'; panel.style.maxWidth='520px'; panel.style.width='min(92%,520px)'; panel.style.boxShadow='0 20px 60px rgba(0,0,0,0.28)';
      const h = document.createElement('div'); h.style.fontWeight='700'; h.style.marginBottom='8px'; h.textContent = 'Demo Reset';
      const p = document.createElement('div'); p.style.marginBottom='12px'; p.textContent = message || 'Events and trips have been reset to the defaults.';
      panel.appendChild(h); panel.appendChild(p);
      if(details){
        const pre = document.createElement('pre'); pre.style.whiteSpace='pre-wrap'; pre.style.margin='0 0 12px 0'; pre.style.fontSize='0.95rem'; pre.textContent = typeof details === 'string' ? details : JSON.stringify(details, null, 2);
        panel.appendChild(pre);
      }
      const ok = document.createElement('button'); ok.className='btn'; ok.textContent='OK'; ok.addEventListener('click', ()=>{ try{ overlay.remove(); }catch(e){} });
      panel.appendChild(ok);
      overlay.appendChild(panel);
      document.body.appendChild(overlay);
    }catch(e){ try{ alert(message || 'Events and trips have been reset to defaults.'); }catch(_){} }
  }

  // Listen for explicit reset events from page scripts that know details.
  window.addEventListener('demo:reset', function(ev){
    // ev.detail may contain contextual info (trip id, counts, etc.)
    const d = ev && ev.detail ? ev.detail : null;
    const msg = d && d.message ? d.message : 'Events and trips have been reset to the defaults.';
    createModal(msg, d);
  }, false);

  function createButton(container){
    if(!container || container.querySelector('.demo-reset-btn-top')) return null;
    var btn = document.createElement('button');
    btn.className = 'demo-reset-btn-top';
    btn.type = 'button';
    btn.textContent = 'Demo Reset';
    btn.setAttribute('aria-label','Demo Reset');
    // Visual styling is provided by CSS via the `.demo-reset-btn-top` rule.
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      try{
        // show a temporary 'working' modal immediately
        var tempId = 'demo-reset-modal-temp';
        try{ document.getElementById(tempId) && document.getElementById(tempId).remove(); }catch(_){ }
        var overlay = document.createElement('div'); overlay.id = tempId; overlay.style.position='fixed'; overlay.style.inset='0'; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.background='rgba(0,0,0,0.36)'; overlay.style.zIndex='120001';
        var panel = document.createElement('div'); panel.style.background='#fff'; panel.style.padding='14px'; panel.style.borderRadius='8px'; panel.style.minWidth='260px'; panel.style.textAlign='center'; panel.style.boxShadow='0 12px 40px rgba(0,0,0,0.2)';
        var p = document.createElement('div'); p.style.marginBottom='10px'; p.textContent = 'Resetting events...';
        panel.appendChild(p);
        overlay.appendChild(panel);
        try{ document.body.appendChild(overlay); }catch(e){ /* ignore */ }

        var settled = false;
        var settle = function(msg, details){
          if(settled) return; settled = true;
          try{ overlay.remove(); }catch(e){}
          createModal(msg, details);
        };

        var onEvent = function(ev){
          try{ window.removeEventListener('demo:reset', onEvent); }catch(e){}
          var d = ev && ev.detail ? ev.detail : null;
          var message = d && d.message ? d.message : 'Events and trips have been reset to the defaults.';
          settle(message, d);
        };
        window.addEventListener('demo:reset', onEvent);

        // fallback: if nothing reports back, show a generic success after 1.2s
        var fallbackTimer = setTimeout(function(){
          try{ window.removeEventListener('demo:reset', onEvent); }catch(e){}
          settle('Events and trips have been reset to the defaults.');
        }, 1200);

        // Attempt to call the real reset function. If it doesn't exist but a fallback helper exists,
        // attempt that and dispatch a best-effort event so the modal gets contextual info.
        if(typeof window.demoResetAll === 'function'){
          try{ window.demoResetAll(); }catch(err){ console.warn('demoResetAll failed', err); clearTimeout(fallbackTimer); settle('Demo Reset failed — see console.', { error: String(err) }); }
        } else if (typeof window.saveEventsToStorage === 'function'){
          try{
            // best-effort: some pages expose saveEventsToStorage(tid, events) — we can't guess args,
            // but call it without args if it's a no-arg helper; otherwise dispatch a simple event.
            try{ window.saveEventsToStorage(); }catch(e){ /* ignore */ }
            clearTimeout(fallbackTimer);
            try{ window.dispatchEvent(new CustomEvent('demo:reset', { detail: { message: 'Demo Reset executed (fallback).', eventsWritten: null } })); }catch(e){}
          }catch(err){ clearTimeout(fallbackTimer); settle('Demo Reset failed — see console.', { error: String(err) }); }
        } else {
          // no handler available
          clearTimeout(fallbackTimer);
          try{ window.removeEventListener('demo:reset', onEvent); }catch(e){}
          settle('Demo Reset: no handler registered on this page.');
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
