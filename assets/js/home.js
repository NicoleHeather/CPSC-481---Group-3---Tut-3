// home.js — render upcoming trips and wire simple scroll-snap carousels
(function () {
  const FALLBACK_TRIPS = [
    {
      id: 'trip-calgary-2026',
      title: 'Calgary',
      startDate: '2026-05-01',
      endDate: '2026-05-14',
      images: [
        '../assets/img/sample-event.svg',
        '../assets/img/full-logo-white-outline.png',
        '../assets/img/full-logo-monochrome.png'
      ],
      tags: ['Events']
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

  function createTripCard(trip) {
    const article = document.createElement('article');
    article.className = 'trip-card';
    article.setAttribute('role', 'listitem');
    article.setAttribute('tabindex', '0');
    article.setAttribute('aria-label', `${trip.title}, ${formatDateRange(trip.startDate, trip.endDate)}`);

    const carousel = document.createElement('div');
    carousel.className = 'trip-carousel';
    carousel.setAttribute('role', 'region');
    carousel.setAttribute('aria-roledescription', 'carousel');
    carousel.setAttribute('aria-label', `Images for ${trip.title}`);

    trip.images.forEach((src, i) => {
      const slide = document.createElement('div');
      slide.className = 'slide';
      const img = document.createElement('img');
      img.src = src;
      img.alt = `${trip.title} image ${i+1}`;
      img.loading = 'lazy';
      slide.appendChild(img);
      carousel.appendChild(slide);
    });

    const body = document.createElement('div');
    body.className = 'trip-body';
    const h3 = document.createElement('h3');
    h3.textContent = trip.title;
    const dates = document.createElement('p');
    dates.className = 'trip-dates';
    dates.textContent = formatDateRange(trip.startDate, trip.endDate);
    body.appendChild(h3);
    body.appendChild(dates);

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';

    article.appendChild(carousel);
    article.appendChild(body);
    article.appendChild(dots);

    // wire carousel behavior after insertion
    setTimeout(() => wireCarousel(article), 0);

    return article;
  }

  function wireCarousel(card) {
    const carousel = card.querySelector('.trip-carousel');
    if (!carousel) return;
    const slides = Array.from(card.querySelectorAll('.slide'));
    const dots = card.querySelector('.carousel-dots');

    // create dots
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.setAttribute('aria-label', `Show image ${i+1}`);
      btn.addEventListener('click', () => {
        slides[i].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      });
      dots.appendChild(btn);
    });

    const dotButtons = Array.from(dots.querySelectorAll('button'));
    if (dotButtons.length) dotButtons[0].classList.add('active');

    // IntersectionObserver to detect visible slide
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = slides.indexOf(entry.target);
          dotButtons.forEach(b => b.classList.remove('active'));
          if (dotButtons[idx]) dotButtons[idx].classList.add('active');
        }
      });
    }, { root: carousel, threshold: 0.6 });

    slides.forEach(s => io.observe(s));

    // keyboard accessibility: left/right arrows to move slide
    carousel.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowRight') {
        ev.preventDefault();
        const current = dotButtons.findIndex(b => b.classList.contains('active'));
        const next = Math.min(slides.length - 1, current + 1);
        slides[next].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else if (ev.key === 'ArrowLeft') {
        ev.preventDefault();
        const current = dotButtons.findIndex(b => b.classList.contains('active'));
        const prev = Math.max(0, current - 1);
        slides[prev].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    });

    // make carousel focusable for keyboard
    carousel.tabIndex = 0;
  }

  function renderTrips(trips) {
    const container = document.getElementById('upcoming-trips');
    if (!container) return;
    container.innerHTML = '';
    if (!trips || trips.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'card';
      empty.innerHTML = '<p>No upcoming trips. <a href="../pages/CreateEvent.html">Add your first trip</a>.</p>';
      container.appendChild(empty);
      return;
    }

    trips.forEach(t => container.appendChild(createTripCard(t)));
  }

  // initialize after DOM ready
  function init() {
    // try to load trips from a JSON endpoint (non-blocking), fallback to FALLBACK_TRIPS
    let loaded = false;
    fetch('../assets/data/trips.json').then(r => r.json()).then(data => {
      loaded = true;
      renderTrips(data.trips || data);
    }).catch(() => {
      if (!loaded) renderTrips(FALLBACK_TRIPS);
    });

    // in case fetch not available or returns error, always show fallback quickly
    setTimeout(() => {
      const list = document.getElementById('upcoming-trips');
      if (list && list.children.length === 0) {
        renderTrips(FALLBACK_TRIPS);
      }
    }, 250);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
