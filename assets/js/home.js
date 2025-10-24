// home.js — render upcoming trips and wire simple scroll-snap carousels
(function () {
  const FALLBACK_TRIPS = [
    {
      id: 'trip-calgary-2026',
      title: 'Calgary',
      startDate: '2026-05-01',
      endDate: '2026-05-14',
      images: [
        '../assets/img/sample-event.svg'
      ],
      tags: ['Events']
    },
    {
      id: 'trip-banff-2026',
      title: 'Banff',
      startDate: '2026-06-10',
      endDate: '2026-06-17',
      images: [
        '../assets/img/guided-hike.svg'
      ],
      tags: ['Outdoors']
    }
  ];

  function formatDateRange(start, end) {
    try {
      const s = new Date(start);
      const e = new Date(end);
      const opts = { month: 'short', day: 'numeric' };
      if (s.getFullYear() !== e.getFullYear()) {
        return `${s.toLocaleDateString(undefined, opts)} ${s.getFullYear()} - ${e.toLocaleDateString(undefined, opts)} ${e.getFullYear()}`;
      }
      return `${s.toLocaleDateString(undefined, opts)} - ${e.toLocaleDateString(undefined, opts)}, ${e.getFullYear()}`;
    } catch (e) { return `${start} - ${end}`; }
  }

  function createTripSlide(trip) {
    const article = document.createElement('article');
    article.className = 'trip-slide';
    article.setAttribute('role', 'listitem');
    article.setAttribute('tabindex', '0');
    article.setAttribute('aria-label', `${trip.title}, ${formatDateRange(trip.startDate, trip.endDate)}`);

    const hero = document.createElement('div');
    hero.className = 'trip-hero';
    const img = document.createElement('img');
    img.src = (trip.images && trip.images[0]) || '../assets/img/sample-event.svg';
    img.alt = `${trip.title} image`;
    img.loading = 'lazy';
    hero.appendChild(img);

    const body = document.createElement('div');
    body.className = 'trip-body';
    const h3 = document.createElement('h3');
    h3.textContent = trip.title;
    const dates = document.createElement('p');
    dates.className = 'trip-dates';
    dates.textContent = formatDateRange(trip.startDate, trip.endDate);
    body.appendChild(h3);
    body.appendChild(dates);

    article.appendChild(hero);
    article.appendChild(body);

    return article;
  }

  function renderTripsAsSlides(trips) {
    const container = document.getElementById('upcoming-trips');
    const dotsContainer = document.getElementById('upcoming-trips-dots');
    if (!container) return;
    container.innerHTML = '';
    if (dotsContainer) dotsContainer.innerHTML = '';

    if (!trips || trips.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.innerHTML = '<p>No upcoming trips. <a href="../pages/CreateEvent.html">Add your first trip</a>.</p>';
      container.appendChild(empty);
      return;
    }

    const slides = trips.map(createTripSlide);
    slides.forEach(s => container.appendChild(s));

    // put slides inside a stacked container
    container.classList.add('trip-stack');

    // create dots
    if (dotsContainer) {
      slides.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.setAttribute('aria-label', `Show trip ${i+1}`);
        btn.addEventListener('click', () => showIndex(i));
        dotsContainer.appendChild(btn);
      });
    }

    const dotButtons = dotsContainer ? Array.from(dotsContainer.querySelectorAll('button')) : [];

    let current = 0;

    function applyClasses() {
      slides.forEach((s, idx) => {
        s.classList.remove('active','next','next2','prev','inactive');
        if (idx === current) s.classList.add('active');
        else if (idx === current + 1) s.classList.add('next');
        else if (idx === current + 2) s.classList.add('next2');
        else if (idx === current - 1) s.classList.add('prev');
        else s.classList.add('inactive');
      });
      dotButtons.forEach(b => b.classList.remove('active'));
      if (dotButtons[current]) dotButtons[current].classList.add('active');
    }

    function showIndex(i) {
      current = Math.max(0, Math.min(slides.length - 1, i));
      applyClasses();
    }

    // initial
    showIndex(0);

    // keyboard nav
    container.tabIndex = 0;
    container.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight' || ev.key === 'Right') { showIndex(current + 1); }
      else if (ev.key === 'ArrowLeft' || ev.key === 'Left') { showIndex(current - 1); }
    });

    // touch swipe support
    let touchStartX = null;
    container.addEventListener('touchstart', (ev) => { touchStartX = ev.touches[0].clientX; }, {passive:true});
    container.addEventListener('touchend', (ev) => {
      if (touchStartX == null) return;
      const dx = (ev.changedTouches[0].clientX - touchStartX);
      if (dx < -40) showIndex(current + 1);
      else if (dx > 40) showIndex(current - 1);
      touchStartX = null;
    });
  }

  function init() {
    let loaded = false;
    fetch('../assets/data/trips.json').then(r => r.json()).then(data => {
      loaded = true;
      renderTripsAsSlides(data.trips || data);
    }).catch(() => {
      if (!loaded) renderTripsAsSlides(FALLBACK_TRIPS);
    });

    // fallback quick render
    setTimeout(() => {
      const list = document.getElementById('upcoming-trips');
      if (list && list.children.length === 0) {
        renderTripsAsSlides(FALLBACK_TRIPS);
      }
    }, 200);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
