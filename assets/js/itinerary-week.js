// assets/js/itinerary-week.js
(function () {
  // --- Mock itineraries (can be replaced with shared data later) ---
  const ITINERARIES = [
    {
      id: 1,
      title: 'Itinerary - 1',
      period: 'Sept 13 – Sept 20, 2025',
      created: 'Aug 2, 2025',
      edited: 'Sept 6, 2025',
      status: 'Ongoing',
      startDate: '2025-09-13',
      totalBudget: 2000,
      categories: [
        { name: 'Housing', amount: 800 },
        { name: 'Food', amount: 300 },
        { name: 'Transport', amount: 150 },
        { name: 'Entertainment', amount: 120 },
        { name: 'Misc', amount: 80 },
      ],
      days: [
        {
          date: '2025-09-13',
          city: 'Calgary',
          activities: [
            { time: '09:00', title: 'Arrive at YYC Airport' },
            { time: '11:00', title: 'Check-in at hotel' },
            { time: '14:00', title: 'Lunch at Charbar' },
            { time: '17:30', title: 'Evening walk by Bow River' },
          ]
        },
        {
          date: '2025-09-14',
          city: 'Calgary',
          activities: [
            { time: '08:30', title: 'Breakfast at OEB' },
            { time: '10:00', title: 'Visit Heritage Park' },
            { time: '13:00', title: 'Lunch near 17th Ave' },
            { time: '15:30', title: 'Explore Calgary Zoo' },
          ]
        },
        {
          date: '2025-09-15',
          city: 'Banff',
          activities: [
            { time: '09:00', title: 'Drive to Banff' },
            { time: '12:00', title: 'Check in at Rimrock Resort' },
            { time: '14:00', title: 'Banff Gondola ride' },
          ]
        },
        {
          date: '2025-09-16',
          city: 'Banff',
          activities: [
            { time: '09:00', title: 'Hike Tunnel Mountain' },
            { time: '13:00', title: 'Lunch at Maple Leaf Grill' },
            { time: '16:30', title: 'Soak in Banff Hot Springs' },
          ]
        },
        {
          date: '2025-09-17',
          city: 'Canmore',
          activities: [
            { time: '10:00', title: 'Drive to Canmore' },
            { time: '12:00', title: 'Lunch at Rocky Mountain Flatbread' },
            { time: '15:00', title: 'Visit Canmore Nordic Centre' },
          ]
        },
        {
          date: '2025-09-18',
          city: 'Calgary',
          activities: [
            { time: '09:30', title: 'Return to Calgary' },
            { time: '11:00', title: 'Shopping at CORE Mall' },
            { time: '18:00', title: 'Dinner at Major Tom' },
          ]
        },
        {
          date: '2025-09-19',
          city: 'Calgary',
          activities: [
            { time: '08:00', title: 'Breakfast at hotel' },
            { time: '10:00', title: 'Pack up and checkout' },
            { time: '12:00', title: 'Depart from YYC' },
          ]
        },
      ],
    },
    {
      id: 3,
      title: 'Itinerary - 3',
      period: 'Mar 14 – Mar 20, 2025',
      created: 'Jan 31, 2025',
      edited: 'Feb 20, 2025',
      status: 'Planned',
      startDate: '2025-03-14',
      totalBudget: 1800,
      categories: [
        { name: 'Housing', amount: 700 },
        { name: 'Food', amount: 260 },
        { name: 'Transport', amount: 140 },
        { name: 'Activities', amount: 220 },
        { name: 'Misc', amount: 40 },
      ],
      days: [
        {
          date: '2025-03-14',
          city: 'Calgary',
          activities: [
            { time: '08:30', title: 'Arrive at YYC' },
            { time: '10:30', title: 'Coffee at Deville' },
            { time: '13:00', title: 'Stephen Avenue walk' }
          ]
        },
        {
          date: '2025-03-15',
          city: 'Calgary',
          activities: [
            { time: '09:00', title: 'Breakfast at OEB' },
            { time: '11:00', title: 'TELUS Spark Science Centre' }
          ]
        },
        {
          date: '2025-03-16',
          city: 'Banff',
          activities: [
            { time: '08:00', title: 'Drive to Banff' },
            { time: '11:00', title: 'Check-in & lunch on Banff Ave' },
            { time: '15:00', title: 'Bow Falls viewpoint' }
          ]
        },
        {
          date: '2025-03-17',
          city: 'Banff',
          activities: [
            { time: '09:00', title: 'Lake Minnewanka loop' },
            { time: '13:30', title: 'Sulphur Mountain gondola' },
            { time: '18:30', title: 'Dinner at Three Ravens' }
          ]
        },
        {
          date: '2025-03-18',
          city: 'Canmore',
          activities: [
            { time: '09:30', title: 'Drive to Canmore' },
            { time: '11:00', title: 'Policeman’s Creek boardwalk' },
            { time: '16:00', title: 'Canmore Nordic Centre stroll' }
          ]
        },
        {
          date: '2025-03-19',
          city: 'Calgary',
          activities: [
            { time: '10:00', title: 'Glenbow at The Edison (museum pop-up)' },
            { time: '13:00', title: 'CORE shopping + Devonian Gardens' },
            { time: '19:00', title: 'Dinner on 17th Ave' }
          ]
        },
        {
          date: '2025-03-20',
          city: 'Calgary',
          activities: [
            { time: '08:00', title: 'Breakfast & checkout' },
            { time: '11:30', title: 'Depart from YYC' }
          ]
        },
      ],
    },
    {
      id: 2,
      title: 'Itinerary - 2',
      period: 'Jan 7 – Jan 9, 2025',
      created: 'Dec 15, 2024',
      edited: 'Dec 15, 2024',
      status: 'Completed',
      startDate: '2025-01-07',
      totalBudget: 1200,
      categories: [
        { name: 'Housing', amount: 450 },
        { name: 'Food', amount: 220 },
        { name: 'Transport', amount: 90 },
        { name: 'Tours', amount: 140 },
        { name: 'Misc', amount: 60 },
      ],
      days: [
        {
          date: '2025-01-07',
          city: 'Calgary',
          activities: [
            { time: '09:00', title: 'Arrive at YYC' },
            { time: '11:00', title: 'Check-in & rest' }
          ]
        },
        {
          date: '2025-01-08',
          city: 'Calgary',
          activities: [
            { time: '10:00', title: 'Studio Bell (National Music Centre)' },
            { time: '14:30', title: 'Lunch in East Village' }
          ]
        },
        {
          date: '2025-01-09',
          city: 'Calgary',
          activities: [
            { time: '09:30', title: 'Calgary Tower' },
            { time: '12:00', title: 'Checkout & depart' }
          ]
        },
        { date: '2025-01-10', city: '-', activities: [] },
        { date: '2025-01-11', city: '-', activities: [] },
        { date: '2025-01-12', city: '-', activities: [] },
        { date: '2025-01-13', city: '-', activities: [] },
      ],
    },
  ];
  // --- Helpers ---
  const $ = (sel, node = document) => node.querySelector(sel);
  const listEl = document.getElementById('itinerary-list');
  if (!listEl) return;

  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  function toDayName(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    return DAY_NAMES[d.getDay()];
  }
  function toShortDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    // e.g., Sep 13, 2025
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // most recent expanded by default
  let expandedId = ITINERARIES.slice().sort((a,b) => new Date(b.edited) - new Date(a.edited))[0]?.id ?? null;

  function render() {
    listEl.innerHTML = '';
    ITINERARIES.forEach(trip => {
      listEl.appendChild(renderTripCard(trip, trip.id === expandedId));
    });
  }

  function renderTripCard(trip, expanded) {
    const card = document.createElement('article');
    card.className = 'trip-card';
    card.setAttribute('data-trip-id', String(trip.id));

    // header/body + expand region
    card.innerHTML = `
      <button type="button" class="trip-card__budget-btn btn btn-secondary" aria-label="Open budget popup">Budget</button>

      <div class="trip-card__header" role="button" tabindex="0"
           aria-expanded="${expanded ? 'true' : 'false'}"
           aria-controls="expand-${trip.id}">
        <h3 class="trip-card__title">${trip.title}</h3>
      </div>

      <div class="trip-card__body">
        <p class="trip-card__row"><strong>${trip.period}</strong></p>
        <p class="trip-card__row">Created: ${trip.created}</p>
        <p class="trip-card__row">Last Edited: ${trip.edited}</p>
        <p class="trip-card__row">Trip Status: ${trip.status}</p>
      </div>

      <div class="trip-card__rail"></div>
      <div id="expand-${trip.id}" class="trip-card__expand" ${expanded ? '' : 'style="display:none"'}></div>
    `;

    // week row
    const expandEl = card.querySelector(`#expand-${trip.id}`);
    if (expanded) expandEl.appendChild(renderWeekRow(trip));

    // expand/collapse interactions
    const header = card.querySelector('.trip-card__header');
    header.addEventListener('click', () => toggleExpand(trip.id));
    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(trip.id); }
    });

    // budget popup button
    const budgetBtn = card.querySelector('.trip-card__budget-btn');
    budgetBtn.addEventListener('click', () => openBudgetPopup(trip));

    return card;
  }

  function toggleExpand(id) {
    // clicking an already-expanded one collapses it
    expandedId = (expandedId === id) ? null : id;
    render();
    if (expandedId != null) {
      const el = listEl.querySelector(`[data-trip-id="${expandedId}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

    function renderWeekRow(trip) {
    const wrap = document.createElement('div');
    wrap.className = 'week-row';

    // ensure exactly 7 cells
    const days = (trip.days || []).slice(0, 7);
    while (days.length < 7) days.push({ date: '', city: '-', activities: [] });

    const MAX_ITEMS = 3; // show up to 3 bullets per day in the week view

    days.forEach(day => {
        const label  = day.date ? toDayName(day.date) : '';
        const pretty = day.date ? toShortDate(day.date) : '';
        const acts   = Array.isArray(day.activities) ? day.activities : [];

        const cell = document.createElement('a');
        cell.className = 'day-cell';
        cell.setAttribute('role', 'link');
        cell.setAttribute('tabindex', '0');
        cell.href = day.date
        ? `./ItineraryDay.html?trip=${encodeURIComponent(trip.id)}&date=${encodeURIComponent(day.date)}`
        : `./ItineraryDay.html?trip=${encodeURIComponent(trip.id)}`;

        // Build the bullet list
        const list = document.createElement('ul');
        list.className = 'day-list';
        acts.slice(0, MAX_ITEMS).forEach(item => {
        const li = document.createElement('li');
        const time = item.time ? `<span class="day-time">${item.time}</span>` : '';
        li.innerHTML = `${time}<span class="day-title">${item.title || ''}</span>`;
        list.appendChild(li);
        });
        if (acts.length > MAX_ITEMS) {
        const li = document.createElement('li');
        li.className = 'day-more';
        li.textContent = `+${acts.length - MAX_ITEMS} more…`;
        list.appendChild(li);
        }
        if (acts.length === 0) {
        const li = document.createElement('li');
        li.className = 'day-more';
        li.textContent = 'No items yet';
        list.appendChild(li);
        }

        cell.innerHTML = `
        <span class="day-name">${label}</span>
        <span class="day-date">${pretty}</span>
        <div class="day-meta">
            <div>${day.city || '-'}</div>
        </div>
        `;
        cell.appendChild(list);
        wrap.appendChild(cell);
    });

    return wrap;
    }


  // ------- Budget popup (donut + legend), adapted from Budget page -------
  // Reuses donut & modal styles in budget.css. IDs are prefixed with iw-* to avoid clashes.
  // Reference behaviors are in your Budget page & JS. :contentReference[oaicite:1]{index=1} :contentReference[oaicite:2]{index=2}
  const iwModal = document.getElementById('iw-budget-modal');
  const iwClose = document.getElementById('iw-budget-close');
  const iwSlices = document.getElementById('iw-donut-slices');
  const iwLegend = document.getElementById('iw-donut-legend');
  const iwMain   = document.getElementById('iw-donut-main');
  const iwSub    = document.getElementById('iw-donut-sub');
  const iwHead   = document.getElementById('iw-donut-remaining-label');
  const COLORS = ['#ff7f27', '#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#f1c40f', '#2ecc71'];

  function openBudgetPopup(trip) {
    renderDonut(trip);
    iwModal.classList.remove('hidden');
  }
  function closeBudgetPopup() {
    iwModal.classList.add('hidden');
  }
  iwClose?.addEventListener('click', closeBudgetPopup);
  iwModal?.addEventListener('click', (e) => { if (e.target === iwModal) closeBudgetPopup(); });

  function renderDonut(trip) {
    // mirror your budget.js logic/structure for consistency. :contentReference[oaicite:3]{index=3}
    iwSlices.innerHTML = '';
    iwLegend.innerHTML = '';

    const TOTAL_BUDGET = trip.totalBudget;
    const CATEGORIES   = trip.categories;

    const spent = CATEGORIES.reduce((s, c) => s + c.amount, 0);
    const remaining = Math.max(TOTAL_BUDGET - spent, 0);

    // Largest-remainder rounding to 100%
    const rawPerc = CATEGORIES.map(c => (c.amount / TOTAL_BUDGET) * 100);
    const floors  = rawPerc.map(p => Math.floor(p));
    const rema    = rawPerc.map((p, i) => ({ i, frac: p - floors[i] }));
    let leftover  = 100 - floors.reduce((s, v) => s + v, 0);
    rema.sort((a, b) => b.frac - a.frac);
    const rounded = floors.slice();
    for (let k = 0; k < leftover; k++) { if (k < rema.length) rounded[rema[k].i] += 1; }
    const remainingPct = Math.max(0, 100 - rounded.reduce((s, v) => s + v, 0));

    // Geometry
    const cx = 100, cy = 100, r = 80;
    const circumference = 2 * Math.PI * r;
    const ringSpentFrac = Math.min(spent / TOTAL_BUDGET, 1);
    function arcFrac(amount) { return (spent > TOTAL_BUDGET) ? (amount / spent) * ringSpentFrac : amount / TOTAL_BUDGET; }

    // Draw categories
    let offset = 0;
    CATEGORIES.forEach((cat, idx) => {
      const frac = arcFrac(cat.amount);
      const dash = Math.max(0, Math.min(frac * circumference, circumference - offset));
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
      circle.setAttribute('class', 'donut-slice'); circle.setAttribute('fill', 'none'); circle.setAttribute('stroke-width', '22');
      circle.setAttribute('stroke-dasharray', `${dash} ${circumference}`); circle.setAttribute('stroke-dashoffset', `${-offset}`);
      circle.style.stroke = COLORS[idx % COLORS.length];
      iwSlices.appendChild(circle);
      offset += dash;

      const row = document.createElement('div');
      row.className = 'legend-row';
      row.innerHTML = `
        <span class="swatch" style="background:${COLORS[idx % COLORS.length]};"></span>
        <span class="name">${cat.name}</span>
        <span class="amount">$${cat.amount.toLocaleString()}</span>
        <span class="pct">${rounded[idx]}%</span>
      `;
      iwLegend.appendChild(row);
    });

    // Remaining slice
    if (remaining > 0 && spent <= TOTAL_BUDGET) {
      const frac = remaining / TOTAL_BUDGET;
      const dash = Math.max(0, Math.min(frac * circumference, circumference - offset));
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
      circle.setAttribute('class', 'donut-slice is-remaining'); circle.setAttribute('fill', 'none'); circle.setAttribute('stroke-width', '22');
      circle.setAttribute('stroke-dasharray', `${dash} ${circumference}`); circle.setAttribute('stroke-dashoffset', `${-offset}`);
      circle.style.stroke = 'rgba(0,0,0,0.18)';
      iwSlices.appendChild(circle);

      const row = document.createElement('div');
      row.className = 'legend-row';
      row.innerHTML = `
        <span class="swatch" style="background:rgba(0,0,0,0.18);"></span>
        <span class="name">Remaining</span>
        <span class="amount">$${remaining.toLocaleString()}</span>
        <span class="pct">${remainingPct}%</span>
      `;
      iwLegend.appendChild(row);
    }

    iwHead.textContent = 'Remaining:';
    iwMain.textContent = `$${remaining.toLocaleString()}`;
    iwSub.textContent  = `$${TOTAL_BUDGET.toLocaleString()} total`;
  }

  // initial paint
  render();
})();
