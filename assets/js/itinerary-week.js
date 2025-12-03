// ======================================================================
// itinerary-week.js (FIXED — Budget popup + Location-based schedules)
// ======================================================================
(function () {
  const $ = (sel, node = document) => node.querySelector(sel);
  const listEl = document.getElementById("itinerary-list");
  if (!listEl) return;

  function parse(d) { return new Date(d + "T00:00:00"); }

  async function loadTrips() {
    const base = window.location.pathname.includes("/pages/") ? ".." : ".";
    return (await fetch(`${base}/assets/data/trips.json`).then(r => r.json())).trips || [];
  }

  async function loadEvents() {
    const base = window.location.pathname.includes("/pages/") ? ".." : ".";
    return (await fetch(`${base}/assets/data/events.json`).then(r => r.json())).explore || [];
  }

  function eachDate(start, end) {
    const arr = [];
    let d = parse(start);
    const last = parse(end);
    while (d <= last) {
      arr.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return arr;
  }

  // ======================================================================
  // PATCH #1 — LOCATION-BASED FILTERING (T1)
  // ======================================================================
  // Only use events where event.location === trip.title
  function filterEventsByLocation(trip, allEvents) {
    return allEvents.filter(ev => ev.location === trip.title);
  }

  // Sequential Fill (2 events per day)
  function mapEventsSequentially(trip, eventsForThisTrip) {
    const days = eachDate(trip.startDate, trip.endDate).map(date => ({
      date,
      city: trip.title,
      activities: []
    }));

    let index = 0;
    const PER_DAY = 2;

    for (let i = 0; i < days.length; i++) {
      for (let j = 0; j < PER_DAY; j++) {
        if (index >= eventsForThisTrip.length) break;

        const ev = eventsForThisTrip[index];
        days[i].activities.push({
          id: ev.id,
          time: ev.time
        });

        index++;
      }
    }
    return days;
  }

  const DAY_NAMES = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  function toDay(iso) { return DAY_NAMES[parse(iso).getDay()]; }

  function toShort(iso) {
    const d = parse(iso);
    return d.toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric"
    });
  }

  function renderWeekRow(trip, days, EVENTS) {
    const wrap = document.createElement("div");
    wrap.className = "week-row";

    days.slice(0, 7).forEach(day => {
      // Use a div with role=link so event anchors inside remain valid (no nested anchors)
      const cell = document.createElement('div');
      cell.className = 'day-cell';
      cell.setAttribute('role', 'link');
      cell.setAttribute('tabindex', '0');
      const href = `./ItineraryDay.html?trip=${encodeURIComponent(trip.id)}&date=${encodeURIComponent(day.date)}`;
      cell.dataset.href = href;

      // Click and keyboard handlers to navigate
      cell.addEventListener('click', () => { if (cell.dataset.href) location.href = cell.dataset.href; });
      cell.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (cell.dataset.href) location.href = cell.dataset.href; } });

      cell.innerHTML = `
        <span class="day-name">${toDay(day.date)}</span>
        <span class="day-date">${toShort(day.date)}</span>
        <div class="day-meta"><div>${trip.title}</div></div>
        <span class="chev" aria-hidden="true">›</span>
      `;

      const list = document.createElement('ul');
      list.className = 'day-list';

      day.activities.slice(0, 3).forEach(act => {
        const ev = EVENTS.find(e => e.id === act.id);
        const title = ev ? ev.title : '(Event)';
        const li = document.createElement('li');
        li.innerHTML = `
          <span class="day-time">${act.time}</span>
          <a href="./EventInfo.html?id=${encodeURIComponent(act.id)}" class="day-title">${title}</a>
        `;
        list.appendChild(li);
      });

      if (day.activities.length === 0) {
        const li = document.createElement('li');
        li.className = 'day-more';
        li.textContent = 'No items';
        list.appendChild(li);
      }

      cell.appendChild(list);
      wrap.appendChild(cell);
    });

    return wrap;
  }

  function renderTripCard(trip, days, EVENTS) {
    const card = document.createElement("article");
    card.className = "trip-card";

    card.innerHTML = `
      <button class="trip-card__budget-btn btn btn-secondary" type="button">Budget</button>

      <div class="trip-card__header">
        <h3 class="trip-card__title">${trip.title}</h3>
      </div>

      <div class="trip-card__body">
        <p class="trip-card__row"><strong>${toShort(trip.startDate)} – ${toShort(trip.endDate)}</strong></p>
      </div>

      <div class="trip-card__expand"></div>
    `;

    // ==================================================================
    // PATCH #2 — Hook Budget Popup
    // ==================================================================
    card.querySelector(".trip-card__budget-btn")
      .addEventListener("click", () => {
        openBudgetPopup(trip);
      });

    card.querySelector(".trip-card__expand")
      .appendChild(renderWeekRow(trip, days, EVENTS));

    return card;
  }

  (async () => {
    const trips = await loadTrips();
    const EVENTS = await loadEvents();

    listEl.innerHTML = "";

    trips.forEach(trip => {
      // LOCATION FILTER HERE (T1)
      const eventsForThisTrip = filterEventsByLocation(trip, EVENTS);

      // THEN sequential mapping
      const days = mapEventsSequentially(trip, eventsForThisTrip);

      listEl.appendChild(renderTripCard(trip, days, EVENTS));
    });
  })();

})();
