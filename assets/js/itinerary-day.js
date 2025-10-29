// assets/js/itinerary-day.js
(function () {
  const $ = (sel, node = document) => node.querySelector(sel);

  // ---- Query params ----
  const params = new URLSearchParams(location.search);
  const tripId = Number(params.get('trip'));
  const dateISO = params.get('date'); // 'YYYY-MM-DD'

  // ---- Load data from localStorage (written by Itinerary Week) or fallback ----
  function loadItineraries() {
    try {
      const raw = localStorage.getItem('ITINERARIES');
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }

  const itineraries = loadItineraries() || [];
  const trip = itineraries.find(t => t.id === tripId) || null;

  // find day or create one if missing
  function getDay(trip, dateISO) {
    if (!trip) return null;
    if (!Array.isArray(trip.days)) trip.days = [];
    let day = trip.days.find(d => d.date === dateISO);
    if (!day) {
      day = { date: dateISO, city: '-', activities: [] };
      trip.days.push(day);
      persist();
    }
    if (!Array.isArray(day.activities)) day.activities = [];
    return day;
  }

  function persist() {
    try {
      localStorage.setItem('ITINERARIES', JSON.stringify(itineraries));
    } catch (_) {}
  }

  const day = getDay(trip, dateISO);

  // ---- Header texts ----
  function fmtHeader(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const long = d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return long;
  }
  $('#day-title').textContent = trip ? trip.title : 'Itinerary (Day)';
  $('#day-subtitle').textContent = dateISO ? fmtHeader(dateISO) : '';

  // ---- Build grid ----
  const calendar = $('#calendar');
  const rows = [];
  for (let i = 0; i < 48; i++) {
    rows.push(i);
  }

  // left rail (times) and slot surface
  rows.forEach(i => {
    const hours = Math.floor(i / 2);
    const mins = i % 2 ? '30' : '00';
    const label = `${String(hours).padStart(2,'0')}:${mins}`;

    const timeCell = document.createElement('div');
    timeCell.className = 'time-cell';
    timeCell.textContent = label;

    const slotCell = document.createElement('div');
    slotCell.className = 'slot-cell';

    const hit = document.createElement('div');
    hit.className = 'slot-hit';
    hit.dataset.index = i;
    hit.title = `Add at ${label}`;
    hit.addEventListener('click', () => openAddModalAtIndex(i));

    slotCell.appendChild(hit);

    calendar.appendChild(timeCell);
    calendar.appendChild(slotCell);
  });

  // events overlay
  const overlay = document.createElement('div');
  overlay.className = 'events-layer';
  // attach overlay to the content column (grid column 2)
  // The overlay needs to span all rows; we position absolutely within calendar
  calendar.appendChild(overlay);

  // ---- Helpers for time math ----
  function idxFromTime(timeStr) {
    // 'HH:MM' -> 0..47 (each is 30 min)
    const [h, m] = timeStr.split(':').map(Number);
    return h * 2 + (m >= 30 ? 1 : 0);
  }
  function timeFromIdx(i) {
    const h = Math.floor(i / 2);
    const m = i % 2 ? 30 : 0;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    }

  function pxTopFromIndex(i) {
    const slotH = parseFloat(getComputedStyle(calendar).getPropertyValue('--slot-height')) || 42;
    return i * slotH;
  }

  // ---- Render events ----
  function renderEvents() {
    overlay.innerHTML = '';
    if (!day || !day.activities || day.activities.length === 0) {
      // Optional helper message (only if truly empty)
      // const tip = document.createElement('div');
      // tip.className = 'no-events';
      // tip.textContent = 'No events yet — click a time slot or “+ Add Event”.';
      // overlay.appendChild(tip);
      return;
    }

    day.activities.forEach(ev => {
      const startIdx = idxFromTime(ev.time);
      const durMins = Number(ev.duration || 60);
      const endIdx = Math.min(48, startIdx + Math.ceil(durMins / 30));

      const top = pxTopFromIndex(startIdx);
      const height = pxTopFromIndex(endIdx) - top;

      const block = document.createElement('div');
      block.className = 'event-block';
      block.style.top = `${top}px`;
      block.style.height = `${height - 4}px`; // little visual breathing room

      block.innerHTML = `
        <span class="event-title">${ev.title || 'Untitled'}</span>
        <span class="event-time">${ev.time} • ${durMins} min</span>
      `;

      overlay.appendChild(block);
    });
  }

  // ---- Add Event modal ----
  const modal = $('#event-modal');
  const form = $('#event-form');
  const btnOpen = $('#add-event-btn');
  const btnCancel = $('#ev-cancel');
  const selStart = $('#ev-start');
  const selDur = $('#ev-dur');
  const inputTitle = $('#ev-title');
  const err = $('#ev-error');

  // populate start-time dropdown (00:00 to 23:30)
  for (let i = 0; i < 48; i++) {
    const opt = document.createElement('option');
    opt.value = timeFromIdx(i);
    opt.textContent = opt.value;
    selStart.appendChild(opt);
  }

  function openAddModalAtIndex(i) {
    selStart.value = timeFromIdx(i);
    err.style.display = 'none';
    inputTitle.value = '';
    modal.classList.remove('hidden');
  }

  function openAddModal() {
    err.style.display = 'none';
    inputTitle.value = '';
    modal.classList.remove('hidden');
  }

  function closeAddModal() {
    modal.classList.add('hidden');
  }

  btnOpen?.addEventListener('click', openAddModal);
  btnCancel?.addEventListener('click', closeAddModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeAddModal(); });

  // overlap check: (s1 < e2) && (s2 < e1)
  function hasConflict(newStart, newDurMins) {
    const nStartIdx = idxFromTime(newStart);
    const nEndIdx = nStartIdx + Math.ceil(newDurMins / 30);

    return (day.activities || []).some(ev => {
      const s = idxFromTime(ev.time);
      const e = s + Math.ceil(Number(ev.duration || 60) / 30);
      return (nStartIdx < e) && (s < nEndIdx);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = inputTitle.value.trim();
    const start = selStart.value;
    const dur = Number(selDur.value);

    if (!title) return;

    if (hasConflict(start, dur)) {
      err.textContent = 'This event conflicts with an existing one. Pick a different time or duration.';
      err.style.display = 'block';
      return;
    }

    day.activities.push({ time: start, duration: dur, title });
    persist();
    closeAddModal();
    renderEvents();
  });

  // ---- Initialize view ----
  renderEvents();
})();
