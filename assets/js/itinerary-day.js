// ======================================================================
// itinerary-day.js — Synced with weekly view, card-based layout
// ======================================================================
(function () {
  const $ = (sel, node = document) => node.querySelector(sel);

  async function loadTrips() {
    const base = window.location.pathname.includes("/pages/") ? ".." : ".";
    // Apply local edits from Itineraries page
    const KEY_EXTRAS = 'itineraries.extras';
    const KEY_DELETED = 'itineraries.deleted';
    const KEY_OVERRIDES = 'itineraries.overrides';
    const loadJSON = (key)=>{ try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }catch(e){ return null; } };

    const baseTrips = (await fetch(`${base}/assets/data/trips.json`).then(r=>r.json())).trips || [];
    const extras = loadJSON(KEY_EXTRAS) || [];
    const deleted = new Set((loadJSON(KEY_DELETED) || []));
    const overrides = loadJSON(KEY_OVERRIDES) || {};

    let merged = baseTrips.concat(extras.map(t=>Object.assign({isExtra:true}, t)));
    merged = merged.filter(t => !deleted.has(t.id));
    merged = merged.map(t => overrides[t.id] ? Object.assign({}, t, overrides[t.id]) : t);

    return merged;
  }

  async function loadEvents() {
    const base = window.location.pathname.includes("/pages/") ? ".." : ".";
    try { return (await fetch(`${base}/assets/data/events.json`).then(r=>r.json())).explore || []; } catch(e){ return []; }
  }

  function storageKey(tid){ return `events-${tid}`; }
  function loadSavedEvents(tid){ try{ const raw = localStorage.getItem(storageKey(tid)); return raw ? JSON.parse(raw) : null; } catch(e){ return null; } }
  function saveEventsToStorage(tid, events){ try{ localStorage.setItem(storageKey(tid), JSON.stringify(events)); } catch(e){ /* ignore */ } }

  function parseISO(d){ return new Date(d + 'T00:00:00'); }

  const params = new URLSearchParams(location.search);
  const tripId = params.get("trip");
  const dateISO = params.get("date");

  if (!tripId || !dateISO) {
    document.body.innerHTML = '<main class="container"><p>Missing trip or date parameter.</p></main>';
    return;
  }

  const daySubtitle = $("#day-subtitle");
  const calendar = $("#calendar");
  const backBtn = $("#back-to-week-btn");
  const addEventBtn = $("#add-event-btn");
  const eventModal = $("#event-modal");
  const eventForm = $("#event-form");

  let currentTrip = null;
  let currentEvents = [];

  // Update back button to return to weekly view with trip parameter
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      location.href = `./ItineraryWeek.html?trip=${encodeURIComponent(tripId)}`;
    });
  }

  (async () => {
    const trips = await loadTrips();
    const allEvents = await loadEvents();
    const trip = trips.find(t => t.id === tripId);

    if (!trip) {
      calendar.innerHTML = '<p>Trip not found.</p>';
      return;
    }

    currentTrip = trip;

    // Load events: prefer localStorage, fallback to per-trip seed, then deterministic generation
    let eventsForThisTrip = [];
    const saved = loadSavedEvents(trip.id);

    if (Array.isArray(saved) && saved.length) {
      eventsForThisTrip = saved;
    } else {
      // Try per-trip seed file
      const base = window.location.pathname.includes("/pages/") ? ".." : ".";
      try {
        const resp = await fetch(`${base}/assets/data/events-${encodeURIComponent(trip.id)}.json`);
        if (resp && resp.ok) {
          const body = await resp.json();
          if (body && Array.isArray(body.explore) && body.explore.length) {
            eventsForThisTrip = body.explore.slice();
          }
        }
      } catch(e) { /* ignore */ }
    }

    currentEvents = eventsForThisTrip;

    renderDayEvents();
  })();

  function renderDayEvents() {
    if (!currentTrip || !currentEvents) return;

    // Update subtitle with formatted date only
    const dateObj = parseISO(dateISO);
    const formatted = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    daySubtitle.textContent = formatted;

    // Filter events for this specific date
    const dayEvents = currentEvents.filter(ev => ev.date === dateISO);

    if (!dayEvents.length) {
      calendar.innerHTML = '<p style="color:var(--color-muted);font-style:italic;padding:20px 0;">No events scheduled for this day.</p>';
      return;
    }

    // Sort by time
    dayEvents.sort((a, b) => {
      const tA = a.time || '00:00';
      const tB = b.time || '00:00';
      return tA.localeCompare(tB);
    });

    // Render event cards
    calendar.innerHTML = '';
    calendar.className = 'day-events-list';

    dayEvents.forEach(ev => {
      const card = document.createElement('article');
      card.className = 'day-event-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const time = ev.time || '';
      const duration = ev.duration ? parseFloat(ev.duration) : 0;
      
      // Calculate end time
      let timeDisplay = time;
      if (time && duration) {
        const [h, m] = time.split(':').map(Number);
        const totalMins = h * 60 + m + (duration * 60);
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        const endTime = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
        timeDisplay = `${time}\n–\n${endTime}`;
      }

      card.innerHTML = `
        <div class="day-event-card__time">${timeDisplay}</div>
        <div class="day-event-card__content">
          <h3 class="day-event-card__title">${ev.title || 'Untitled Event'}</h3>
          ${ev.location ? `<p class="day-event-card__location">📍 ${ev.location}</p>` : ''}
          ${ev.description ? `<p class="day-event-card__description">${ev.description}</p>` : ''}
          ${ev.price ? `<p class="day-event-card__price">$${ev.price}</p>` : ''}
        </div>
      `;

      card.addEventListener('click', () => {
        location.href = `./EventInfo.html?id=${encodeURIComponent(ev.id)}&trip=${encodeURIComponent(tripId)}`;
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          location.href = `./EventInfo.html?id=${encodeURIComponent(ev.id)}&trip=${encodeURIComponent(tripId)}`;
        }
      });

      calendar.appendChild(card);
    });
  }

  // Add Event button handler
  if (addEventBtn && eventModal && eventForm) {
    addEventBtn.addEventListener('click', () => {
      if (!currentTrip) return;

      // Pre-fill date with current day
      const dateInput = $('#ev-date');
      if (dateInput) dateInput.value = dateISO;

      // Populate time selector
      const startSelect = $('#ev-start');
      if (startSelect) {
        startSelect.innerHTML = '';
        for (let h = 0; h < 24; h++) {
          for (let m of [0, 30]) {
            const time = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
            const opt = document.createElement('option');
            opt.value = time;
            opt.textContent = time;
            startSelect.appendChild(opt);
          }
        }
        startSelect.value = '09:00';
      }

      // Update end time based on duration
      const updateEndTime = () => {
        const start = $('#ev-start').value;
        const durMins = parseInt($('#ev-dur').value) || 60;
        if (start) {
          const [h, m] = start.split(':').map(Number);
          const totalMins = h * 60 + m + durMins;
          const endH = Math.floor(totalMins / 60) % 24;
          const endM = totalMins % 60;
          const endTime = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
          const endInput = $('#ev-end');
          if (endInput) endInput.value = endTime;
        }
      };

      if (startSelect) startSelect.addEventListener('change', updateEndTime);
      const durSelect = $('#ev-dur');
      if (durSelect) durSelect.addEventListener('change', updateEndTime);
      updateEndTime();

      eventModal.classList.remove('hidden');
      const titleInput = $('#ev-title');
      if (titleInput) titleInput.focus();
    });

    const cancelBtn = $('#ev-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        eventModal.classList.add('hidden');
        eventForm.reset();
      });
    }

    eventForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!currentTrip) return;

      const title = $('#ev-title').value.trim();
      const time = $('#ev-start').value;
      const durMins = parseInt($('#ev-dur').value) || 60;
      const duration = (durMins / 60).toFixed(1);
      const location = $('#ev-location').value.trim();
      const cost = parseFloat($('#ev-cost').value) || 0;
      const notes = $('#ev-notes').value.trim();

      if (!title) {
        alert('Please enter an event title.');
        return;
      }

      const newEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
        title,
        date: dateISO,
        time,
        duration,
        location: location || currentTrip.title,
        price: cost,
        description: notes,
        custom: true
      };

      currentEvents.push(newEvent);
      saveEventsToStorage(currentTrip.id, currentEvents);

      eventModal.classList.add('hidden');
      eventForm.reset();
      renderDayEvents();
    });
  }

})();
