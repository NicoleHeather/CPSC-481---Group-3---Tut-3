(function(){

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  const tripId = urlParams.get('trip');
  console.log(tripId);

  const $ = (sel, node=document) => node.querySelector(sel);
  // Prefer the new #week-columns container; fall back to legacy #itinerary-list
  const listEl = document.getElementById('week-columns') || document.getElementById('itinerary-list');
  if (!listEl) return;

  function basePath() {
    return window.location.pathname.includes('/pages/') ? '..' : '.';
  }
  function parseISO(d){ return new Date(d + 'T00:00:00'); }

  async function loadTrips(){
    return (await fetch(`${basePath()}/assets/data/trips.json`).then(r=>r.json())).trips || [];
  }
  async function loadEvents(){
    try { return (await fetch(`${basePath()}/assets/data/events.json`).then(r=>r.json())).explore || []; } catch(e){ return []; }
  }

  function eachDate(start, end){
    const arr=[]; let d=new Date(start); const last=new Date(end);
    while(d<=last){ arr.push(d.toISOString().slice(0,10)); d.setDate(d.getDate()+1); }
    return arr;
  }

  const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  function toDay(iso){ return DAY_NAMES[parseISO(iso).getDay()]; }
  function toShort(iso){ const d=parseISO(iso); return d.toLocaleDateString(undefined,{month:'short', day:'numeric', year:'numeric'}); }

  function mapEventsSequentially(trip, events){
    const days = eachDate(trip.startDate, trip.endDate).map(date=>({date, city: trip.title, activities: []}));
    let index=0, PER_DAY=2;
    for(let i=0;i<days.length;i++){
      for(let j=0;j<PER_DAY;j++){
        if(index>=events.length) break;
        const ev=events[index++]; days[i].activities.push({id: ev.id, time: ev.time});
      }
    }
    return days;
  }

  function getQueryParam(name){ const url=new URL(location.href); return url.searchParams.get(name); }

  function renderWeekRowForDates(trip, days, EVENTS, weekStartIndex){
    // weekStartIndex indicates the index in days array to start the 7-day window
    const wrap=document.createElement('div'); wrap.className='week-row';
    const slice = days.slice(weekStartIndex, weekStartIndex+7);
    slice.forEach(day=>{
      const cell=document.createElement('div'); cell.className='day-cell';
      cell.setAttribute('role','link'); cell.setAttribute('tabindex','0');
      const href = `${basePath()}/pages/ItineraryDay.html?trip=${encodeURIComponent(trip.id)}&date=${encodeURIComponent(day.date)}`;
      cell.dataset.href = href;
      cell.addEventListener('click', ()=>{ if(cell.dataset.href) location.href = cell.dataset.href; });
      cell.addEventListener('keydown',(e)=>{ if(e.key==='Enter' || e.key===' '){ e.preventDefault(); if(cell.dataset.href) location.href = cell.dataset.href; } });

      cell.innerHTML = `
        <span class="day-name">${toDay(day.date)}</span>
        <span class="day-date">${toShort(day.date)}</span>
        <div class="day-meta"><div>${trip.title}</div></div>
        <span class="chev" aria-hidden="true">›</span>
      `;

      const list=document.createElement('ul'); list.className='day-list';
      day.activities.slice(0,3).forEach(act=>{
        const ev = EVENTS.find(e=>e.id===act.id);
        const title = ev ? ev.title : '(Event)';
        const li=document.createElement('li');
        li.innerHTML = `
          <span class="day-time">${act.time}</span>
          <a href="${basePath()}/pages/EventInfo.html?id=${encodeURIComponent(act.id)}&trip=${trip.id}" class="day-title">${title}</a>
        `;
        list.appendChild(li);
      });
      if(day.activities.length===0){ const li=document.createElement('li'); li.className='day-more'; li.textContent='No items'; list.appendChild(li); }
      cell.appendChild(list);
      wrap.appendChild(cell);
    });
    return wrap;
  }

  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  (async ()=>{
    const trips = await loadTrips();
    const events = await loadEvents();
    const tripId = getQueryParam('trip');
    if(!tripId){ listEl.innerHTML = '<p>No trip specified. Return to <a href="../pages/Itineraries.html">Itineraries</a>.</p>'; return; }

    const trip = trips.find(t => t.id === tripId);
    if(!trip){ listEl.innerHTML = `<p>Trip '${tripId}' not found. Return to <a href="../pages/Itineraries.html">Itineraries</a>.</p>`; return; }

    // Prepare events: prefer a per-trip JSON seed file if it exists in the repo.
    // Fallback order: per-trip JSON -> shared events.json -> deterministic generator.
    const allEvents = events || [];
    const tripDays = eachDate(trip.startDate, trip.endDate);

    // Attempt to fetch `assets/data/events-<tripId>.json` for canonical seeds.
    let perTripSeed = null;
    try {
      const resp = await fetch(`${basePath()}/assets/data/events-${encodeURIComponent(trip.id)}.json`);
      if (resp && resp.ok) {
        const body = await resp.json();
        if (body && Array.isArray(body.explore) && body.explore.length) {
          perTripSeed = body.explore.slice();
          console.info('[week] loaded per-trip seed file for', trip.id, perTripSeed.length, 'events');
        }
      }
    } catch (e) {
      /* ignore - no per-trip seed available */
    }

    const candidates = (allEvents || []).filter(ev => ev.location === trip.title);
    const pool = (candidates.length ? candidates : allEvents).slice();

    // Deterministic RNG per-trip so events don't change on refresh for the same trip.
    // Use xmur3 -> mulberry32 to generate a seeded PRNG from a string seed.
    function xmur3(str){
      for(var i=0,h=1779033703;i<str.length;i++) h = Math.imul(h ^ str.charCodeAt(i), 3432918353), h = (h<<13) | (h>>>19);
      return function(){ h = Math.imul(h ^ (h>>>16), 2246822507); h = Math.imul(h ^ (h>>>13), 3266489909); return (h ^= (h>>>16)) >>> 0; };
    }
    function mulberry32(a){
      return function(){ var t = a += 0x6D2B79F5; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    }
    const seedSource = (trip.id || '') + '|' + (trip.startDate || '');
    const seed = xmur3(seedSource)();
    const rand = mulberry32(seed);
    function randInt(min, max){ return Math.floor(rand()*(max-min+1))+min; }
    function randomDateBetween(startIso, endIso){
      const s = parseISO(startIso); const e = parseISO(endIso);
      const diff = e.getTime() - s.getTime();
      const t = s.getTime() + Math.floor(rand() * (diff+1));
      return new Date(t).toISOString().slice(0,10);
    }

    // Shuffle pool (Fisher-Yates) using deterministic RNG
    for(let i=pool.length-1;i>0;i--){ const j = Math.floor(rand() * (i+1)); [pool[i],pool[j]] = [pool[j],pool[i]]; }

    // Assign 0-5 deterministic events per trip day (using seeded rand).
    // This ensures each day has a predictable but varied number of events.
    const eventsForThisTrip = [];
    let poolIndex = 0;
    for(let d=0; d<tripDays.length; d++){
      const dayIso = tripDays[d];
      // deterministic count 0..5
      const count = Math.floor(rand() * 6);
      for(let k=0;k<count;k++){
        if(poolIndex >= pool.length) break; // no more source events
        const ev = Object.assign({}, pool[poolIndex++]);
        ev.date = dayIso;
        if(!ev.time) ev.time = `${randInt(9,20)}:00`;
        eventsForThisTrip.push(ev);
      }
    }

    // DEBUG HELPER: if `?debug_multi=1` is present, inject 2-3 extra events
    // into the same day (the trip's middle date) so you can preview stacking.
    if(getQueryParam('debug_multi') === '1'){
      const mid = Math.floor(tripDays.length/2);
      const target = tripDays[mid] || trip.startDate;
      const stamp = Date.now();
      const extras = [
        { id: `dbg-${stamp}-1`, title: 'Sample: Coffee Meet', time: '09:30', date: target },
        { id: `dbg-${stamp}-2`, title: 'Sample: Lunch Walk', time: '12:15', date: target },
        { id: `dbg-${stamp}-3`, title: 'Sample: Evening Show', time: '18:45', date: target }
      ];
      eventsForThisTrip.push(...extras);
    }

    // Note: per-trip seed files in `assets/data/events-<tripId>.json` are
    // preferred and will be used to initialize storage for new users. Hardcoded
    // prototype blocks have been removed so repo files remain canonical.

    // --- localStorage persistence helpers ---
    function storageKey(tid){ return `events-${tid}`; }
    function loadSavedEvents(tid){ try{ const raw = localStorage.getItem(storageKey(tid)); return raw ? JSON.parse(raw) : null; } catch(e){ return null; } }
    function saveEventsToStorage(tid, events){ try{ localStorage.setItem(storageKey(tid), JSON.stringify(events)); } catch(e){ /* ignore */ } }

    // If user has saved events in localStorage, prefer those (local edits persist).
    // Otherwise persist the seeded/generated events so subsequent loads show
    // the same initial events and users can add/remove them locally.
    const saved = loadSavedEvents(trip.id);
    const forceSeed = getQueryParam('force_seed') === '1';
    // Allow clearing stored events for debugging: `?clear_storage=1`
    const clearStorage = getQueryParam('clear_storage') === '1';
    if (clearStorage) {
      try { localStorage.removeItem(storageKey(trip.id)); console.info('[week] cleared localStorage for', trip.id); } catch(e){ /* ignore */ }
    }

    if (forceSeed) {
      // Force re-seed: prefer per-trip seed if available, otherwise use
      // whatever eventsForThisTrip currently contains (deterministic generator).
      try {
        const toSave = (perTripSeed && perTripSeed.length) ? perTripSeed : eventsForThisTrip;
        saveEventsToStorage(trip.id, toSave);
        console.info('[week] force_seed=1: wrote', (toSave||[]).length, 'events to', storageKey(trip.id));
        const after = loadSavedEvents(trip.id);
        if (Array.isArray(after) && after.length){ eventsForThisTrip.length = 0; eventsForThisTrip.push(...after); console.info('[week] reloaded', after.length, 'events after force-seed'); }
      } catch(e){ console.warn('[week] force_seed failed', e); }
    } else if (Array.isArray(saved) && saved.length) {
      // Use user's saved local edits when present
      console.info('[week] using saved events from localStorage:', saved.length);
      eventsForThisTrip.length = 0;
      eventsForThisTrip.push(...saved);
    } else if (perTripSeed && perTripSeed.length) {
      // No saved events: initialize storage with the per-trip JSON seed so
      // the repo-provided itinerary is consistent for new visitors.
      try { saveEventsToStorage(trip.id, perTripSeed); eventsForThisTrip.length = 0; eventsForThisTrip.push(...perTripSeed); console.info('[week] initialized storage with per-trip seed:', perTripSeed.length); } catch(e){ /* ignore */ }
    } else {
      // No saved events and no per-trip seed: initialize storage with
      // the deterministic generator output.
      try { saveEventsToStorage(trip.id, eventsForThisTrip); console.info('[week] initialized storage with', eventsForThisTrip.length, 'seeded events'); } catch(e){ /* ignore */ }
    }

    // Quick-add modal: create once and reuse
    let _quickAddModal = null;
    function ensureQuickAddModal(){
      if(_quickAddModal) return _quickAddModal;
      const overlay = document.createElement('div'); overlay.className = 'qa-overlay'; overlay.style.display='none';
      const modal = document.createElement('div'); modal.className = 'qa-modal';
      modal.innerHTML = `
        <form class="qa-form">
          <div><label>Time <input type="time" name="time"></label></div>
          <div><label>Title <input type="text" name="title" placeholder="Event title"></label></div>
          <div style="display:flex;gap:8px;margin-top:8px;justify-content:flex-end;">
            <button type="button" class="qa-cancel">Cancel</button>
            <button type="submit" class="qa-add">Add</button>
          </div>
        </form>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const form = modal.querySelector('.qa-form');
      const cancel = modal.querySelector('.qa-cancel');

      cancel.addEventListener('click', ()=>{ overlay.style.display='none'; });
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const formData = new FormData(form);
        const time = formData.get('time') || '';
        const title = (formData.get('title') || '').trim();
        const date = overlay.dataset.date;
        if(!title){ form.querySelector('input[name="title"]').focus(); return; }
        const newEv = { id: `local-${Date.now()}`, title, time, date };
        eventsForThisTrip.unshift(newEv);
        saveEventsToStorage(trip.id, eventsForThisTrip);
        overlay.style.display='none';
        render();
      });

      _quickAddModal = overlay;
      return _quickAddModal;
    }
    function showQuickAddModal(date){ const m = ensureQuickAddModal(); m.dataset.date = date; m.querySelector('input[name="time"]').value=''; m.querySelector('input[name="title"]').value=''; m.style.display='flex'; m.querySelector('input[name="title"]').focus(); }

    // Delete confirmation modal: create once and reuse
    let _confirmDeleteModal = null;
    function ensureConfirmDeleteModal(){
      if(_confirmDeleteModal) return _confirmDeleteModal;
      const overlay = document.createElement('div'); overlay.className = 'cd-overlay'; overlay.style.display='none';
      const modal = document.createElement('div'); modal.className = 'cd-modal';
      modal.innerHTML = `
        <div class="cd-header">
          <h3>Remove Event?</h3>
        </div>
        <div class="cd-body">
          <p>Are you sure you want to remove "<span class="cd-event-title"></span>"?</p>
        </div>
        <div class="cd-footer">
          <button type="button" class="cd-cancel btn">Cancel</button>
          <button type="button" class="cd-confirm btn btn-danger">Remove</button>
        </div>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const cancelBtn = modal.querySelector('.cd-cancel');
      const confirmBtn = modal.querySelector('.cd-confirm');

      cancelBtn.addEventListener('click', ()=>{ overlay.style.display='none'; });
      confirmBtn.addEventListener('click', ()=>{
        const eventId = overlay.dataset.eventId;
        const idx = eventsForThisTrip.findIndex(e => e.id === eventId);
        if(idx >= 0){
          eventsForThisTrip.splice(idx, 1);
          saveEventsToStorage(trip.id, eventsForThisTrip);
          render();
        }
        overlay.style.display='none';
      });

      _confirmDeleteModal = overlay;
      return _confirmDeleteModal;
    }
    function showConfirmDeleteModal(eventId, eventTitle){ const m = ensureConfirmDeleteModal(); m.dataset.eventId = eventId; m.querySelector('.cd-event-title').textContent = eventTitle; m.style.display='flex'; m.querySelector('.cd-confirm').focus(); }

    // Compute the week that contains the trip.startDate. Week starts Monday.
    function startOfWeekMonday(d){
      const date = new Date(d);
      const day = date.getDay(); // 0=Sun,1=Mon...
      const diff = (day === 0) ? -6 : (1 - day); // if Sunday, go back 6 days
      date.setDate(date.getDate() + diff);
      date.setHours(0,0,0,0);
      return date;
    }

    function addDays(d, n){ const x = new Date(d); x.setDate(x.getDate()+n); return x; }
    function iso(d){ return d.toISOString().slice(0,10); }

    // start the week view on the trip's start date (so the first panel
    // corresponds to the trip start) rather than always starting on Monday.
    // Use mutable `let` so an Edit Dates control can update these values.
    let tripStart = new Date(trip.startDate + 'T00:00:00');
    let tripEnd = new Date(trip.endDate + 'T00:00:00');
    let weekStart = new Date(trip.startDate + 'T00:00:00');

    // Compute the latest allowed weekStart so the final 7-day window
    // always includes the trip end. That is: lastWindowStart = tripEnd - 6 days,
    // but never earlier than tripStart.
    function getLastWindowStart(){
      const candidate = addDays(tripEnd, -6);
      return candidate < tripStart ? new Date(tripStart) : candidate;
    }

    function render(){
      listEl.innerHTML = '';
      // render directly into the `#week-columns` grid container

      // First column: trip header
      const headerCol = document.createElement('div'); headerCol.className = 'week-column week-column--header';
      const headerInner = document.createElement('div'); headerInner.className = 'week-column__inner';
      // Insert a line break after the dash so the end date appears on the next line.
      // Keep the header simple and styled like the other panels (no extra event card).
      headerInner.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div>
            <h3 class="trip-title">${trip.title}</h3>
            <div class="trip-dates">${toShort(trip.startDate)} —<br>${toShort(trip.endDate)}</div>
            <div style="margin-top:8px;"><button class="btn edit-dates-btn" type="button" aria-label="Edit trip dates">Edit Dates</button></div>
          </div>
          <div style="text-align:right;">
            <!-- Header-cell demo reset removed; top-header control is used instead -->
          </div>
        </div>
      `;
      headerCol.appendChild(headerInner);
      listEl.appendChild(headerCol);

      // Attach handler for the header Edit Dates button (if present)
      try {
        const editBtn = headerInner.querySelector('.edit-dates-btn');
        if (editBtn) {
          editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            // Prompt user for new start/end dates (YYYY-MM-DD). This is a
            // lightweight inline editor; validation is minimal.
            const curStart = trip.startDate;
            const curEnd = trip.endDate;
            const newStart = prompt('Enter new start date (YYYY-MM-DD):', curStart);
            if (!newStart) return;
            const newEnd = prompt('Enter new end date (YYYY-MM-DD):', curEnd);
            if (!newEnd) return;
            const s = new Date(newStart + 'T00:00:00');
            const eDate = new Date(newEnd + 'T00:00:00');
            if (isNaN(s.getTime()) || isNaN(eDate.getTime()) || s > eDate) { alert('Invalid dates entered. Please use YYYY-MM-DD and ensure start <= end.'); return; }
            // Update trip data in-memory and recompute window bounds
            try {
              trip.startDate = newStart;
              trip.endDate = newEnd;
              tripStart = new Date(trip.startDate + 'T00:00:00');
              tripEnd = new Date(trip.endDate + 'T00:00:00');
              weekStart = new Date(trip.startDate + 'T00:00:00');
              // Re-render with updated dates
              render();
            } catch(err) { console.warn('[week] edit dates failed', err); }
          });
        }
      } catch(e) { /* ignore */ }

      // Populate Demo Reset into the top site header (only on itinerary pages).
      // The header partial is injected asynchronously by `include.js`, so try a
      // few times before giving up to ensure the container exists.
      (function attachDemoResetToHeader(attempt){
        try { console.info('[week] attachDemoReset attempt', attempt||0); } catch(e){}
        const demoContainer = document.getElementById('demo-reset-container');
        const headerContainer = document.querySelector('.site-header .container');
        const siteHeader = document.querySelector('.site-header');
        // Prefer attaching to the `.site-header` element itself so the button
        // reliably overlays the header area and isn't constrained by child boxes.
        const targetContainer = siteHeader || headerContainer || demoContainer || document.body;

        if (targetContainer) {
          // make sure the container is positioned so our absolute button can align
          try { targetContainer.style.position = targetContainer.style.position || 'relative'; } catch(e){}
          try {
            if (demoContainer) {
              // If the placeholder was left hidden via inline style, force it visible
              try {
                const cs = getComputedStyle(demoContainer);
                if (cs && cs.display === 'none') demoContainer.style.display = 'flex';
                else demoContainer.style.display = demoContainer.style.display || '';
              } catch(e) {
                demoContainer.style.display = demoContainer.style.display || '';
              }
            }
          } catch(e){}

          if (!targetContainer.querySelector('.demo-reset-btn-top')) {
            const btn = document.createElement('button');
            btn.className = 'demo-reset-btn-top link-white';
            btn.type = 'button';
            btn.setAttribute('aria-label', 'Demo Reset to repo seed');
            btn.title = 'Demo Reset to repo seed';
            btn.textContent = 'Demo Reset';
            btn.addEventListener('click', (e)=>{
              e.stopPropagation();
              if (perTripSeed && perTripSeed.length){
                try{
                  saveEventsToStorage(trip.id, perTripSeed);
                  eventsForThisTrip.length = 0;
                  eventsForThisTrip.push(...perTripSeed);
                  console.info('[week] Demo Reset: wrote', perTripSeed.length, 'events to storage');
                  render();
                }catch(err){ console.warn('[week] reset failed', err); alert('Reset failed - see console for details.'); }
              } else {
                alert('No per-trip seed file available to reset.');
              }
            });
            targetContainer.appendChild(btn);
            try { console.info('[week] Demo Reset attached to', targetContainer.tagName, targetContainer.id||targetContainer.className); } catch(e){}
          }
        } else if ((attempt||0) < 10) {
          setTimeout(()=> attachDemoResetToHeader((attempt||0)+1), 160);
        } else {
          try { console.warn('[week] failed to attach Demo Reset after retries'); } catch(e){}
        }
      })();

      // Next 7 columns: Monday..Sunday
      for(let i=0;i<7;i++){
        const dayDate = addDays(weekStart, i);
        const dayIso = iso(dayDate);
        const dayHref = `${basePath()}/pages/ItineraryDay.html?trip=${encodeURIComponent(trip.id)}&date=${encodeURIComponent(dayIso)}`;
        const col = document.createElement('div'); col.className = 'week-column';
        const inner = document.createElement('div'); inner.className = 'week-column__inner';
        // Place day name and date as a link so clicking the day opens Day view
        inner.innerHTML = `<div class="day-header"><div class="day-name"><a href="${dayHref}" class="day-link link-black">${toDay(dayIso)}, ${dayDate.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</a></div><button class="btn day-add btn-secondary" data-date="${dayIso}" aria-label="Add event">+</button></div>`;

        // find events for this date and show a compact preview (top 3)
        const todays = eventsForThisTrip.filter(ev => ev.date === dayIso).sort((a,b)=> (a.time||'').localeCompare(b.time||''));
        const SHOW = 3;
        if(todays.length){
          todays.slice(0, SHOW).forEach(ev =>{
            const card = document.createElement('div'); card.className='event-item';
            card.innerHTML = `<div class="event-time">${ev.time || ''}</div><div class="event-title">${ev.title}</div><button class="btn event-remove" data-event-id="${ev.id}" aria-label="Remove event" title="Remove event">×</button>`;
            inner.appendChild(card);
            
            // Attach remove handler
            const removeBtn = card.querySelector('.event-remove');
            if(removeBtn){
              removeBtn.addEventListener('click', (e)=>{
                e.stopPropagation();
                const eventId = removeBtn.dataset.eventId;
                const eventTitle = ev.title;
                showConfirmDeleteModal(eventId, eventTitle);
              });
            }
          });
          const hidden = todays.length - SHOW;
          if(hidden > 0){
            const moreHref = dayHref;
            const moreLink = document.createElement('a');
            moreLink.className = 'day-more-btn';
            moreLink.href = moreHref;
            moreLink.setAttribute('aria-controls', `day-${dayIso}-list`);
            moreLink.setAttribute('aria-expanded', 'false');
            moreLink.textContent = `+${hidden} more`;
            inner.appendChild(moreLink);
          }
        } else {
          const empty = document.createElement('div'); empty.className='day-empty'; empty.textContent = 'No events'; inner.appendChild(empty);
        }

        // attach quick-add handler for this day
        const addBtn = inner.querySelector('.day-add');
        if(addBtn){ addBtn.addEventListener('click', (e)=>{ e.stopPropagation(); showQuickAddModal(dayIso); }); }

        col.appendChild(inner);
        listEl.appendChild(col);
      }

      // update week-range control
      const weekRangeEl = document.getElementById('week-range');
      if(weekRangeEl){
        const startStr = toShort(iso(weekStart));
        const endStr = toShort(iso(addDays(weekStart,6)));
        // render the date range and the window indicator on one line
        try {
          const lastWindowStart = getLastWindowStart();
          const msPerDay = 24 * 60 * 60 * 1000;
          const totalWindows = Math.floor(((lastWindowStart - tripStart) / (7 * msPerDay))) + 1;
          const currentWindowIndex = Math.floor(((weekStart - tripStart) / (7 * msPerDay))) + 1;
          // single-line: "Start — End · Viewing window X of Y"
          weekRangeEl.innerText = `${startStr} — ${endStr} · Viewing window ${currentWindowIndex} of ${totalWindows}`;
        } catch(e) {
          // fallback to simple range if anything goes wrong
          weekRangeEl.innerText = `${startStr} — ${endStr}`;
        }
      }

      // disable prev/next when at trip bounds so navigation steps by 7 days
      // only when there are more trip days to show.
      try {
        const lastWindowStart = getLastWindowStart();
        if(typeof prevBtn !== 'undefined' && prevBtn){
          const prevDisabled = (weekStart <= tripStart);
          prevBtn.setAttribute('aria-disabled', prevDisabled ? 'true' : 'false');
          prevDisabled ? prevBtn.classList.add('disabled') : prevBtn.classList.remove('disabled');
        }
        if(typeof nextBtn !== 'undefined' && nextBtn){
          const nextDisabled = (weekStart >= lastWindowStart);
          nextBtn.setAttribute('aria-disabled', nextDisabled ? 'true' : 'false');
          nextDisabled ? nextBtn.classList.add('disabled') : nextBtn.classList.remove('disabled');
        }
      } catch(e) { /* ignore if buttons not present */ }
    }

    // prev/next
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');
    if(prevBtn) prevBtn.addEventListener('click', (e)=>{ 
      if(e && e.preventDefault) e.preventDefault();
      if(prevBtn.getAttribute('aria-disabled') === 'true') return;
      const candidate = addDays(weekStart, -7);
      weekStart = candidate < tripStart ? new Date(tripStart) : candidate;
      render();
    });
    if(nextBtn) nextBtn.addEventListener('click', (e)=>{ 
      if(e && e.preventDefault) e.preventDefault();
      if(nextBtn.getAttribute('aria-disabled') === 'true') return;
      const candidate = addDays(weekStart, 7);
      const last = getLastWindowStart();
      weekStart = candidate > last ? new Date(last) : candidate;
      render();
    });

    render();
  })();
})();
