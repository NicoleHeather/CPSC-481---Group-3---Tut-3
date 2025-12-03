document.addEventListener('DOMContentLoaded', function () {
  const container = document.getElementById('itineraries-grid');
  if (!container) return;

  // Load trips + events so we can show sample events on each card
  Promise.all([
    fetch('../assets/data/trips.json').then(r => r.ok ? r.json() : Promise.reject(r.statusText)),
    fetch('../assets/data/events.json').then(r => r.ok ? r.json() : Promise.reject(r.statusText))
  ])
    .then(([tripsData, eventsData]) => {
      const trips = (tripsData && tripsData.trips) || [];
      const allEvents = (eventsData && (eventsData.explore || [])).concat((eventsData && eventsData.saved) || []) || [];
      if (!trips.length) {
        container.innerHTML = '<p>No itineraries found.</p>';
        return;
      }

      // Helpers
      const randInt = (min,max) => Math.floor(Math.random()*(max-min+1))+min;
      const parseISO = (d) => new Date(d + 'T00:00:00');
      const randomDateBetween = (startIso,endIso) => {
        const s = parseISO(startIso); const e = parseISO(endIso);
        const diff = e.getTime() - s.getTime();
        const t = s.getTime() + Math.floor(Math.random() * (diff+1));
        return new Date(t).toISOString().slice(0,10);
      };

      function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=randInt(0,i); [arr[i],arr[j]]=[arr[j],arr[i]]; } return arr; }

      trips.forEach(trip => {
        const link = trip.link || '#';
        const img = (trip.images && trip.images[0]) || '';

        // create wrapper so the budget control can be a sibling (not nested interactive inside anchor)
        const wrapper = document.createElement('div');
        wrapper.className = 'itinerary-card';

        const a = document.createElement('a');
        a.className = 'event-card';
        // Open the custom week view for this trip (bookmarkable)
        a.href = `../pages/ItineraryWeek.html?trip=${encodeURIComponent(trip.id || '')}`;
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
        // Insert a minimal list of sample events (start time + title)
        const miniList = document.createElement('ul');
        miniList.className = 'itinerary-mini-list';
        // Build a candidate pool: prefer same-location events, otherwise use all
        const candidates = allEvents.filter(ev => ev.location === trip.title);
        const pool = (candidates.length ? candidates.slice() : allEvents.slice());
        shuffle(pool);
        // pick up to 3 different events for preview
        const pickCount = Math.min(pool.length, 3);
        for(let i=0;i<pickCount;i++){
          const ev = Object.assign({}, pool[i]);
          // ensure event date sits within trip range
          if(trip.startDate && trip.endDate){ ev.date = randomDateBetween(trip.startDate, trip.endDate); }
          if(!ev.time) ev.time = `${randInt(9,20)}:00`;
          const li = document.createElement('li');
          li.innerHTML = `<span class="mini-time">${ev.time}</span> <span class="mini-title">${ev.title}</span>`;
          miniList.appendChild(li);
        }
        overlay.appendChild(miniList);
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
