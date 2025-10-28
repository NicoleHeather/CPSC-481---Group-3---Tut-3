// Minimal FAB panel controller: open/close, simple focus-trap, and action events
// FAB -> Bottom-sheet / side-panel controller: open/close, focus management, and action events
(function(){
  const fab = document.getElementById('add-event');
  const panel = document.getElementById('fab-panel');
  const overlay = document.getElementById('fab-panel-overlay');
  const closeBtn = document.getElementById('fab-panel-close');
  const btnTrip = document.getElementById('open-add-trip-btn');
  const btnEvent = document.getElementById('open-add-event-btn');
  if(!fab || !panel || !overlay) return;

  let lastFocused = null;

  function focusableElements(container){
    return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => !el.hasAttribute('disabled'));
  }

  function openPanel(){
    lastFocused = document.activeElement;
    overlay.classList.add('open');
    panel.classList.add('open');
    panel.removeAttribute('aria-hidden');
    panel.setAttribute('aria-modal','true');
    fab.classList.add('hidden'); // hide the FAB while panel open
    // focus first interactive element inside panel
    const f = focusableElements(panel)[0];
    if(f) f.focus();
    document.addEventListener('keydown', onKeyDown);
  }

  function closePanel(){
    overlay.classList.remove('open');
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden','true');
    document.removeEventListener('keydown', onKeyDown);
    fab.classList.remove('hidden');
    if(lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  }

  function onKeyDown(e){
    if(e.key === 'Escape') { closePanel(); return; }
    if(e.key === 'Tab'){
      const focusables = focusableElements(panel);
      if(focusables.length === 0) { e.preventDefault(); return; }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }

  // wire up triggers
  fab.addEventListener('click', openPanel);
  overlay.addEventListener('click', closePanel);
  if(closeBtn) closeBtn.addEventListener('click', closePanel);

  if(btnTrip) btnTrip.addEventListener('click', function(){
    document.dispatchEvent(new CustomEvent('open-add-trip'));
    closePanel();
  });

  if(btnEvent) btnEvent.addEventListener('click', function(){
    document.dispatchEvent(new CustomEvent('open-add-event'));
    closePanel();
  });

})();
