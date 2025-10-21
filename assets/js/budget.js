// assets/js/budget.js
// Trip List -> Budget Detail (donut) + Add Expense modal

(function () {
  // ---------- Data ----------
  const TRIPS = [
    {
      id: 1,
      title: 'Itinerary - 1',
      period: 'Sept 13 – Sept 20, 2025',
      created: 'Aug 2, 2025',
      edited: 'Sept 6, 2025',
      status: 'Ongoing',
      totalBudget: 2000,
      categories: [
        { name: 'Housing',       amount: 800 },
        { name: 'Food',          amount: 300 },
        { name: 'Transport',     amount: 150 },
        { name: 'Entertainment', amount: 120 },
        { name: 'Misc',          amount: 80  },
      ],
    },
    {
      id: 2,
      title: 'Itinerary - 2',
      period: 'Jan 7 – Jan 9, 2025',
      created: 'Dec 15, 2024',
      edited: 'Dec 15, 2024',
      status: 'Completed',
      totalBudget: 1200,
      categories: [
        { name: 'Housing',  amount: 450 },
        { name: 'Food',     amount: 220 },
        { name: 'Transport',amount: 90  },
        { name: 'Tours',    amount: 140 },
        { name: 'Misc',     amount: 60  },
      ],
    },
    {
      id: 3,
      title: 'Itinerary - 3',
      period: 'Mar 14 – Mar 20, 2025',
      created: 'Jan 31, 2025',
      edited: 'Feb 20, 2025',
      status: 'Planned',
      totalBudget: 1800,
      categories: [
        { name: 'Housing',   amount: 700 },
        { name: 'Food',      amount: 260 },
        { name: 'Transport', amount: 140 },
        { name: 'Activities',amount: 220 },
        { name: 'Misc',      amount: 40  },
      ],
    },
  ];

  const COLORS = ['#ff7f27', '#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#f1c40f', '#2ecc71'];

  // ---------- DOM ----------
  const listView   = document.getElementById('trip-list-view');
  const listEl     = document.getElementById('trip-list');
  const detailView = document.getElementById('budget-detail-view');
  const backBtn    = document.getElementById('back-to-trips');

  const slicesGroup = document.getElementById('donut-slices');
  const legendEl    = document.getElementById('donut-legend');
  const mainText    = document.getElementById('donut-main');
  const subText     = document.getElementById('donut-sub');
  const headText    = document.getElementById('donut-remaining-label');

  const addBtn      = document.getElementById('add-expense-btn');
  const modal       = document.getElementById('expense-modal');
  const form        = document.getElementById('expense-form');
  const nameInput   = document.getElementById('exp-name');
  const amtInput    = document.getElementById('exp-amount');
  const catSelect   = document.getElementById('exp-category');
  const newCatWrap  = document.getElementById('new-cat-wrap');
  const newCatInput = document.getElementById('exp-newcat');
  const cancelBtn   = document.getElementById('expense-cancel');

  if (!listView || !listEl || !detailView || !slicesGroup || !legendEl || !mainText || !subText) return;

  // Keep track of which trip is open in detail view
  let currentTrip = null;

  // ---------- Trip list ----------
  function renderTripCard(trip) {
    const el = document.createElement('article');
    el.className = 'trip-card';
    el.innerHTML = `
      <div class="trip-card__header">
        <h3 class="trip-card__title">${trip.title}</h3>
      </div>
      <div class="trip-card__body">
        <p class="trip-card__row"><strong>${trip.period}</strong></p>
        <p class="trip-card__row">Created: ${trip.created}</p>
        <p class="trip-card__row">Last Edited: ${trip.edited}</p>
        <p class="trip-card__row">Trip Status: ${trip.status}</p>
      </div>
      <div class="trip-card__rail"></div>
      <button class="trip-card__cta btn btn-primary" type="button">View budget</button>
    `;
    el.querySelector('.trip-card__cta').addEventListener('click', () => showBudget(trip));
    return el;
  }

  function renderTripList() {
    listEl.innerHTML = '';
    TRIPS.forEach(t => listEl.appendChild(renderTripCard(t)));
  }

  // ---------- View switching ----------
  function showTrips() {
    detailView.classList.add('hidden');
    listView.classList.remove('hidden');
    currentTrip = null;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function showBudget(trip) {
    currentTrip = trip;
    listView.classList.add('hidden');
    detailView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'instant' });
    renderDonut(trip);
  }
  backBtn.addEventListener('click', showTrips);

  // ---------- Donut (per selected trip) ----------
  function renderDonut(trip) {
    slicesGroup.innerHTML = '';
    legendEl.innerHTML = '';

    const TOTAL_BUDGET = trip.totalBudget;
    const CATEGORIES   = trip.categories;

    const spent = CATEGORIES.reduce((s, c) => s + c.amount, 0);
    const overspent = spent > TOTAL_BUDGET;
    const remaining = Math.max(TOTAL_BUDGET - spent, 0);

    // Percentages that sum to 100 (largest remainder method)
    const rawPerc = CATEGORIES.map(c => (c.amount / TOTAL_BUDGET) * 100);
    const floors  = rawPerc.map(p => Math.floor(p));
    const rema    = rawPerc.map((p, i) => ({ i, frac: p - floors[i] }));
    let leftover  = 100 - floors.reduce((s, v) => s + v, 0);
    rema.sort((a, b) => b.frac - a.frac);
    const rounded = floors.slice();
    for (let k = 0; k < leftover; k++) {
      if (k < rema.length) rounded[rema[k].i] += 1;
    }
    const remainingPct = Math.max(0, 100 - rounded.reduce((s, v) => s + v, 0));

    // Geometry
    const cx = 100, cy = 100, r = 80;
    const circumference   = 2 * Math.PI * r;
    const ringSpentFrac   = Math.min(spent / TOTAL_BUDGET, 1);
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
      slicesGroup.appendChild(circle);
      offset += dash;

      const row = document.createElement('div');
      row.className = 'legend-row';
      row.innerHTML = `
        <span class="swatch" style="background:${COLORS[idx % COLORS.length]};"></span>
        <span class="name">${cat.name}</span>
        <span class="amount">$${cat.amount.toLocaleString()}</span>
        <span class="pct">${rounded[idx]}%</span>
      `;
      legendEl.appendChild(row);
    });

    // Remaining
    if (remaining > 0 && spent <= TOTAL_BUDGET) {
      const frac = remaining / TOTAL_BUDGET;
      const dash = Math.max(0, Math.min(frac * circumference, circumference - offset));
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
      circle.setAttribute('class', 'donut-slice is-remaining'); circle.setAttribute('fill', 'none'); circle.setAttribute('stroke-width', '22');
      circle.setAttribute('stroke-dasharray', `${dash} ${circumference}`); circle.setAttribute('stroke-dashoffset', `${-offset}`);
      circle.style.stroke = 'rgba(0,0,0,0.18)';
      slicesGroup.appendChild(circle);

      const row = document.createElement('div');
      row.className = 'legend-row';
      row.innerHTML = `
        <span class="swatch" style="background:rgba(0,0,0,0.18);"></span>
        <span class="name">Remaining</span>
        <span class="amount">$${remaining.toLocaleString()}</span>
        <span class="pct">${remainingPct}%</span>
      `;
      legendEl.appendChild(row);
    }

    // Center labels
    const remainingLabel = (spent > TOTAL_BUDGET) ? 0 : remaining;
    if (headText) headText.textContent = 'Remaining:';
    mainText.textContent = `$${remainingLabel.toLocaleString()}`;
    subText.textContent  = `$${TOTAL_BUDGET.toLocaleString()} total`;

    // Prepare modal category list
    refreshCategorySelect(trip);
  }

  // ---------- Modal: Add Expense ----------
  function openModal() {
    if (!currentTrip) return;
    modal.classList.remove('hidden');
    nameInput.value = '';
    amtInput.value = '';
    newCatInput.value = '';
    newCatWrap.classList.add('hidden');
    refreshCategorySelect(currentTrip);
    catSelect.focus();
  }
  function closeModal() { modal.classList.add('hidden'); }

  function refreshCategorySelect(trip) {
    catSelect.innerHTML = '';
    trip.categories.forEach(c => {
      const opt = document.createElement('option'); opt.value = c.name; opt.textContent = c.name;
      catSelect.appendChild(opt);
    });
    const newOpt = document.createElement('option'); newOpt.value = '__NEW__'; newOpt.textContent = 'New category…';
    catSelect.appendChild(newOpt);
  }

  catSelect?.addEventListener('change', () => {
    if (catSelect.value === '__NEW__') newCatWrap.classList.remove('hidden');
    else newCatWrap.classList.add('hidden');
  });

  addBtn?.addEventListener('click', openModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentTrip) return;

    const name = (nameInput.value || '').trim();
    const amt  = parseFloat(amtInput.value);
    if (!name || isNaN(amt) || amt < 0) return;

    let categoryName = catSelect.value;
    if (categoryName === '__NEW__') {
      categoryName = (newCatInput.value || '').trim();
      if (!categoryName) return;
    }

    // Update trip data
    const existing = currentTrip.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    if (existing) existing.amount += amt;
    else currentTrip.categories.push({ name: categoryName, amount: amt });

    closeModal();
    renderDonut(currentTrip);
  });

  // ---------- init ----------
  renderTripList();
  showTrips();
})();
