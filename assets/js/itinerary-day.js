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

  // Convert 24-hour time to 12-hour format with AM/PM
  function to12Hour(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2,'0')} ${period}`;
  }

  const params = new URLSearchParams(location.search);
  const tripId = params.get("trip");
  const dateISO = params.get("date");

  if (!tripId || !dateISO) {
    document.body.innerHTML = '<main class="container"><p>Missing trip or date parameter.</p></main>';
    return;
  }

  const daySubtitle = $("#day-subtitle");
  const calendar = $("#calendar");
  const prevDayBtn = $("#prev-day");
  const nextDayBtn = $("#next-day");
  const addEventBtn = $("#add-event-btn");
  const eventModal = $("#event-modal");
  const eventForm = $("#event-form");

  let currentTrip = null;
  let currentEvents = [];

  (async () => {
    const trips = await loadTrips();
    const allEvents = await loadEvents();
    const trip = trips.find(t => t.id === tripId);

    if (!trip) {
      calendar.innerHTML = '<p>Trip not found.</p>';
      return;
    }

    currentTrip = trip;

    // Setup prev/next day navigation
    if (prevDayBtn) {
      prevDayBtn.addEventListener('click', () => {
        const currentDate = parseISO(dateISO);
        currentDate.setDate(currentDate.getDate() - 1);
        const newDateISO = currentDate.toISOString().split('T')[0];
        location.href = `./ItineraryDay.html?trip=${encodeURIComponent(tripId)}&date=${newDateISO}`;
      });
    }

    if (nextDayBtn) {
      nextDayBtn.addEventListener('click', () => {
        const currentDate = parseISO(dateISO);
        currentDate.setDate(currentDate.getDate() + 1);
        const newDateISO = currentDate.toISOString().split('T')[0];
        location.href = `./ItineraryDay.html?trip=${encodeURIComponent(tripId)}&date=${newDateISO}`;
      });
    }

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

    // Update subtitle with formatted date and day counter
    const dateObj = parseISO(dateISO);
    const formatted = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    
    // Calculate which day of the trip this is
    const tripStartDate = parseISO(currentTrip.startDate);
    const tripEndDate = parseISO(currentTrip.endDate);
    const totalDays = Math.floor((tripEndDate - tripStartDate) / (1000 * 60 * 60 * 24)) + 1;
    const currentDayNumber = Math.floor((dateObj - tripStartDate) / (1000 * 60 * 60 * 24)) + 1;
    
    daySubtitle.textContent = `${formatted} · Viewing Day ${currentDayNumber} of ${totalDays}`;

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

    // Add the "Add Event" card as the first card
    const addEventCard = document.createElement('article');
    addEventCard.className = 'day-event-card add-event-card';
    addEventCard.setAttribute('role', 'button');
    addEventCard.setAttribute('tabindex', '0');
    addEventCard.innerHTML = `
      <div class="day-event-card__content">
        <h3 class="day-event-card__title">+ Add Event</h3>
      </div>
    `;
    addEventCard.addEventListener('click', () => {
      if (addEventBtn) addEventBtn.click();
    });
    addEventCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (addEventBtn) addEventBtn.click();
      }
    });
    calendar.appendChild(addEventCard);

    dayEvents.forEach(ev => {
      const card = document.createElement('article');
      card.className = 'day-event-card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const time = ev.time || '';
      const duration = ev.duration ? parseFloat(ev.duration) : 0;
      
      // Calculate end time and convert to 12-hour format
      let timeDisplay = to12Hour(time);
      if (time && duration) {
        const [h, m] = time.split(':').map(Number);
        const totalMins = h * 60 + m + (duration * 60);
        const endH = Math.floor(totalMins / 60) % 24;
        const endM = totalMins % 60;
        const endTime24 = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
        const endTime12 = to12Hour(endTime24);
        timeDisplay = `${to12Hour(time)}\n–\n${endTime12}`;
      }

      // Simple category icon mapping
      const getIcon = (title, category) => {
        const t = (title || '').toLowerCase();
        if (t.includes('yoga') || t.includes('fitness')) return '🧘';
        if (t.includes('museum') || t.includes('gallery') || t.includes('art')) return '🏛️';
        if (t.includes('food') || t.includes('lunch') || t.includes('dinner') || t.includes('breakfast')) return '🍽️';
        if (t.includes('hike') || t.includes('walk') || t.includes('trail')) return '🥾';
        if (t.includes('coffee') || t.includes('cafe')) return '☕';
        if (t.includes('concert') || t.includes('music')) return '🎵';
        if (t.includes('park') || t.includes('garden')) return '🌳';
        if (t.includes('cycling') || t.includes('bike')) return '🚴';
        if (t.includes('jazz') || t.includes('show')) return '🎭';
        return '📌';
      };

      const icon = getIcon(ev.title, ev.category);

      card.innerHTML = `
        <div class="day-event-card__time">${timeDisplay}</div>
        <div class="day-event-card__content">
          <h3 class="day-event-card__title">
            ${ev.title || 'Untitled Event'}
          </h3>
          ${ev.location ? `<p class="day-event-card__location">${ev.location}</p>` : ''}
          ${ev.description ? `<p class="day-event-card__description">${ev.description}</p>` : ''}
          ${ev.price ? `<div class="day-event-card__price">$${ev.price}</div>` : ''}
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
