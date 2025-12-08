// bookingHighlight.js
// Shared helper to set and consume a bookingHighlight payload via sessionStorage
(function(global){
  function safeSet(payload){
    try { sessionStorage.setItem('bookingHighlight', JSON.stringify(payload)); } catch(e){}
  }

  function navigateToItinerary(tripId, basePath){
    const path = (typeof basePath === 'string' && basePath) ? basePath : '..';
    try { window.location.href = `${path}/pages/ItineraryWeek.html?trip=${encodeURIComponent(tripId)}`; } catch(e){}
  }

  function set(payload, opts){
    if(!payload) return;
    safeSet(payload);
    // allow override of basePath for pages in subfolders
    const basePath = opts && opts.basePath ? opts.basePath : '..';
    if(payload.tripId) navigateToItinerary(payload.tripId, basePath);
  }

  // consume: reads bookingHighlight and performs the highlight/toast on a supplied listEl
  function consume(listEl, expectedTripId){
    try {
      const raw = sessionStorage.getItem('bookingHighlight');
      if(!raw) return false;
      const payload = JSON.parse(raw);
      if(!payload) { sessionStorage.removeItem('bookingHighlight'); return false; }
      if(expectedTripId && String(payload.tripId) !== String(expectedTripId)) { sessionStorage.removeItem('bookingHighlight'); return false; }
      if(!listEl) { sessionStorage.removeItem('bookingHighlight'); return false; }

      const idSelector = String(payload.eventId || payload.eventId || '').replace(/"/g,'\\"');
      // Try several selectors to accommodate different renderers (week list uses li[data-event-id], other views use .event-item)
      const candidates = [
        `.event-item[data-event-id="${idSelector}"]`,
        `[data-event-id="${idSelector}"]`,
        `.day-list li[data-event-id="${idSelector}"]`
      ];
      let target = null;
      for (let s of candidates) {
        try { target = listEl.querySelector(s); } catch(_) { target = null; }
        if (target) break;
      }
      if(target){
        target.classList.add('event-item--highlight');
        try {
          const rect = target.getBoundingClientRect();
          const viewH = window.innerHeight || document.documentElement.clientHeight;
          const fullyVisible = (rect.top >= 0 && rect.bottom <= viewH);
          if(!fullyVisible){ try{ target.scrollIntoView({ behavior: 'smooth', block: 'center' }); }catch(_){}}
        } catch(_) {}

        const toast = document.createElement('div');
        toast.className = 'booking-highlight-toast';
        const attemptedLine = document.createElement('div');
        attemptedLine.className = 'booking-highlight-attempt';
        if(payload.attemptedTitle){ attemptedLine.textContent = `Attempting to add: ${payload.attemptedTitle}`; }

        // Determine conflicting event title/time from payload or DOM
        let conflictTitle = payload.conflictTitle || '';
        if(!conflictTitle && target){
          try {
            const titleCandidates = ['.event-title', '.day-title', '.title', '.item-title'];
            for (const sel of titleCandidates) {
              const t = target.querySelector(sel);
              if (t && t.textContent && t.textContent.trim()) { conflictTitle = t.textContent.trim(); break; }
            }
            if(!conflictTitle) {
              // fallback: use trimmed textContent of the target (may include time)
              const txt = (target.textContent || '').trim();
              if (txt) conflictTitle = txt.split('\n').map(s=>s.trim()).filter(Boolean).join(' — ');
            }
          } catch(_){}
        }
        const conflictTimeRange = payload.conflictTimeRange || payload.conflictTime || '';

        const conflictLine = document.createElement('div');
        conflictLine.className = 'booking-highlight-conflict';
        if(conflictTitle){
          conflictLine.textContent = `Conflicts with: ${conflictTitle}${conflictTimeRange ? ' — ' + conflictTimeRange : ''}`;
        } else {
          conflictLine.textContent = payload.msg || 'Conflicting event highlighted.';
        }

        attemptedLine.style.fontWeight = '400'; conflictLine.style.fontWeight = '400';
        toast.appendChild(attemptedLine); toast.appendChild(conflictLine);
        const close = document.createElement('button'); close.className='btn-cancel booking-highlight-dismiss'; close.textContent='Dismiss';
        close.addEventListener('click', ()=>{ try{ toast.remove(); }catch(_){} }); close.style.alignSelf='center'; toast.appendChild(close);
        document.body.appendChild(toast);
        setTimeout(()=>{ try{ target.classList.remove('event-item--highlight'); }catch(_){} },7000);
        setTimeout(()=>{ try{ toast.remove(); }catch(_){} },9000);
      }
      sessionStorage.removeItem('bookingHighlight');
      return true;
    } catch(e) { try{ sessionStorage.removeItem('bookingHighlight'); }catch(_){} return false; }
  }

  global.bookingHighlight = { set, consume };
})(window);
