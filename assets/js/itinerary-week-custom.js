(function(){
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
          <a href="${basePath()}/pages/EventInfo.html?id=${encodeURIComponent(act.id)}" class="day-title">${title}</a>
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

    // Prepare events: take candidates (prefer same-location) and assign random
    // dates within the trip range so the week view shows sample events.
    const allEvents = events || [];
    const tripDays = eachDate(trip.startDate, trip.endDate);
    const candidates = allEvents.filter(ev => ev.location === trip.title);
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

    // Limit generated events to roughly two per day to avoid overcrowding
    const maxEvents = tripDays.length * 2;
    // Shuffle pool (Fisher-Yates) using deterministic RNG
    for(let i=pool.length-1;i>0;i--){ const j = Math.floor(rand() * (i+1)); [pool[i],pool[j]] = [pool[j],pool[i]]; }

    const eventsForThisTrip = [];
    for(let i=0;i<Math.min(pool.length, maxEvents); i++){
      const ev = Object.assign({}, pool[i]);
      // assign a random date within the trip (ISO yyyy-mm-dd)
      ev.date = randomDateBetween(trip.startDate, trip.endDate);
      // keep time if present, otherwise random hour between 9 and 20
      if(!ev.time) ev.time = `${randInt(9,20)}:00`;
      eventsForThisTrip.push(ev);
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

    // Permanent prototype sample events for a specific trip id.
    // These are static and will always be used for the Calgary prototype trip.
    if (trip.id === 'trip-calgary-2026') {
      eventsForThisTrip.length = 0;
      eventsForThisTrip.push(
        { id: 'sample-calgary-1', title: 'Heritage Walk', time: '08:30', date: '2026-05-03' },
        { id: 'sample-calgary-2', title: 'Riverside Brunch', time: '11:00', date: '2026-05-03' },
        { id: 'sample-calgary-3', title: 'Mountain Day Tour', time: '09:00', date: '2026-05-08' },
        { id: 'sample-calgary-4', title: 'Art Gallery', time: '14:00', date: '2026-05-08' },
        { id: 'sample-calgary-5', title: 'Evening Concert', time: '19:30', date: '2026-05-08' },
        { id: 'sample-calgary-6', title: 'Farewell Dinner', time: '18:00', date: '2026-05-12' }
      );
    }

    // --- localStorage persistence helpers ---
    function storageKey(tid){ return `events-${tid}`; }
    function loadSavedEvents(tid){ try{ const raw = localStorage.getItem(storageKey(tid)); return raw ? JSON.parse(raw) : null; } catch(e){ return null; } }
    function saveEventsToStorage(tid, events){ try{ localStorage.setItem(storageKey(tid), JSON.stringify(events)); } catch(e){ /* ignore */ } }

    // If user has saved events in localStorage, prefer those (local edits persist).
    const saved = loadSavedEvents(trip.id);
    if(Array.isArray(saved) && saved.length){
      eventsForThisTrip.length = 0;
      eventsForThisTrip.push(...saved);
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

    const tripStart = new Date(trip.startDate + 'T00:00:00');
    let weekStart = startOfWeekMonday(tripStart);

    function render(){
      listEl.innerHTML = '';
      // render directly into the `#week-columns` grid container

      // First column: trip header
      const headerCol = document.createElement('div'); headerCol.className = 'week-column week-column--header';
      const headerInner = document.createElement('div'); headerInner.className = 'week-column__inner';
      // Insert a line break after the dash so the end date appears on the next line.
      // Keep the header simple and styled like the other panels (no extra event card).
      headerInner.innerHTML = `
        <h3 class="trip-title">${trip.title}</h3>
        <div class="trip-dates">${toShort(trip.startDate)} —<br>${toShort(trip.endDate)}</div>
      `;
      headerCol.appendChild(headerInner);
      listEl.appendChild(headerCol);

      // Next 7 columns: Monday..Sunday
      for(let i=0;i<7;i++){
        const dayDate = addDays(weekStart, i);
        const dayIso = iso(dayDate);
        const col = document.createElement('div'); col.className = 'week-column';
        const inner = document.createElement('div'); inner.className = 'week-column__inner';
        // Place day name and date as separate elements so CSS can keep them on one line
        // Combine weekday and short date into one element so they render continuously
        inner.innerHTML = `<div class="day-header"><div class="day-name">${toDay(dayIso)}, ${dayDate.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</div><button class="day-add" data-date="${dayIso}" aria-label="Add event">+</button></div>`;

        // find events for this date and show a compact preview (top 3)
        const todays = eventsForThisTrip.filter(ev => ev.date === dayIso).sort((a,b)=> (a.time||'').localeCompare(b.time||''));
        const SHOW = 3;
        if(todays.length){
          todays.slice(0, SHOW).forEach(ev =>{
            const card = document.createElement('div'); card.className='event-item';
            card.innerHTML = `<div class="event-time">${ev.time || ''}</div><div class="event-title">${ev.title}</div>`;
            inner.appendChild(card);
          });
          const hidden = todays.length - SHOW;
          if(hidden > 0){
            const moreHref = `${basePath()}/pages/ItineraryDay.html?trip=${encodeURIComponent(trip.id)}&date=${encodeURIComponent(dayIso)}`;
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
        // use innerHTML so the break after the dash can be honoured if desired
        weekRangeEl.innerHTML = `${startStr} —<br>${endStr}`;
      }
    }

    // prev/next
    const prevBtn = document.getElementById('prev-week');
    const nextBtn = document.getElementById('next-week');
    if(prevBtn) prevBtn.addEventListener('click', (e)=>{ if(e && e.preventDefault) e.preventDefault(); weekStart = addDays(weekStart, -7); render(); });
    if(nextBtn) nextBtn.addEventListener('click', (e)=>{ if(e && e.preventDefault) e.preventDefault(); weekStart = addDays(weekStart, 7); render(); });

    render();
  })();
})();
