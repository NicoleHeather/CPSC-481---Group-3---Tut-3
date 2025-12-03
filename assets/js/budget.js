// ======================================================================
// budget.js (FINAL — trips.json + static categories + no persistence)
// ======================================================================

(function () {
  // --------------------------------------------------------------
  // CONSTANT STATIC CATEGORIES (no adding, no editing)
  // --------------------------------------------------------------
  const STATIC_CATEGORIES = [
    "Housing",
    "Food",
    "Transport",
    "Entertainment",
    "Misc"
  ];

  const COLORS = ["#ff7f27", "#1abc9c", "#3498db", "#9b59b6", "#e74c3c"];

  // --------------------------------------------------------------
  // Load trips.json (SINGLE SOURCE OF TRUTH)
  // --------------------------------------------------------------
  async function loadTrips() {
    const base = window.location.pathname.includes("/pages/") ? ".." : ".";
    const url = `${base}/assets/data/trips.json`;
    return (await fetch(url).then((res) => res.json())).trips || [];
  }

  // --------------------------------------------------------------
  // DOM Elements
  // --------------------------------------------------------------
  const listView = document.getElementById("trip-list-view");
  const listEl   = document.getElementById("trip-list");

  const detailView = document.getElementById("budget-detail-view");
  const backBtn    = document.getElementById("back-to-trips");

  const slicesGroup = document.getElementById("donut-slices");
  const legendEl    = document.getElementById("donut-legend");
  const mainText    = document.getElementById("donut-main");
  const subText     = document.getElementById("donut-sub");
  const remainingLabel = document.getElementById("donut-remaining-label");

  const addBtn   = document.getElementById("add-expense-btn");
  const modal    = document.getElementById("expense-modal");
  const form     = document.getElementById("expense-form");
  const nameInput = document.getElementById("exp-name");
  const amtInput  = document.getElementById("exp-amount");
  const catSelect = document.getElementById("exp-category");
  const cancelBtn = document.getElementById("expense-cancel");

  if (!listView || !listEl) return;

  // ----------------------------
  // State
  // ----------------------------
  let currentTrip = null;

  // Expenses stored *in memory only* (not persisted)
  const EXPENSES = {}; // { tripId: [ { category, amount } ] }

  // ----------------------------
  // Rendering Trip Cards (List)
  // ----------------------------
  function renderTripCard(trip) {
    const el = document.createElement("article");
    el.className = "trip-card";

    const start = new Date(trip.startDate).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric"
    });
    const end = new Date(trip.endDate).toLocaleDateString(undefined, {
      month: "short", day: "numeric", year: "numeric"
    });

    el.innerHTML = `
      <div class="trip-card__header">
        <h3 class="trip-card__title">${trip.title}</h3>
      </div>

      <div class="trip-card__body">
        <p class="trip-card__row"><strong>${start} – ${end}</strong></p>
      </div>

      <div class="trip-card__rail"></div>

      <button class="trip-card__cta btn btn-primary" type="button">View budget</button>
    `;

    el.querySelector(".trip-card__cta").addEventListener("click", () => {
      showBudget(trip);
    });

    return el;
  }

  async function renderTripList() {
    const trips = await loadTrips();
    listEl.innerHTML = "";
    trips.forEach(t => listEl.appendChild(renderTripCard(t)));
  }

  // ----------------------------
  // Switching Views
  // ----------------------------
  function showTrips() {
    detailView.classList.add("hidden");
    listView.classList.remove("hidden");
    currentTrip = null;
    window.scrollTo(0, 0);
  }

  function showBudget(trip) {
    currentTrip = trip;

    if (!EXPENSES[trip.id]) {
      EXPENSES[trip.id] = [];
    }

    listView.classList.add("hidden");
    detailView.classList.remove("hidden");

    renderDonut(trip);
    window.scrollTo(0, 0);
  }

  backBtn.addEventListener("click", showTrips);

  // ----------------------------
  // Add Expense Modal (non-persistent)
  // ----------------------------
  addBtn.addEventListener("click", () => {
    if (!currentTrip) return;

    modal.classList.remove("hidden");

    nameInput.value = "";
    amtInput.value = "";
    catSelect.innerHTML = "";

    STATIC_CATEGORIES.forEach(cat => {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });

    catSelect.value = STATIC_CATEGORIES[0];
    nameInput.focus();
  });

  cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!currentTrip) return;

    const name = nameInput.value.trim();
    const amt  = parseFloat(amtInput.value);
    const cat  = catSelect.value;

    if (!name || isNaN(amt)) return;

    EXPENSES[currentTrip.id].push({ name, category: cat, amount: amt });

    modal.classList.add("hidden");
    renderDonut(currentTrip);
  });

  // ----------------------------
  // Donut Chart Renderer
  // ----------------------------
  function renderDonut(trip) {
    slicesGroup.innerHTML = "";
    legendEl.innerHTML = "";

    const totalBudget = 2000; // Fixed prototype budget
    const expenses = EXPENSES[trip.id] || [];

    // Compute category totals
    const totals = STATIC_CATEGORIES.map(cat => {
      const amount = expenses
        .filter(e => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
      return { name: cat, amount };
    });

    const spent = totals.reduce((s, t) => s + t.amount, 0);
    const remaining = Math.max(0, totalBudget - spent);

    // DRAW donut segments
    const cx = 100, cy = 100, r = 80;
    const circumference = 2 * Math.PI * r;

    let offset = 0;

    totals.forEach((t, i) => {
      const percent = t.amount / totalBudget;
      const dash = percent * circumference;

      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", cx);
      c.setAttribute("cy", cy);
      c.setAttribute("r", r);
      c.classList.add("donut-slice");
      c.style.stroke = COLORS[i % COLORS.length];
      c.style.strokeDasharray = `${dash} ${circumference}`;
      c.style.strokeDashoffset = -offset;

      slicesGroup.appendChild(c);
      offset += dash;

      // Legend
      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `
        <span class="swatch" style="background:${COLORS[i % COLORS.length]}"></span>
        <span class="name">${t.name}</span>
        <span class="amount">$${t.amount.toFixed(2)}</span>
        <span class="pct">${Math.round(percent * 100)}%</span>
      `;
      legendEl.appendChild(row);
    });

    // Remaining
    const remPercent = remaining / totalBudget;
    const remDash = remPercent * circumference;
    const rc = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    rc.setAttribute("cx", cx);
    rc.setAttribute("cy", cy);
    rc.setAttribute("r", r);
    rc.classList.add("donut-slice");
    rc.style.stroke = "rgba(0,0,0,0.12)";
    rc.style.strokeDasharray = `${remDash} ${circumference}`;
    rc.style.strokeDashoffset = -offset;
    slicesGroup.appendChild(rc);

    const remainingRow = document.createElement("div");
    remainingRow.className = "legend-row";
    remainingRow.innerHTML = `
      <span class="swatch" style="background:rgba(0,0,0,0.12)"></span>
      <span class="name">Remaining</span>
      <span class="amount">$${remaining.toFixed(2)}</span>
      <span class="pct">${Math.round(remPercent * 100)}%</span>
    `;
    legendEl.appendChild(remainingRow);

    // Center labels
    remainingLabel.textContent = "Remaining:";
    mainText.textContent = `$${remaining.toFixed(2)}`;
    subText.textContent  = `$${totalBudget.toFixed(2)} total`;
  }

  // ----------------------------
  // INIT
  // ----------------------------
  renderTripList();
  showTrips();
})();
