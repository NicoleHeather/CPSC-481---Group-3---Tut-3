// Minimal JS for prototype interactions
document.addEventListener('DOMContentLoaded', function () {
  // Mobile nav toggle
  const navToggle = document.getElementById('nav-toggle');
  const siteNav = document.getElementById('site-nav');
  if (navToggle && siteNav) {
    navToggle.addEventListener('click', function () {
      const open = siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
    });
  }

  // Load mock data into #events. Resolve path so it works from root and from /pages/.
  const eventsEl = document.getElementById('events');
  if (eventsEl) {
    // compute base path: if current URL path contains '/pages/', go up one level
    const path = window.location.pathname;
    const base = path.includes('/pages/') ? '..' : '.';
    const dataUrl = `${base}/assets/data/mock.json`;

    // Inline fallback data so the prototype works without a backend or a local server
    const FALLBACK_DATA = {
      events: [
        { id: 1, title: 'Campus Concert', date: '2025-10-25', location: 'Auditorium', description: 'An evening of student bands and performances.' },
        { id: 2, title: 'Career Fair', date: '2025-11-02', location: 'Main Hall', description: 'Meet employers and learn about internships.' }
      ]
    };

    // Render events from data
    function renderEvents(data) {
      data.events.forEach(ev => {
        const card = document.createElement('article');
        card.className = 'card';
        card.innerHTML = `<h3>${ev.title}</h3><p class="muted">${ev.date} • ${ev.location}</p><p>${ev.description}</p><a class="btn" href="${base}/pages/EventInfo.html">View</a>`;
        eventsEl.appendChild(card);
      });
    }

    // Try to fetch external mock.json (useful when serving over HTTP)
    // Fall back to inline data if fetch fails
    fetch(dataUrl)
      .then(r => {
        if (!r.ok) throw new Error('Network response not ok');
        return r.json();
      })
      .then(data => renderEvents(data))
      .catch(() => {
        renderEvents(FALLBACK_DATA);
      });
  }
});