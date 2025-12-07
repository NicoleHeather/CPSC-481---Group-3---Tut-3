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
    const baseTrips = (await fetch(`${basePath()}/assets/data/trips.json`).then(r=>r.json())).trips || [];

    // Apply local edits from the Itineraries page (extras, deleted, overrides)
    const KEY_EXTRAS = 'itineraries.extras';
    const KEY_DELETED = 'itineraries.deleted';
    const KEY_OVERRIDES = 'itineraries.overrides';
    const loadJSON = (key)=>{ try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }catch(e){ return null; } };

    const extras = loadJSON(KEY_EXTRAS) || [];
    const deleted = new Set((loadJSON(KEY_DELETED) || []));
    const overrides = loadJSON(KEY_OVERRIDES) || {};

    let merged = baseTrips.concat(extras.map(t=>Object.assign({isExtra:true}, t)));
    merged = merged.filter(t => !deleted.has(t.id));
    merged = merged.map(t => overrides[t.id] ? Object.assign({}, t, overrides[t.id]) : t);

    return merged;
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

  // Convert 24-hour time (HH:MM) to 12-hour format with AM/PM
  function to12Hour(time24){
    if(!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2,'0')} ${period}`;
  }

  // Calculate end time given start time and duration in hours
  function calculateEndTime(startTime, durationHours){
    if(!startTime || !durationHours) return '';
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + (parseFloat(durationHours) * 60);
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = Math.floor(totalMinutes % 60);
    return `${endHours.toString().padStart(2,'0')}:${endMinutes.toString().padStart(2,'0')}`;
  }

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
          <span class="day-title">${title}</span>
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

    // Store original trip dates for demo reset
    const perTripStartDate = trip.startDate;
    const perTripEndDate = trip.endDate;

    const allEvents = events || [];
    const tripDays = eachDate(trip.startDate, trip.endDate);
    let eventsForThisTrip = [];
    let perTripSeed = null;
    if (trip.isExtra) {
      // User-created itinerary: start blank
      eventsForThisTrip = [];
    } else {
      // Original trip: keep existing seeding logic
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
      for(let i=pool.length-1;i>0;i--){ const j = Math.floor(rand() * (i+1)); [pool[i],pool[j]] = [pool[j],pool[i]]; }
      eventsForThisTrip = [];
      let poolIndex = 0;
      for(let d=0; d<tripDays.length; d++){
        const dayIso = tripDays[d];
        const count = Math.floor(rand() * 6);
        for(let k=0;k<count;k++){
          if(poolIndex >= pool.length) break;
          const ev = Object.assign({}, pool[poolIndex++]);
          ev.date = dayIso;
          if(!ev.time) ev.time = `${randInt(9,20)}:00`;
          eventsForThisTrip.push(ev);
        }
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

    // Register a custom Demo Reset handler so the shared header button restores per-trip seed data
    const weekDemoResetHandler = () => {
        try {
          localStorage.removeItem('itineraries.extras');
          localStorage.removeItem('itineraries.deleted');
          localStorage.removeItem('itineraries.overrides');
          // clear any cached events across trips (events. or events- prefixes)
          Object.keys(localStorage).forEach((key)=>{
            if (key.startsWith('events.') || key.startsWith('events-')) {
              localStorage.removeItem(key);
            }
          });
        } catch(err) { console.warn('[week] demo reset: failed to clear itinerary state', err); }

        if (perTripSeed && perTripSeed.length){
          try{
            saveEventsToStorage(trip.id, perTripSeed);
            eventsForThisTrip.length = 0;
            eventsForThisTrip.push(...perTripSeed);
            // Also reset trip dates to original values
            trip.startDate = perTripStartDate || trip.startDate;
            trip.endDate = perTripEndDate || trip.endDate;
            tripStart = new Date(trip.startDate + 'T00:00:00');
            tripEnd = new Date(trip.endDate + 'T00:00:00');
            weekStart = new Date(trip.startDate + 'T00:00:00');
          }catch(err){ console.warn('[week] reset failed', err); alert('Reset failed - see console for details.'); return; }
        }

        // reload to ensure itinerary list pages also pick up cleared overrides
        location.reload();
    };

    // store handler for global demo-reset script (in case it loads later) and register if available now
    window.demoResetCustomHandler = weekDemoResetHandler;
    if (typeof window.setDemoResetHandler === 'function') {
      window.setDemoResetHandler(weekDemoResetHandler);
    }

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

    // Check for new event data from BookingRequest
    const newEventDataStr = sessionStorage.getItem('newEventData');
    const newEventTrip = sessionStorage.getItem('newEventTrip');
    let highlightEventId = null;
    
    if (newEventDataStr && newEventTrip === trip.id) {
      try {
        const newEventData = JSON.parse(newEventDataStr);
        
        // Extract start time - handle both 12-hour format with " - " separator
        let startTime = '14:00'; // default time
        const timeStr = newEventData.time || '';
        
        if (timeStr.includes(' - ')) {
          // Format: "2:00 PM - 4:00 PM"
          const startPart = timeStr.split(' - ')[0].trim();
          // Convert 12-hour to 24-hour if needed
          const match = startPart.match(/^(\d+):(\d+)\s?(AM|PM)?$/i);
          if (match) {
            let hours = parseInt(match[1]);
            const minutes = match[2];
            const period = match[3]?.toUpperCase();
            
            if (period) {
              if (period === 'PM' && hours !== 12) hours += 12;
              if (period === 'AM' && hours === 12) hours = 0;
            }
            startTime = `${String(hours).padStart(2, '0')}:${minutes}`;
          }
        } else if (timeStr.match(/^\d+:\d+$/)) {
          // Already in 24-hour format
          startTime = timeStr;
        }
        
        // Create a new event object with the booking request data
        const newEvent = {
          id: `booking-request-${Date.now()}`,
          title: newEventData.title,
          date: newEventData.date,
          time: startTime,
          location: trip.title,
          description: `Booking Request from ${newEventData.name}\nEmail: ${newEventData.email}\nPhone: ${newEventData.phone}\nGuests: ${newEventData.guests}`,
          duration: 2,
          isNew: true
        };
        
        // Add the new event to the events list
        eventsForThisTrip.push(newEvent);
        highlightEventId = newEvent.id;
        
        // Save the updated events to localStorage
        saveEventsToStorage(trip.id, eventsForThisTrip);
        
        // Clear sessionStorage
        sessionStorage.removeItem('newEventData');
        sessionStorage.removeItem('newEventTrip');
        
        console.info('[week] added new booking request event:', newEvent);
      } catch (e) {
        console.warn('[week] failed to add new event from booking request:', e);
        sessionStorage.removeItem('newEventData');
        sessionStorage.removeItem('newEventTrip');
      }
    }

    // Helper functions for time calculations (used by both Add Event and Event Detail modals)
    function calculateDuration(startTime, endTime) {
      if(!startTime || !endTime) return 1;
      const [startHour, startMin] = startTime.split(':').map(Number);
      const [endHour, endMin] = endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      let diff = endMinutes - startMinutes;
      if(diff < 0) diff += 24 * 60; // Handle overnight events
      return Math.max(0.5, Math.round((diff / 60) * 2) / 2); // Round to nearest 0.5
    }

    function calculateEndTimeFromDuration(startTime, durationHours) {
      const [startHour, startMin] = startTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const durationMinutes = parseFloat(durationHours) * 60;
      let endMinutes = startMinutes + durationMinutes;
      
      // Handle overflow past midnight
      if(endMinutes >= 24 * 60) endMinutes -= 24 * 60;
      
      const endHour = Math.floor(endMinutes / 60);
      const endMin = Math.floor(endMinutes % 60);
      return `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    }

    // Quick-add modal: create once and reuse (reusing event detail modal structure)
    let _quickAddModal = null;
    function ensureQuickAddModal(){
      if(_quickAddModal) return _quickAddModal;
      const overlay = document.createElement('div'); overlay.className = 'qa-overlay'; overlay.style.display='none';
      const modal = document.createElement('div'); modal.className = 'qa-modal evd-modal';
      modal.innerHTML = `
        <div class="evd-header qa-header">
          <h2>Add Event</h2>
        </div>
        <div class="evd-body qa-body">
          <div class="evd-field">
            <svg class="evd-label" title="Title" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
            <div>
              <input class="evd-input qa-input" type="text" name="title" placeholder="Event title" aria-label="Title">
              <span class="evd-error qa-title-error"></span>
            </div>
          </div>
          <div class="evd-field">
            <svg class="evd-label" title="Date" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <div>
              <input class="evd-input qa-input" type="date" name="date" aria-label="Date">
              <span class="evd-error qa-date-error"></span>
            </div>
          </div>
          <div class="evd-field evd-time-row">
            <svg class="evd-label" title="Time" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <div>
              <div class="evd-time-inputs">
                <input class="evd-input qa-input" type="time" name="time" aria-label="Start Time" placeholder="Start">
                <span class="evd-time-separator">–</span>
                <input class="evd-input qa-input" type="time" name="endTime" aria-label="End Time" placeholder="End">
              </div>
              <div class="evd-time-inputs">
                <span class="evd-error qa-time-error"></span>
                <span class="evd-time-separator" style="visibility:hidden">–</span>
                <span class="evd-error qa-endtime-error"></span>
              </div>
            </div>
          </div>
          <div class="evd-field">
            <svg class="evd-label" title="Location" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <div>
              <input class="evd-input qa-input" type="text" name="location" placeholder="Event location" aria-label="Location">
            </div>
          </div>
          <div class="evd-field">
            <svg class="evd-label" title="Category" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><circle cx="8" cy="8" r="1.5"></circle></svg>
            <div>
              <input class="evd-input qa-input" type="text" name="category" placeholder="e.g., Food, Culture" aria-label="Category">
            </div>
          </div>
          <div class="evd-field">
            <svg class="evd-label" title="Price" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <div>
              <input class="evd-input qa-input" type="number" name="price" placeholder="0 for free" min="0" step="0.01" aria-label="Price">
              <span class="evd-error qa-price-error"></span>
            </div>
          </div>
          <div class="evd-description-field">
            <svg class="evd-label" title="Description" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <div>
              <textarea class="evd-input qa-input" name="description" placeholder="Event details" rows="3" aria-label="Description"></textarea>
            </div>
          </div>
        </div>
        <div class="evd-footer qa-footer">
          <button type="button" class="btn qa-cancel">Cancel</button>
          <button type="button" class="btn qa-add">Add Event</button>
        </div>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const cancel = modal.querySelector('.qa-cancel');
      const addBtn = modal.querySelector('.qa-add');
      const titleInput = modal.querySelector('input[name="title"]');
      const dateInput = modal.querySelector('input[name="date"]');
      const timeInput = modal.querySelector('input[name="time"]');
      const endTimeInput = modal.querySelector('input[name="endTime"]');
      const priceInput = modal.querySelector('input[name="price"]');
      const titleError = modal.querySelector('.qa-title-error');
      const dateError = modal.querySelector('.qa-date-error');
      const timeError = modal.querySelector('.qa-time-error');
      const endTimeError = modal.querySelector('.qa-endtime-error');
      const priceError = modal.querySelector('.qa-price-error');

      function showFieldError(input, errorEl, message) {
        if(input && errorEl) {
          input.classList.add('evd-invalid');
          errorEl.innerHTML = `<svg viewBox="0 0 16 16" fill="none" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"><circle cx="8" cy="8" r="7" fill="#ff7f27"/><path d="M8 4v5M8 11h.01" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>${message}`;
        }
      }

      function clearFieldError(input, errorEl) {
        if(input && errorEl) {
          input.classList.remove('evd-invalid');
          errorEl.textContent = '';
        }
      }

      // Real-time validation
      titleInput.addEventListener('input', () => {
        const trimmed = titleInput.value.trim();
        if(trimmed) {
          clearFieldError(titleInput, titleError);
        } else {
          showFieldError(titleInput, titleError, 'Title cannot be empty');
        }
      });

      timeInput.addEventListener('input', () => {
        if(timeInput.value) {
          clearFieldError(timeInput, timeError);
        } else {
          showFieldError(timeInput, timeError, 'Start time is required');
        }
      });
      
      endTimeInput.addEventListener('input', () => {
        if(!endTimeInput.value) {
          showFieldError(endTimeInput, endTimeError, 'End time is required');
        } else if(timeInput.value) {
          const [startH, startM] = timeInput.value.split(':').map(Number);
          const [endH, endM] = endTimeInput.value.split(':').map(Number);
          const startMins = startH * 60 + startM;
          const endMins = endH * 60 + endM;
          if(endMins <= startMins && endMins !== 0) {
            showFieldError(endTimeInput, endTimeError, 'End time must be after start time');
          } else {
            clearFieldError(endTimeInput, endTimeError);
          }
        } else {
          clearFieldError(endTimeInput, endTimeError);
        }
      });

      priceInput.addEventListener('input', () => {
        const val = priceInput.value.trim();
        if(val === '' || (!isNaN(val) && parseFloat(val) >= 0)) {
          clearFieldError(priceInput, priceError);
        }
      });

      cancel.addEventListener('click', ()=>{ overlay.style.display='none'; });
      
      addBtn.addEventListener('click', ()=>{
        // Clear all errors first
        clearFieldError(titleInput, titleError);
        clearFieldError(timeInput, timeError);
        clearFieldError(endTimeInput, endTimeError);
        clearFieldError(priceInput, priceError);
        
        const title = titleInput.value.trim();
        const date = dateInput.value || overlay.dataset.date;
        const time = timeInput.value || '';
        const endTime = endTimeInput.value || '';
        const locationVal = modal.querySelector('input[name="location"]').value.trim();
        const categoryVal = modal.querySelector('input[name="category"]').value.trim();
        const priceVal = priceInput.value || '';
        const description = modal.querySelector('textarea[name="description"]').value.trim();
        
        let hasError = false;
        
        // Validate title
        if(!title){
          showFieldError(titleInput, titleError, 'Title cannot be empty');
          hasError = true;
        }
        
        // Validate start time
        if(!time){
          showFieldError(timeInput, timeError, 'Start time is required');
          hasError = true;
        }
        
        // Validate end time
        if(!endTime){
          showFieldError(endTimeInput, endTimeError, 'End time is required');
          hasError = true;
        } else if(time && endTime) {
          // Check if end time is after start time (or handle overnight)
          const [startH, startM] = time.split(':').map(Number);
          const [endH, endM] = endTime.split(':').map(Number);
          const startMins = startH * 60 + startM;
          const endMins = endH * 60 + endM;
          if(endMins <= startMins && endMins !== 0) { // Allow 00:00 as valid end time
            showFieldError(endTimeInput, endTimeError, 'End time must be after start time');
            hasError = true;
          }
        }
        
        // Validate price
        if(priceVal && (isNaN(priceVal) || parseFloat(priceVal) < 0)){
          showFieldError(priceInput, priceError, 'Must be a valid positive number');
          hasError = true;
        }
        
        if(hasError) {
          return;
        }
        
        // Calculate duration automatically
        const duration = calculateDuration(time, endTime);
        
        const newEv = { 
          id: `local-${Date.now()}`, 
          title, 
          time, 
          date,
          duration: String(duration),
          location: locationVal || '',
          category: categoryVal || '',
          price: parseFloat(priceVal) || 0,
          description: description || ''
        };
        eventsForThisTrip.unshift(newEv);
        saveEventsToStorage(trip.id, eventsForThisTrip);
        overlay.style.display='none';
        render();
      });

      _quickAddModal = overlay;
      return _quickAddModal;
    }
    function showQuickAddModal(date){ 
      const m = ensureQuickAddModal(); 
      m.dataset.date = date;
      
      // Clear all inputs
      m.querySelector('input[name="title"]').value = '';
      m.querySelector('input[name="date"]').value = date;
      m.querySelector('input[name="time"]').value = '';
      m.querySelector('input[name="endTime"]').value = '';
      m.querySelector('input[name="location"]').value = '';
      m.querySelector('input[name="category"]').value = '';
      m.querySelector('input[name="price"]').value = '';
      m.querySelector('textarea[name="description"]').value = '';
      // Clear all errors
      m.querySelector('.qa-title-error').textContent = '';
      m.querySelector('.qa-date-error').textContent = '';
      m.querySelector('.qa-time-error').textContent = '';
      m.querySelector('.qa-endtime-error').textContent = '';
      m.querySelector('.qa-price-error').textContent = '';
      m.style.display='flex'; 
      m.querySelector('input[name="title"]').focus(); 
    }

    // Delete confirmation modal: create once and reuse
    let _confirmDeleteModal = null;
    function ensureConfirmDeleteModal(){
      if(_confirmDeleteModal) return _confirmDeleteModal;
      const overlay = document.createElement('div'); overlay.className = 'cd-overlay'; overlay.style.display='none';
      const modal = document.createElement('div'); modal.className = 'cd-modal';
      modal.innerHTML = `
        <div class="cd-header">
          <h2>Remove Event?</h2>
        </div>
        <div class="cd-body">
          <p>Are you sure you want to remove "<span class="cd-event-title"></span>"?</p>
        </div>
        <div class="cd-footer">
          <button type="button" class="cd-cancel btn">Cancel</button>
          <button type="button" class="cd-confirm btn">Remove</button>
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
        // Close event detail modal if it's open
        const eventDetailOverlay = _eventDetailModal;
        if(eventDetailOverlay) {
          eventDetailOverlay.style.display='none';
        }
      });

      _confirmDeleteModal = overlay;
      return _confirmDeleteModal;
    }
    function showConfirmDeleteModal(eventId, eventTitle){ const m = ensureConfirmDeleteModal(); m.dataset.eventId = eventId; m.querySelector('.cd-event-title').textContent = eventTitle; m.style.display='flex'; m.querySelector('.cd-confirm').focus(); }

    // Generic confirmation dialog
    function showConfirmDialog(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
      return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'cd-overlay';
        overlay.style.display = 'flex';
        
        const modal = document.createElement('div');
        modal.className = 'cd-modal';
        
        const cancelBtn = cancelText ? `<button type="button" class="cd-cancel btn">${cancelText}</button>` : '';
        
        modal.innerHTML = `
          <div class="cd-header">
            <h3>${title}</h3>
          </div>
          <div class="cd-body">
            <p>${message}</p>
          </div>
          <div class="cd-footer">
            ${cancelBtn}
            <button type="button" class="cd-confirm btn">${confirmText}</button>
          </div>
        `;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        const cleanup = () => {
          overlay.remove();
        };
        
        const cancelButton = modal.querySelector('.cd-cancel');
        if(cancelButton) {
          cancelButton.addEventListener('click', () => {
            cleanup();
            resolve(false);
          });
        }
        
        modal.querySelector('.cd-confirm').addEventListener('click', () => {
          cleanup();
          resolve(true);
        });
        
        overlay.addEventListener('click', (e) => {
          if (e.target === overlay && cancelText) {
            cleanup();
            resolve(false);
          }
        });
      });
    }

    // Edit dates modal: create once and reuse
    let _editDatesModal = null;
    let _editDatesCallback = null;
    function ensureEditDatesModal(){
      if(_editDatesModal) return _editDatesModal;
      const overlay = document.createElement('div'); overlay.className = 'ed-overlay'; overlay.style.display='none';
      const modal = document.createElement('div'); modal.className = 'ed-modal';
      modal.innerHTML = `
        <div class="ed-header">
          <h2>Edit Trip Dates</h2>
        </div>
        <form class="ed-form">
          <div class="form-group">
            <label for="ed-start">Start Date</label>
            <input type="date" id="ed-start" name="startDate" required>
          </div>
          <div class="form-group">
            <label for="ed-end">End Date</label>
            <input type="date" id="ed-end" name="endDate" required>
          </div>
          <div class="ed-footer">
            <button type="button" class="ed-cancel btn">Cancel</button>
            <button type="submit" class="ed-save btn">Update Dates</button>
          </div>
        </form>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const form = modal.querySelector('.ed-form');
      const cancelBtn = modal.querySelector('.ed-cancel');

      cancelBtn.addEventListener('click', ()=>{ overlay.style.display='none'; });
      form.addEventListener('submit', (e)=>{
        e.preventDefault();
        const formData = new FormData(form);
        const newStart = formData.get('startDate');
        const newEnd = formData.get('endDate');
        if(!newStart || !newEnd){ form.querySelector('input[name="startDate"]').focus(); return; }
        const s = new Date(newStart + 'T00:00:00');
        const eDate = new Date(newEnd + 'T00:00:00');
        if(isNaN(s.getTime()) || isNaN(eDate.getTime()) || s > eDate){ alert('Invalid dates. Please ensure start date is before end date.'); return; }
        if(_editDatesCallback){ _editDatesCallback(newStart, newEnd); }
        overlay.style.display='none';
      });

      _editDatesModal = overlay;
      return _editDatesModal;
    }
    function showEditDatesModal(startDate, endDate, callback){ 
      const m = ensureEditDatesModal(); 
      _editDatesCallback = callback;
      m.querySelector('input[name="startDate"]').value = startDate;
      m.querySelector('input[name="endDate"]').value = endDate;
      m.style.display='flex'; 
      m.querySelector('input[name="startDate"]').focus(); 
    }

    // Confirm date change modal: create once and reuse
    let _confirmDateChangeModal = null;
    let _confirmDateChangeCallback = null;
    function ensureConfirmDateChangeModal(){
      if(_confirmDateChangeModal) return _confirmDateChangeModal;
      const overlay = document.createElement('div'); overlay.className = 'cdc-overlay'; overlay.style.display='none';
      const modal = document.createElement('div'); modal.className = 'cdc-modal';
      modal.innerHTML = `
        <div class="cdc-header">
          <h2>Events Will Be Removed</h2>
        </div>
        <div class="cdc-body">
          <p>Changing the dates will remove <span class="cdc-event-count"></span> event(s) that fall outside the new date range.</p>
          <p>Continue anyway?</p>
        </div>
        <div class="cdc-footer">
          <button type="button" class="cdc-cancel btn">Cancel</button>
          <button type="button" class="cdc-confirm btn">Remove Events & Update Dates</button>
        </div>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const cancelBtn = modal.querySelector('.cdc-cancel');
      const confirmBtn = modal.querySelector('.cdc-confirm');

      cancelBtn.addEventListener('click', ()=>{ overlay.style.display='none'; });
      confirmBtn.addEventListener('click', ()=>{
        if(_confirmDateChangeCallback){ _confirmDateChangeCallback(); }
        overlay.style.display='none';
      });

      _confirmDateChangeModal = overlay;
      return _confirmDateChangeModal;
    }
    function showConfirmDateChangeModal(eventCount, callback){ 
      const m = ensureConfirmDateChangeModal(); 
      _confirmDateChangeCallback = callback;
      m.querySelector('.cdc-event-count').textContent = eventCount;
      m.style.display='flex'; 
      m.querySelector('.cdc-confirm').focus(); 
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // Event Detail Modal
    // ─────────────────────────────────────────────────────────────────────────────
    let _eventDetailModal = null;
    function ensureEventDetailModal(){
      if(_eventDetailModal) return _eventDetailModal;
      const overlay = document.createElement('div'); overlay.className='evd-overlay'; overlay.style.display='none';
      const modal = document.createElement('div'); modal.className='evd-modal';
      modal.innerHTML = `
        <div class="evd-header">
          <h2>Event Details</h2>
          <div class="evd-header-actions">
            <button type="button" class="evd-edit-icon" title="Edit event" aria-label="Edit event">✎</button>
            <div class="evd-menu-container">
              <button type="button" class="evd-menu-btn" title="More options" aria-label="More options">⋮</button>
              <div class="evd-menu-dropdown">
                <button type="button" class="evd-menu-item evd-remove-menu" data-action="remove">Remove Event</button>
              </div>
            </div>
          </div>
        </div>
        <div class="evd-body">
          <div class="evd-image-container"></div>
          <div class="evd-field">
            <svg class="evd-label" title="Title" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
            <div>
              <span class="evd-title evd-view"></span>
              <input class="evd-input evd-title-input evd-edit-field" type="text" aria-label="Title">
              <span class="evd-error evd-title-error"></span>
            </div>
          </div>
          <div class="evd-field">
            <svg class="evd-label" title="Date" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <div>
              <span class="evd-date evd-view"></span>
              <input class="evd-input evd-date-input evd-edit-field" type="date" aria-label="Date">
              <span class="evd-error evd-date-error"></span>
            </div>
          </div>
          <div class="evd-field evd-time-row">
            <svg class="evd-label" title="Time" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <div>
              <span class="evd-time evd-view"></span>
              <div class="evd-time-inputs evd-edit-field">
                <input class="evd-input evd-time-input" type="time" aria-label="Start Time">
                <span class="evd-time-separator">–</span>
                <input class="evd-input evd-endtime-input" type="time" aria-label="End Time">
              </div>
              <div class="evd-time-inputs evd-edit-field">
                <span class="evd-error evd-time-error"></span>
                <span class="evd-time-separator" style="visibility:hidden">–</span>
                <span class="evd-error evd-endtime-error"></span>
              </div>
            </div>
          </div>
          <div class="evd-field evd-location-field">
            <svg class="evd-label" title="Location" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <div>
              <span class="evd-location evd-view"></span>
              <input class="evd-input evd-location-input evd-edit-field" type="text" aria-label="Location">
            </div>
          </div>
          <div class="evd-field evd-category-field">
            <svg class="evd-label" title="Category" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><circle cx="8" cy="8" r="1.5"></circle></svg>
            <div>
              <span class="evd-category evd-view"></span>
              <input class="evd-input evd-category-input evd-edit-field" type="text" aria-label="Category">
            </div>
          </div>
          <div class="evd-field evd-price-field">
            <svg class="evd-label" title="Price" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            <div>
              <span class="evd-price evd-view"></span>
              <div class="evd-input-wrapper evd-price-wrapper">
                <input class="evd-input evd-price-input evd-edit-field" type="number" step="1" min="0" aria-label="Price" placeholder="0">
              </div>
              <span class="evd-error evd-price-error"></span>
            </div>
          </div>
          <div class="evd-description-field">
            <svg class="evd-label" title="Description" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <div>
              <p class="evd-description evd-view"></p>
              <textarea class="evd-input evd-description-input evd-edit-field" rows="3" aria-label="Description"></textarea>
            </div>
          </div>
        </div>
        <div class="evd-footer">
          <button type="button" class="btn evd-cancel evd-edit-mode">Cancel</button>
          <button type="button" class="btn evd-save evd-edit-mode">Save</button>
          <button type="button" class="btn evd-close evd-view-mode">Close</button>
        </div>
      `;
      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      const editBtn = modal.querySelector('.evd-edit-icon');
      const removeBtn = modal.querySelector('.evd-remove-menu');
      const menuBtn = modal.querySelector('.evd-menu-btn');
      const menuDropdown = modal.querySelector('.evd-menu-dropdown');
      const saveBtn = modal.querySelector('.evd-save');
      const cancelEditBtn = modal.querySelector('.evd-cancel');
      const closeBtn = modal.querySelector('.evd-close');

      const titleInput = modal.querySelector('.evd-title-input');
      const dateInput = modal.querySelector('.evd-date-input');
      const timeInput = modal.querySelector('.evd-time-input');
      const endTimeInput = modal.querySelector('.evd-endtime-input');
      const locationInput = modal.querySelector('.evd-location-input');
      const categoryInput = modal.querySelector('.evd-category-input');
      const priceInput = modal.querySelector('.evd-price-input');
      const descriptionInput = modal.querySelector('.evd-description-input');

      // Validation helper functions
      function validateTitle(value) {
        const trimmed = (value || '').trim();
        return trimmed.length > 0;
      }

      function validateDate(value) {
        return value && value.length > 0;
      }

      function validateTime(value) {
        return value && value.length > 0;
      }

      function validatePrice(value) {
        if(!value) return true; // Optional field
        const num = parseFloat(value);
        return !isNaN(num) && num >= 0;
      }

      function showFieldError(input, errorEl, message) {
        if(input && errorEl) {
          input.classList.add('evd-invalid');
          input.classList.remove('evd-valid');
          errorEl.innerHTML = `<svg viewBox="0 0 16 16" fill="none" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"><circle cx="8" cy="8" r="7" fill="#ff7f27"/><path d="M8 4v5M8 11h.01" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>${message}`;
        }
      }

      function clearFieldError(input, errorEl) {
        if(input && errorEl) {
          input.classList.remove('evd-invalid');
          input.classList.remove('evd-valid');
          errorEl.textContent = '';
        }
      }

      // Add real-time validation listeners
      if(titleInput) {
        titleInput.addEventListener('input', () => {
          const titleError = modal.querySelector('.evd-title-error');
          if(validateTitle(titleInput.value)) {
            clearFieldError(titleInput, titleError);
          } else {
            showFieldError(titleInput, titleError, 'Title cannot be empty');
          }
        });
      }

      if(dateInput) {
        dateInput.addEventListener('change', () => {
          const dateError = modal.querySelector('.evd-date-error');
          if(validateDate(dateInput.value)) {
            clearFieldError(dateInput, dateError);
          } else {
            showFieldError(dateInput, dateError, 'Date is required');
          }
        });
      }

      if(timeInput) {
        timeInput.addEventListener('change', () => {
          const timeError = modal.querySelector('.evd-time-error');
          if(validateTime(timeInput.value)) {
            clearFieldError(timeInput, timeError);
          } else {
            showFieldError(timeInput, timeError, 'Time is required');
          }
        });
      }

      if(endTimeInput) {
        endTimeInput.addEventListener('change', () => {
          const endTimeError = modal.querySelector('.evd-endtime-error');
          if(!endTimeInput.value) {
            showFieldError(endTimeInput, endTimeError, 'End time is required');
          } else if(timeInput.value) {
            const [startHour, startMin] = timeInput.value.split(':').map(Number);
            const [endHour, endMin] = endTimeInput.value.split(':').map(Number);
            const startMins = startHour * 60 + startMin;
            const endMins = endHour * 60 + endMin;
            
            if(endMins <= startMins && endMins !== 0) {
              showFieldError(endTimeInput, endTimeError, 'End time must be after start time');
            } else {
              clearFieldError(endTimeInput, endTimeError);
            }
          } else {
            clearFieldError(endTimeInput, endTimeError);
          }
        });
      }

      if(priceInput) {
        priceInput.addEventListener('input', () => {
          const priceError = modal.querySelector('.evd-price-error');
          if(validatePrice(priceInput.value)) {
            clearFieldError(priceInput, priceError);
          } else {
            showFieldError(priceInput, priceError, 'Must be a valid positive number');
          }
        });
      }

      // Menu toggle
      if(menuBtn && menuDropdown) {
        menuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          menuDropdown.classList.toggle('evd-menu-open');
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
          if(!modal.contains(e.target)) {
            menuDropdown.classList.remove('evd-menu-open');
          }
        });
        
        // Close menu when selecting item
        const menuItems = menuDropdown.querySelectorAll('.evd-menu-item');
        menuItems.forEach(item => {
          item.addEventListener('click', () => {
            menuDropdown.classList.remove('evd-menu-open');
          });
        });
      }

      let originalEventData = null;

      function setEventDetailMode(mode, ev){
        try {
          if(!mode) {
            console.warn('setEventDetailMode: mode is required');
            return;
          }
          
          const isEdit = mode === 'edit';
          modal.classList.toggle('evd-mode-edit', isEdit);
          overlay.dataset.mode = mode;
          
          // Show/hide Close button based on mode
          if(closeBtn) {
            closeBtn.style.display = isEdit ? 'none' : 'block';
          }
          
          if(isEdit && ev){
            // Store original event data for change detection
            originalEventData = JSON.parse(JSON.stringify(ev));
            
            // Re-query inputs to ensure they're available
            const titleInp = modal.querySelector('.evd-title-input');
            const dateInp = modal.querySelector('.evd-date-input');
            const timeInp = modal.querySelector('.evd-time-input');
            const endTimeInp = modal.querySelector('.evd-endtime-input');
            const locationInp = modal.querySelector('.evd-location-input');
            const categoryInp = modal.querySelector('.evd-category-input');
            const priceInp = modal.querySelector('.evd-price-input');
            const descriptionInp = modal.querySelector('.evd-description-input');
            
            // Validate and safely populate inputs
            if(titleInp) titleInp.value = String(ev.title || '');
            if(dateInp) dateInp.value = String(ev.date || '');
            if(timeInp) timeInp.value = String(ev.time || '');
            
            // Calculate and populate end time from start time and duration
            if(endTimeInp && ev.time && ev.duration) {
              const endTime = calculateEndTimeFromDuration(ev.time, ev.duration);
              endTimeInp.value = endTime;
            }
            
            if(locationInp) locationInp.value = String(ev.location || '');
            if(categoryInp) categoryInp.value = String(ev.category || '');
            if(priceInp) priceInp.value = (ev.price !== undefined && ev.price !== null) ? String(ev.price) : '';
            if(descriptionInp) descriptionInp.value = String(ev.description || '');
          }
        } catch(err) {
          console.error('Error in setEventDetailMode:', err);
        }
      }

      function hasChanges(){
        if(!originalEventData) return false;
        
        const titleInp = modal.querySelector('.evd-title-input');
        const dateInp = modal.querySelector('.evd-date-input');
        const timeInp = modal.querySelector('.evd-time-input');
        const locationInp = modal.querySelector('.evd-location-input');
        const categoryInp = modal.querySelector('.evd-category-input');
        const priceInp = modal.querySelector('.evd-price-input');
        const descriptionInp = modal.querySelector('.evd-description-input');
        
        return (titleInp && titleInp.value !== String(originalEventData.title || '')) ||
               (dateInp && dateInp.value !== String(originalEventData.date || '')) ||
               (timeInp && timeInp.value !== String(originalEventData.time || '')) ||
               (locationInp && locationInp.value !== String(originalEventData.location || '')) ||
               (categoryInp && categoryInp.value !== String(originalEventData.category || '')) ||
               (priceInp && priceInp.value !== ((originalEventData.price !== undefined && originalEventData.price !== null) ? String(originalEventData.price) : '')) ||
               (descriptionInp && descriptionInp.value !== String(originalEventData.description || ''));
      }

      modal._setMode = setEventDetailMode;

      // Header close icon removed; overlay click still closes. If reinstated, guard here.
      // if(closeBtn){ ... }
      overlay.addEventListener('click', (e)=>{ if(e.target === overlay) { overlay.style.display='none'; setEventDetailMode('view'); } });

      editBtn.addEventListener('click', ()=>{
        try {
          const eventId = overlay.dataset.eventId;
          if(!eventId) {
            console.warn('Edit clicked but no eventId found');
            return;
          }
          const ev = eventsForThisTrip.find(e => e.id === eventId);
          if(!ev) {
            console.warn('Event not found with id:', eventId);
            return;
          }
          setEventDetailMode('edit', ev);
          if(titleInput) titleInput.focus();
        } catch(err) {
          console.error('Error in edit button handler:', err);
        }
      });

      cancelEditBtn.addEventListener('click', async ()=>{
        try {
          // Only show confirmation dialog if there are actual changes
          if(hasChanges()) {
            const confirmed = await showConfirmDialog(
              'Discard Changes?',
              'Do you want to discard these changes?',
              'Discard',
              'Keep Editing'
            );
            if(!confirmed) return;
          }
          
          const eventId = overlay.dataset.eventId;
          if(!eventId) return;
          const ev = eventsForThisTrip.find(e => e.id === eventId);
          if(ev) { setEventDetailMode('view'); showEventDetailModal(ev); }
        } catch(err) {
          console.error('Error in cancel button handler:', err);
          setEventDetailMode('view');
        }
      });

      closeBtn.addEventListener('click', ()=>{
        overlay.style.display = 'none';
      });

      saveBtn.addEventListener('click', async ()=>{
        try {
          const eventId = overlay.dataset.eventId;
          if(!eventId) {
            console.warn('Save clicked but no eventId found');
            return;
          }
          
          const idx = eventsForThisTrip.findIndex(e => e.id === eventId);
          if(idx === -1) {
            console.warn('Event not found with id:', eventId);
            return;
          }
          
          const ev = eventsForThisTrip[idx];
          if(!ev) return;
          
          // Re-query inputs
          const titleInp = modal.querySelector('.evd-title-input');
          const dateInp = modal.querySelector('.evd-date-input');
          const timeInp = modal.querySelector('.evd-time-input');
          const endTimeInp = modal.querySelector('.evd-endtime-input');
          const locationInp = modal.querySelector('.evd-location-input');
          const categoryInp = modal.querySelector('.evd-category-input');
          const priceInp = modal.querySelector('.evd-price-input');
          const descriptionInp = modal.querySelector('.evd-description-input');
          
          // Validate all required fields before showing confirmation
          let hasErrors = false;
          
          // Validate title
          if(!validateTitle(titleInp?.value)) {
            showFieldError(titleInp, modal.querySelector('.evd-title-error'), 'Title cannot be empty');
            hasErrors = true;
          } else {
            clearFieldError(titleInp, modal.querySelector('.evd-title-error'));
          }
          
          // Validate date
          if(!validateDate(dateInp?.value)) {
            showFieldError(dateInp, modal.querySelector('.evd-date-error'), 'Date is required');
            hasErrors = true;
          } else {
            clearFieldError(dateInp, modal.querySelector('.evd-date-error'));
          }
          
          // Validate time
          if(!validateTime(timeInp?.value)) {
            showFieldError(timeInp, modal.querySelector('.evd-time-error'), 'Time is required');
            hasErrors = true;
          } else {
            clearFieldError(timeInp, modal.querySelector('.evd-time-error'));
          }

          // Validate end time
          if(!endTimeInp?.value) {
            showFieldError(endTimeInp, modal.querySelector('.evd-endtime-error'), 'End time is required');
            hasErrors = true;
          } else if(timeInp?.value) {
            const [startHour, startMin] = timeInp.value.split(':').map(Number);
            const [endHour, endMin] = endTimeInp.value.split(':').map(Number);
            const startMins = startHour * 60 + startMin;
            const endMins = endHour * 60 + endMin;
            
            if(endMins <= startMins && endMins !== 0) {
              showFieldError(endTimeInp, modal.querySelector('.evd-endtime-error'), 'End time must be after start time');
              hasErrors = true;
            } else {
              clearFieldError(endTimeInp, modal.querySelector('.evd-endtime-error'));
            }
          }
          
          // Validate price if provided
          if(priceInp?.value && !validatePrice(priceInp.value)) {
            showFieldError(priceInp, modal.querySelector('.evd-price-error'), 'Must be a valid positive number');
            hasErrors = true;
          } else {
            clearFieldError(priceInp, modal.querySelector('.evd-price-error'));
          }
          
          // If there are validation errors, show error dialog
          if(hasErrors) {
            await showConfirmDialog(
              'Missing Required Fields',
              'Please fill in all required fields before saving.',
              'OK',
              ''
            );
            return;
          }
          
          // Validate and sanitize inputs
          const newTitle = (titleInp?.value || '').trim() || 'Untitled Event';
          const newDate = dateInp?.value || ev.date;
          const newTime = timeInp?.value || ev.time;
          const newEndTime = endTimeInp?.value || '';
          const newLocation = (locationInp?.value || '').trim();
          const newCategory = (categoryInp?.value || '').trim();
          const newPrice = parseFloat((priceInp?.value || '').trim());
          const newDescription = (descriptionInp?.value || '').trim();
          
          // Calculate duration from time range
          const newDuration = calculateDuration(newTime, newEndTime);
          
          // Update event with validation
          ev.title = newTitle;
          ev.date = newDate || ev.date; // Keep original if empty
          ev.time = newTime || ev.time; // Keep original if empty
          ev.duration = String(newDuration);
          ev.location = newLocation;
          ev.category = newCategory;
          ev.price = !isNaN(newPrice) ? newPrice : ev.price; // Keep original price if invalid number
          ev.description = newDescription;
          
          saveEventsToStorage(trip.id, eventsForThisTrip);
          render();
          setEventDetailMode('view');
          showEventDetailModal(ev);
        } catch(err) {
          console.error('Error in save button handler:', err);
          alert('Failed to save event. Please try again.');
        }
      });

      removeBtn.addEventListener('click', ()=>{
        try {
          const eventId = overlay.dataset.eventId;
          if(!eventId) {
            console.warn('Remove clicked but no eventId found');
            return;
          }
          const event = eventsForThisTrip.find(e => e.id === eventId);
          if(!event) {
            console.warn('Event not found with id:', eventId);
            return;
          }
          overlay.style.display='none';
          setEventDetailMode('view');
          showConfirmDeleteModal(event.id, event.title);
        } catch(err) {
          console.error('Error in remove button handler:', err);
        }
      });

      _eventDetailModal = overlay;
      return overlay;
    }

    function showEventDetailModal(event){
      try {
        if(!event || !event.id) {
          console.error('showEventDetailModal: invalid event object');
          return;
        }
        
        const modal = ensureEventDetailModal();
        if(!modal) {
          console.error('Failed to create event detail modal');
          return;
        }
        
        modal.dataset.eventId = event.id;
        modal.classList.remove('evd-mode-edit');
        modal.dataset.mode = 'view';
        if(modal._setMode) modal._setMode('view', event);
        
        const titleEl = modal.querySelector('.evd-title');
        const dateEl = modal.querySelector('.evd-date');
        const timeEl = modal.querySelector('.evd-time');
        const locationEl = modal.querySelector('.evd-location');
        const categoryEl = modal.querySelector('.evd-category');
        const priceEl = modal.querySelector('.evd-price');
        const descriptionEl = modal.querySelector('.evd-description');
        const imageContainer = modal.querySelector('.evd-image-container');
        const locationField = modal.querySelector('.evd-location-field');
        const categoryField = modal.querySelector('.evd-category-field');
        const priceField = modal.querySelector('.evd-price-field');
        const descriptionField = modal.querySelector('.evd-description-field');

        // Safely set title
        if(titleEl) titleEl.textContent = event.title || 'Untitled Event';
        
        // Format date with error handling
        if(dateEl) {
          if(event.date){
            try {
              const dateObj = parseISO(event.date);
              dateEl.textContent = dateObj.toLocaleDateString(undefined, {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
            } catch(dateErr) {
              console.warn('Failed to parse date:', event.date, dateErr);
              dateEl.textContent = 'Invalid date';
            }
          } else {
            dateEl.textContent = 'No date';
          }
        }
        
        // Format time with end time if duration exists
        if(timeEl) {
          if(event.time){
            try {
              let timeDisplay = to12Hour(event.time);
              if(event.duration){
                const endTime24 = calculateEndTime(event.time, event.duration);
                timeDisplay += ` - ${to12Hour(endTime24)} (${event.duration} hrs)`;
              }
              timeEl.textContent = timeDisplay;
            } catch(timeErr) {
              console.warn('Failed to format time:', event.time, timeErr);
              timeEl.textContent = 'Invalid time';
            }
          } else {
            timeEl.textContent = 'No time specified';
          }
        }

        // Duration is now shown inline with time in the time field
        
        // Location
        if(event.location){
          if(locationEl) locationEl.textContent = event.location;
          if(locationField) locationField.style.display = 'flex';
        } else {
          if(locationField) locationField.style.display = 'none';
        }
        
        // Category
        if(event.category){
          if(categoryEl) categoryEl.textContent = event.category;
          if(categoryField) categoryField.style.display = 'flex';
        } else {
          if(categoryField) categoryField.style.display = 'none';
        }
        
        // Price
        if(event.price !== undefined && event.price !== null){
          if(priceEl) priceEl.textContent = event.price === 0 ? 'Free' : String(event.price);
          if(priceField) priceField.style.display = 'flex';
        } else {
          if(priceField) priceField.style.display = 'none';
        }
        
        // Description
        if(event.description){
          if(descriptionEl) descriptionEl.textContent = event.description;
          if(descriptionField) descriptionField.style.display = 'flex';
        } else {
          if(descriptionField) descriptionField.style.display = 'none';
        }
        
        // Image
        if(imageContainer) {
          if(event.img){
            try {
              imageContainer.innerHTML = `<img src="${event.img}" alt="${event.title || 'Event'}" class="evd-image">`;
              imageContainer.style.display = 'block';
            } catch(imgErr) {
              console.warn('Failed to load image:', event.img, imgErr);
              imageContainer.innerHTML = '';
              imageContainer.style.display = 'none';
            }
          } else {
            imageContainer.innerHTML = '';
            imageContainer.style.display = 'none';
          }
        }
        
        if(modal) {
          modal.style.display = 'flex';
        }
      } catch(err) {
        console.error('Error in showEventDetailModal:', err);
      }
    }

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
            <div style="margin-top:8px;"><button class="btn-outline edit-dates-btn" type="button" aria-label="Edit trip dates">Edit Dates</button></div>
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
            const curStart = trip.startDate;
            const curEnd = trip.endDate;
            const callback = (newStart, newEnd) => {
              // Check if any events would be deleted by the new date range
              const newStartDate = new Date(newStart + 'T00:00:00');
              const newEndDate = new Date(newEnd + 'T00:00:00');
              const eventsToLose = eventsForThisTrip.filter(ev => {
                const evDate = new Date(ev.date + 'T00:00:00');
                return evDate < newStartDate || evDate > newEndDate;
              });
              
              const performUpdate = () => {
                // Update trip data in-memory and recompute window bounds
                try {
                  trip.startDate = newStart;
                  trip.endDate = newEnd;
                  tripStart = new Date(trip.startDate + 'T00:00:00');
                  tripEnd = new Date(trip.endDate + 'T00:00:00');
                  weekStart = new Date(trip.startDate + 'T00:00:00');
                  // Remove events outside the new date range
                  const eventsToKeep = eventsForThisTrip.filter(ev => {
                    const evDate = new Date(ev.date + 'T00:00:00');
                    return evDate >= newStartDate && evDate <= newEndDate;
                  });
                  eventsForThisTrip.length = 0;
                  eventsForThisTrip.push(...eventsToKeep);
                  saveEventsToStorage(trip.id, eventsForThisTrip);
                  // Re-render with updated dates
                  render();
                } catch(err) { console.warn('[week] edit dates failed', err); }
              };
              
              if(eventsToLose.length > 0){
                // Show themed confirmation modal
                showConfirmDateChangeModal(eventsToLose.length, performUpdate);
              } else {
                // No events to lose, proceed directly
                performUpdate();
              }
            };
            showEditDatesModal(curStart, curEnd, callback);
          });
        }
      } catch(e) { /* ignore */ }

      // Next 7 columns: Monday..Sunday
      for(let i=0;i<7;i++){
        const dayDate = addDays(weekStart, i);
        const dayIso = iso(dayDate);
        const dayHref = `${basePath()}/pages/ItineraryDay.html?trip=${encodeURIComponent(trip.id)}&date=${encodeURIComponent(dayIso)}`;
        const col = document.createElement('div'); col.className = 'week-column';
        const inner = document.createElement('div'); inner.className = 'week-column__inner';
        // Place day name and date as a link so clicking the day opens Day view
        inner.innerHTML = `<div class="day-header"><div class="day-name"><a href="${dayHref}" class="day-link link-black">${toDay(dayIso)}, ${dayDate.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</a></div><button class="btn day-add btn-outline" data-date="${dayIso}" aria-label="Add event">+</button></div>`;

        // find events for this date and show a compact preview (top 3)
        const todays = eventsForThisTrip.filter(ev => ev.date === dayIso).sort((a,b)=> (a.time||'').localeCompare(b.time||''));
        const SHOW = 3;
        if(todays.length){
          todays.slice(0, SHOW).forEach(ev =>{
            const card = document.createElement('div'); card.className='event-item';
            // Highlight the newly added event
            if (ev.id === highlightEventId) {
              card.classList.add('event-item--new');
            }
            // Display time in 12-hour format
            const timeDisplay = to12Hour(ev.time);
            card.innerHTML = `<div class="event-time">${timeDisplay}</div><div class="event-title">${ev.title}</div>`;
            card.style.cursor = 'pointer';
            card.addEventListener('click', ()=> showEventDetailModal(ev));
            inner.appendChild(card);
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
