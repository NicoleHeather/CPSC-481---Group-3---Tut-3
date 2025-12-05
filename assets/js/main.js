// Minimal JS for prototype interactions
// Compute repo-aware site base for GitHub Pages (e.g. '/CPSC-481---Group-3---Tut-3')
(function(){
  try{
    const REPO_NAME = 'CPSC-481---Group-3---Tut-3';
    const seg = window.location.pathname.split('/').filter(Boolean)[0] || '';
    window.SITE_BASE = (seg === REPO_NAME) ? ('/' + REPO_NAME) : '';
  }catch(e){ window.SITE_BASE = ''; }
})();

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

// Header back button behavior: go back when possible, otherwise fall back to a sensible page
(function () {
  function goBackOrHome() {
    // compute a root-aware home path (keep it relative to the site root)
    const root = window.location.pathname.split('/pages/')[0] || '';
    const home = root + '/pages/Home.html';

    // Prefer history.back() when there is a previous entry
    try {
      if (window.history && window.history.length > 1) {
        window.history.back();
        return;
      }
    } catch (e) {
      // ignore and fall through to referrer/home
    }

    // If we have a same-origin referrer, go there
    const ref = document.referrer;
    if (ref) {
      try {
        const u = new URL(ref);
        if (u.origin === location.origin) {
          location.href = ref;
          return;
        }
      } catch (e) {
        // invalid referrer
      }
    }

    // final fallback: home page
    location.href = home;
  }

  document.addEventListener('click', function (ev) {
    const btn = ev.target.closest && ev.target.closest('.header-left-btn');
    if (!btn) return;
    ev.preventDefault();
    goBackOrHome();
  });
})();