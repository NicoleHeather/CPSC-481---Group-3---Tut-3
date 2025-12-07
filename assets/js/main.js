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

// Reusable Add Event Modal Factory (extracted from itinerary-week.js)
window.createAddEventModal = function(options = {}) {
  const {
    onSubmit = null,
    onCancel = null,
    prefilledDate = null
  } = options;

  const overlay = document.createElement('div');
  overlay.className = 'qa-overlay';
  overlay.style.display = 'none';

  const modal = document.createElement('div');
  modal.className = 'qa-modal evd-modal';
  
  modal.innerHTML = `
    <div class="evd-header qa-header">
      <h2>Add Event</h2>
    </div>
    <div class="evd-body qa-body">
      <div class="evd-field">
        <svg class="evd-label" title="Title" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M4 12h16M4 17h16"></path></svg>
        <div>
          <input class="evd-input qa-input" type="text" name="title" placeholder="Event title" aria-label="Title">
          <span class="evd-error qa-title-error"></span>
        </div>
      </div>
      <div class="evd-field">
        <svg class="evd-label" title="Date" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
        <div>
          <input class="evd-input qa-input" type="date" name="date" aria-label="Date">
          <span class="evd-error qa-date-error"></span>
        </div>
      </div>
      <div class="evd-field evd-time-row">
        <svg class="evd-label" title="Time" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <div>
          <div class="evd-time-inputs">
            <input class="evd-input qa-input" type="time" name="time" aria-label="Start Time" placeholder="Start">
            <span class="evd-time-separator">–</span>
            <input class="evd-input qa-input" type="time" name="endTime" aria-label="End Time" placeholder="End">
          </div>
          <div class="evd-time-inputs">
            <span class="evd-error qa-time-error"></span>
            <span class="evd-time-separator" style="visibility:hidden">–</span>
            <span class="evd-error qa-endtime-error"></span>
          </div>
        </div>
      </div>
      <div class="evd-field">
        <svg class="evd-label" title="Location" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <div>
          <input class="evd-input qa-input" type="text" name="location" placeholder="Event location" aria-label="Location">
        </div>
      </div>
      <div class="evd-field">
        <svg class="evd-label" title="Price" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        <div>
          <input class="evd-input qa-input" type="number" name="price" placeholder="0 for free" min="0" step="0.01" aria-label="Price">
          <span class="evd-error qa-price-error"></span>
        </div>
      </div>
      <div class="evd-description-field">
        <svg class="evd-label" title="Description" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        <div>
          <textarea class="evd-input qa-input" name="description" placeholder="Event details" rows="3" aria-label="Description"></textarea>
        </div>
      </div>
    </div>
    <div class="evd-footer qa-footer">
      <button type="button" class="btn qa-cancel">Cancel</button>
      <button type="button" class="btn qa-add">Add Event</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Get form elements
  const cancel = modal.querySelector('.qa-cancel');
  const addBtn = modal.querySelector('.qa-add');
  const titleInput = modal.querySelector('input[name="title"]');
  const dateInput = modal.querySelector('input[name="date"]');
  const timeInput = modal.querySelector('input[name="time"]');
  const endTimeInput = modal.querySelector('input[name="endTime"]');
  const priceInput = modal.querySelector('input[name="price"]');
  const titleError = modal.querySelector('.qa-title-error');
  const dateError = modal.querySelector('.qa-date-error');
  const timeError = modal.querySelector('.qa-time-error');
  const endTimeError = modal.querySelector('.qa-endtime-error');
  const priceError = modal.querySelector('.qa-price-error');

  function showFieldError(input, errorEl, message) {
    if(input && errorEl) {
      input.classList.add('evd-invalid');
      errorEl.innerHTML = `<svg viewBox="0 0 16 16" fill="none" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;"><circle cx="8" cy="8" r="7" fill="#ff7f27"/><path d="M8 4v5M8 11h.01" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>${message}`;
    }
  }

  function clearFieldError(input, errorEl) {
    if(input && errorEl) {
      input.classList.remove('evd-invalid');
      errorEl.textContent = '';
    }
  }

  // Real-time validation
  titleInput.addEventListener('input', () => {
    const trimmed = titleInput.value.trim();
    if(trimmed) {
      clearFieldError(titleInput, titleError);
    } else {
      showFieldError(titleInput, titleError, 'Title cannot be empty');
    }
  });

  timeInput.addEventListener('input', () => {
    if(timeInput.value) {
      clearFieldError(timeInput, timeError);
    } else {
      showFieldError(timeInput, timeError, 'Start time is required');
    }
  });
  
  endTimeInput.addEventListener('input', () => {
    if(!endTimeInput.value) {
      showFieldError(endTimeInput, endTimeError, 'End time is required');
    } else if(timeInput.value) {
      const [startH, startM] = timeInput.value.split(':').map(Number);
      const [endH, endM] = endTimeInput.value.split(':').map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      if(endMins <= startMins && endMins !== 0) {
        showFieldError(endTimeInput, endTimeError, 'End time must be after start time');
      } else {
        clearFieldError(endTimeInput, endTimeError);
      }
    }
  });

  timeInput.addEventListener('change', () => {
    if(timeInput.value) {
      const [h, m] = timeInput.value.split(':').map(Number);
      const endH = h;
      const endM = m + 60;
      const endHours = Math.floor(endM / 60) + endH;
      const endMins = endM % 60;
      endTimeInput.value = `${String(endHours % 24).padStart(2,'0')}:${String(endMins).padStart(2,'0')}`;
      clearFieldError(endTimeInput, endTimeError);
    }
  });

  if (prefilledDate) dateInput.value = prefilledDate;

  cancel.addEventListener('click', () => {
    overlay.style.display = 'none';
    if (onCancel) onCancel();
  });

  addBtn.addEventListener('click', () => {
    // Validate before submitting
    let isValid = true;

    const title = titleInput.value.trim();
    if (!title) {
      showFieldError(titleInput, titleError, 'Title cannot be empty');
      isValid = false;
    } else {
      clearFieldError(titleInput, titleError);
    }

    const date = dateInput.value;
    if (!date) {
      showFieldError(dateInput, dateError, 'Date is required');
      isValid = false;
    } else {
      clearFieldError(dateInput, dateError);
    }

    const time = timeInput.value;
    if (!time) {
      showFieldError(timeInput, timeError, 'Start time is required');
      isValid = false;
    } else {
      clearFieldError(timeInput, timeError);
    }

    const endTime = endTimeInput.value;
    if (!endTime) {
      showFieldError(endTimeInput, endTimeError, 'End time is required');
      isValid = false;
    } else if(time) {
      const [startH, startM] = time.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;
      if(endMins <= startMins) {
        showFieldError(endTimeInput, endTimeError, 'End time must be after start time');
        isValid = false;
      } else {
        clearFieldError(endTimeInput, endTimeError);
      }
    }

    const price = priceInput.value;
    if (price && isNaN(parseFloat(price))) {
      showFieldError(priceInput, priceError, 'Price must be a valid number');
      isValid = false;
    } else {
      clearFieldError(priceInput, priceError);
    }

    if (!isValid) return;

    const formData = {
      title,
      date,
      time,
      endTime,
      location: modal.querySelector('input[name="location"]').value.trim(),
      price: price || '0',
      description: modal.querySelector('textarea[name="description"]').value.trim()
    };

    if (onSubmit) onSubmit(formData);
    overlay.style.display = 'none';
  });

  return {
    show: () => { overlay.style.display = 'block'; },
    hide: () => { overlay.style.display = 'none'; },
    modal,
    overlay
  };
};