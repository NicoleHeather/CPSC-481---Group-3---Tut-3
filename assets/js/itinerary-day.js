// ======================================================================
// itinerary-day.js (FINAL — Sequential Fill)
// ======================================================================

let eventId;
let removeActive;
let addActive;

(function () {
  const $ = (sel, node = document) => node.querySelector(sel);

  async function loadTrips() {
    const base = window.location.pathname.includes("/pages/") ? ".." : ".";
    return (await fetch(`${base}/assets/data/trips.json`).then(r => r.json())).trips || [];
  }

  async function loadEvents() {
    const base = window.location.pathname.includes("/pages/") ? ".." : ".";
    return (await fetch(`${base}/assets/data/events.json`).then(r => r.json())).explore || [];
  }

  function parse(d) { return new Date(d + "T00:00:00"); }

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

  // Sequential Fill
  function mapEvents(trip, events) {
    const days = eachDate(trip.startDate, trip.endDate).map(date => ({
      date,
      activities: []
    }));

    let index = 0;
    const PER_DAY = 2;

    for (let i = 0; i < days.length; i++) {
      for (let j = 0; j < PER_DAY; j++) {
        if (index >= events.length) break;
        days[i].activities.push(events[index]);
        index++;
      }
    }

    return days;
  }

  const params = new URLSearchParams(location.search);
  const tripId = params.get("trip");
  const dateISO = params.get("date");

  console.log(tripId);

  if (!tripId || !dateISO) return;

  const calendar = $("#calendar");
  const overlay = document.createElement("div");
  overlay.className = "events-layer";
  calendar.appendChild(overlay);

  function idx(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 2 + (m >= 30 ? 1 : 0);
  }

  function px(i) {
    const slot = parseFloat(getComputedStyle(calendar).getPropertyValue("--slot-height")) || 42;
    return i * slot;
  }

  function addM(t, mins) {
    const [h, m] = t.split(":").map(Number);
    const total = h * 60 + m + mins;
    return `${String(Math.floor(total / 60)).padStart(2,"0")}:${String(total % 60).padStart(2,"0")}`;
  }

  for (let i = 0; i < 48; i++) {
    const h = Math.floor(i / 2);
    const m = i % 2 ? "30" : "00";
    const time = `${String(h).padStart(2, "0")}:${m}`;
    const t = document.createElement("div");
    t.className = "time-cell";
    t.textContent = time;
    const slot = document.createElement("div");
    slot.className = "slot-cell";
    calendar.appendChild(t);
    calendar.appendChild(slot);
  }

  (async () => {

    const trips = await loadTrips();
    const events = await loadEvents();

    const trip = trips.find(t => t.id === tripId);
    if (!trip) return;

    const days = mapEvents(trip, events);
    const day = days.find(d => d.date === dateISO);
    if (!day) return;

    $("#day-title").textContent = trip.title;
    $("#day-subtitle").textContent = dateISO;

    day.activities.forEach(ev => {
      const startIdx = idx(ev.time);
      const dur = Number(ev.duration) * 60;
      const endIdx = startIdx + Math.ceil(dur / 30);

      const block = document.createElement("div");

      block.className = "event-block";
      block.style.top = px(startIdx) + "px";
      block.style.height = (px(endIdx) - px(startIdx) - 4) + "px";

      if ((removeActive && ev.id == eventId) || ev.id == 9)
      {
        console.log("REMOVE");
        block.style.display = "none";
        className = null;
      }

      block.innerHTML = `
        <span class="event-title">${ev.title}</span>
        <span class="event-time">${ev.time} – ${addM(ev.time, dur)}</span>
      `;

      if ((removeActive && ev.id == eventId) || ev.id == 9)
      {
        console.log("REMOVE");
        block.style.display = "none";
        block.innerHTML = null;
        block.style.color = "none";

      block.addEventListener("click", () => {
        location.href = `./EventInfo.html?id=${ev.id}&trip=${tripId}&date=${dateISO}`;
      });

      overlay.appendChild(block);
    });
  })();

})();

window.onload = function () {
  console.log("LOADED");
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);

  eventId= urlParams.get('id');
  removeActive = urlParams.get('remove');
  addActive = urlParams.get('add');
  console.log('Event ID:', eventId);
  console.log('remove', removeActive);
  console.log('new event', addActive);
}

const backToWeekButton = document.getElementById('back-to-week')

backToWeekButton.addEventListener('click', function () {

  backToWeekButton.href = `./ItineraryWeek.html?id=${eventId}&remove=${1}`;
});