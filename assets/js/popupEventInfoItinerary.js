// =======================================================
// Itinerary-only Event Loader (isolated from main system)
// =======================================================

(async function () {
  const params = new URLSearchParams(location.search);
  const id = Number(params.get("id"));
  if (!id) return;

  // Determine correct base path
  const path = window.location.pathname;
  const base = path.includes("/pages/") ? ".." : ".";

  // Fetch explore[] only
  const url = `${base}/assets/data/events.json`;
  let events = [];

  try {
    const data = await fetch(url).then(r => r.json());
    events = data.explore || [];
  } catch (err) {
    console.error("Failed to load events.json:", err);
    return;
  }

  const ev = events.find(e => e.id === id);
  if (!ev) {
    console.error("Event not found:", id);
    return;
  }

  // Fill UI
  document.getElementById("event-title").textContent = ev.title;
  document.getElementById("event-img").src = ev.img;
  document.getElementById("event-date").textContent = ev.date;
  document.getElementById("event-time").textContent = ev.time;
  document.getElementById("event-duration").textContent = ev.duration;
  document.getElementById("event-location").textContent = ev.location;
  document.getElementById("event-price").textContent = ev.price;
  document.getElementById("event-description").textContent = ev.description;
})();
