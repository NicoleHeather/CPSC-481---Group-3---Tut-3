document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('itineraries-grid');
  if (!container) return;

  fetch('../assets/data/trips.json')
    .then(r => r.ok ? r.json() : Promise.reject(r.statusText))
    .then(data => {
      const trips = data.trips || [];
      if (!trips.length) {
        container.innerHTML = '<p>No itineraries found.</p>';
        return;
      }

      trips.forEach(trip => {
        const link = trip.link || '#';
        const img = (trip.images && trip.images[0]) || '';

        // create wrapper so the budget control can be a sibling (not nested interactive inside anchor)
        const wrapper = document.createElement('div');
        wrapper.className = 'itinerary-card';

        const a = document.createElement('a');
        a.className = 'event-card';
        a.href = link;
        a.setAttribute('role', 'group');
        a.setAttribute('aria-label', trip.title || 'Itinerary');
        if (img) a.style.backgroundImage = `url(${img})`;

        // optional price badge (kept conditional but usually not used for itineraries)
        if (trip.price) {
          const price = document.createElement('div');
          price.className = 'price-badge';
          price.textContent = `$${trip.price}`;
          a.appendChild(price);
        }

        const overlay = document.createElement('div');
        overlay.className = 'event-card__overlay';

        const title = document.createElement('h3');
        title.className = 'event-card__title';
        // Show the trip title as the bold headline (e.g., "Calgary"); fall back to location if title missing
        title.textContent = trip.title || trip.location || '';
        overlay.appendChild(title);

        const subtitle = document.createElement('p');
        subtitle.className = 'event-card__subtitle';
        // subtitle: only the date range (non-bold), placed under the title
        if (trip.startDate && trip.endDate) {
          const sDate = new Date(trip.startDate);
          const eDate = new Date(trip.endDate);
          const sameYear = sDate.getFullYear() === eDate.getFullYear();
          const s = sDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + (sameYear ? '' : ` ${sDate.getFullYear()}`);
          const e = eDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          subtitle.textContent = `${s} — ${e}`;
        } else {
          subtitle.textContent = '';
        }
        overlay.appendChild(subtitle);
        a.appendChild(overlay);

        // assemble wrapper
        wrapper.appendChild(a);

        // bottom action tab: Manage Budget
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'itinerary-card__tab';
        tab.setAttribute('aria-label', `Manage budget for ${trip.title || 'itinerary'}`);
        tab.dataset.tripId = trip.id || '';
        tab.textContent = 'Manage Budget';
        tab.addEventListener('click', (ev) => {
          ev.stopPropagation();
          ev.preventDefault();
          console.log('Manage Budget clicked for', tab.dataset.tripId);
          // TODO: open inline budget modal or navigate to budget panel
        });

        wrapper.appendChild(tab);
        container.appendChild(wrapper);
      });
    })
    .catch(err => {
      console.error('Failed to load trips:', err);
      const container = document.getElementById('itineraries-grid');
      if (container) container.innerHTML = '<p>Could not load itineraries.</p>';
    });
});
