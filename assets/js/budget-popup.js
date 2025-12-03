// =====================================================================
// budget-popup.js (FINAL WORKING VERSION)
// Defines openBudgetPopup() required by itinerary-week.js
// =====================================================================

(function () {

  const modal      = document.getElementById("iw-budget-modal");
  const closeBtn   = document.getElementById("iw-budget-close");

  const slices     = document.getElementById("iw-donut-slices");
  const legend     = document.getElementById("iw-donut-legend");
  const mainText   = document.getElementById("iw-donut-main");
  const subText    = document.getElementById("iw-donut-sub");
  const remLabel   = document.getElementById("iw-donut-remaining-label");

  const addBtn     = document.getElementById("iw-add-expense-btn");
  const expModal   = document.getElementById("iw-expense-modal");
  const expForm    = document.getElementById("iw-expense-form");
  const expCancel  = document.getElementById("iw-exp-cancel");

  const expName    = document.getElementById("iw-exp-name");
  const expAmt     = document.getElementById("iw-exp-amount");
  const expCat     = document.getElementById("iw-exp-category");

  const STATIC_CATS = ["Housing", "Food", "Transport", "Entertainment", "Misc"];
  const COLORS = ["#ff7f27","#1abc9c","#3498db","#9b59b6","#e74c3c"];

  let currentTrip = null;
  let expenses = [];

  // ==========================================================
  // REQUIRED by itinerary-week.js
  // ==========================================================
  window.openBudgetPopup = function (trip) {
    currentTrip = trip;
    expenses = []; // reset per opening

    modal.classList.remove("hidden");
    renderBudget();
  };

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));

  // ==========================================================
  // Rendering donut / legend
  // ==========================================================
  function renderBudget() {
    const totalBudget = 2000;

    const totals = STATIC_CATS.map(cat => ({
      name: cat,
      amount: expenses
        .filter(e => e.category === cat)
        .reduce((s,e)=>s+e.amount,0)
    }));

    const spent = totals.reduce((s,t)=>s+t.amount,0);
    const rem = totalBudget - spent;

    // Donut center
    mainText.textContent = `$${rem.toFixed(2)}`;
    subText.textContent = `$${totalBudget.toFixed(2)} total`;

    // Legend
    legend.innerHTML = "";
    totals.forEach((cat,i)=>{
      const row = document.createElement("div");
      row.className = "legend-row";
      row.innerHTML = `
        <span class="swatch" style="background:${COLORS[i]}"></span>
        <span>${cat.name}</span>
        <strong>$${cat.amount.toFixed(2)}</strong>
      `;
      legend.appendChild(row);
    });

    // Donut animation
    slices.innerHTML = "";
    const cx = 100, cy = 100, r = 80;
    const circ = 2 * Math.PI * r;
    let offset = 0;

    totals.forEach((t,i)=>{
      const frac = t.amount / totalBudget;
      const dash = frac * circ;

      const seg = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      seg.setAttribute("cx", cx);
      seg.setAttribute("cy", cy);
      seg.setAttribute("r",  r);
      seg.classList.add("donut-slice");
      seg.style.stroke = COLORS[i];
      seg.style.strokeDasharray = `0 ${circ}`;
      seg.style.strokeDashoffset = -offset;

      slices.appendChild(seg);

      requestAnimationFrame(()=>{
        seg.style.transition = "stroke-dasharray 0.4s ease-out";
        seg.style.strokeDasharray = `${dash} ${circ}`;
      });

      offset += dash;
    });
  }

  // ==========================================================
  // Expense modal handling
  // ==========================================================
  addBtn.addEventListener("click", () => {
    expCat.innerHTML = "";
    STATIC_CATS.forEach(c=>{
      const o = document.createElement("option");
      o.value = c;
      o.textContent = c;
      expCat.appendChild(o);
    });

    expName.value = "";
    expAmt.value  = "";
    expModal.classList.remove("hidden");
  });

  expCancel.addEventListener("click",()=>{
    expModal.classList.add("hidden");
  });

  expForm.addEventListener("submit", e=>{
    e.preventDefault();

    const name = expName.value.trim();
    const amt  = parseFloat(expAmt.value);
    const cat  = expCat.value;

    if (!name || isNaN(amt)) return;

    expenses.push({ name, amount: amt, category: cat });
    expModal.classList.add("hidden");
    renderBudget();
  });

})();
