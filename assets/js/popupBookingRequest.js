// popupBookingRequest.js - Minimal Fresh Version
window.onload = function () {
    console.log('[popupBookingRequest] loaded');
    const sendRequestBtn = document.getElementById('submit-info-btn');
    const modal = document.getElementById('booking-request-modal');
    const backBtn = document.getElementById('modal-booking-back');
    const addBtn = document.getElementById('modal-booking-add');
    const itinerarySelect = document.getElementById('modal-itinerary-select');
    // hold the merged itineraries so Add handler can validate
    let mergedItineraries = [];

    function parseDateSafe(s) {
        if (!s) return null;
        // try to find an ISO date portion first
        const isoMatch = String(s).match(/(\d{4}-\d{2}-\d{2})/);
        if (isoMatch) {
            const d = new Date(isoMatch[1] + 'T00:00:00');
            return isNaN(d) ? null : d;
        }
        const d = new Date(s);
        return isNaN(d) ? null : d;
    }

    function showValidationPopup(message) {
        // create lightweight modal overlay
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.35)';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '1100';

        const panel = document.createElement('div');
        panel.style.background = '#fff';
        panel.style.borderRadius = '12px';
        panel.style.padding = '1rem 1.25rem';
        panel.style.maxWidth = '420px';
        panel.style.width = '92%';
        panel.style.boxShadow = '0 8px 40px rgba(0,0,0,0.16)';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.gap = '0.75rem';

        const heading = document.createElement('div');
        heading.textContent = 'Cannot be added to this itinerary.';
        heading.style.fontWeight = '700';
        heading.style.color = 'var(--color-primary, #d43b4a)';
        heading.style.fontSize = '1rem';

        const msg = document.createElement('div');
        msg.style.margin = '0';
        msg.style.color = 'var(--color-text, #222)';
        msg.style.fontSize = '0.95rem';
        msg.style.lineHeight = '1.3';
        msg.textContent = message;

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'flex-end';

        const ok = document.createElement('button');
        ok.textContent = 'OK';
        ok.className = 'btn';
        ok.style.minWidth = '84px';
        ok.style.padding = '0.5rem 0.85rem';
        ok.addEventListener('click', removeOverlay);

        actions.appendChild(ok);
        panel.appendChild(heading);
        panel.appendChild(msg);
        panel.appendChild(actions);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        // remove overlay helper
        function removeOverlay() {
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
            window.removeEventListener('keydown', escHandler);
        }

        // close when clicking outside panel
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) removeOverlay();
        });

        // close on Escape
        function escHandler(e) {
            if (e.key === 'Escape') removeOverlay();
        }
        window.addEventListener('keydown', escHandler);
    }

    // Show modal and populate dropdown
    if (sendRequestBtn && modal && itinerarySelect) {
        sendRequestBtn.addEventListener('click', function (e) {
            e.preventDefault();
            modal.style.display = 'block';
            // Load itineraries (repo + user)
            let merged = [];
            fetch('../assets/data/trips.json')
                .then(response => response.json())
                .then(data => {
                    const trips = data.trips || [];
                    const extrasRaw = localStorage.getItem('itineraries.extras');
                    const extras = extrasRaw ? JSON.parse(extrasRaw) : [];
                    const deletedRaw = localStorage.getItem('itineraries.deleted');
                    const deleted = deletedRaw ? new Set(JSON.parse(deletedRaw)) : new Set();
                    mergedItineraries = trips.concat(extras.map(t => Object.assign({isExtra: true}, t)));
                    mergedItineraries = mergedItineraries.filter(t => t.id && !deleted.has(t.id));
                    console.log('[popupBookingRequest] merged itineraries:', mergedItineraries);
                    // Clear existing options except the first one
                    while (itinerarySelect.options.length > 1) {
                        itinerarySelect.remove(1);
                    }
                    // Add trip options
                    mergedItineraries.forEach(trip => {
                        const option = document.createElement('option');
                        option.value = trip.id;
                        option.textContent = trip.title;
                        itinerarySelect.appendChild(option);
                    });
                });
        });
    }
    // Back button closes modal
    if (backBtn && modal) {
        backBtn.addEventListener('click', function () {
            modal.style.display = 'none';
        });
    }
    // Add to Itinerary button (optional logic)
    if (addBtn && itinerarySelect) {
        addBtn.addEventListener('click', function () {
            const selectedId = itinerarySelect.value;
            if (!selectedId) {
                showValidationPopup('Please select an itinerary to add to.');
                return;
            }
            // Find selected itinerary from merged list
            const selected = mergedItineraries.find(t => String(t.id) === String(selectedId));
            if (!selected) {
                showValidationPopup('The selected itinerary is no longer available.');
                return;
            }

            // Basic form validation: ensure required fields exist
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const dateInput = document.getElementById('date');
            const eventTitleInput = document.getElementById('event-name-booking');

            const missing = [];
            if (!nameInput || !nameInput.value.trim()) missing.push('Name');
            if (!emailInput || !emailInput.value.trim()) missing.push('Email');
            if (!eventTitleInput || !eventTitleInput.value.trim()) missing.push('Event');
            if (!dateInput || !dateInput.value.trim()) missing.push('Date');

            if (missing.length) {
                showValidationPopup('Please complete required fields: ' + missing.join(', '));
                return;
            }

            // Check for simple duplicate event in selected itinerary (match by title + date)
            const existingEvents = selected.events || selected.items || selected.days || [];
            // normalize events array if days structure exists
            let flatEvents = [];
            if (Array.isArray(existingEvents)) {
                flatEvents = existingEvents;
            } else if (Array.isArray(selected.days)) {
                // if days -> each day may have events
                selected.days.forEach(d => {
                    if (Array.isArray(d.events)) flatEvents = flatEvents.concat(d.events);
                });
            }

            const titleVal = eventTitleInput.value.trim();
            const dateVal = dateInput.value.trim();

            // Validate event date within selected itinerary range (if trip defines start/end)
            const eventDateObj = parseDateSafe(dateVal);
            if ((selected.startDate || selected.start || selected.endDate || selected.end) && !eventDateObj) {
                showValidationPopup('Unable to parse the event date for range validation. Use YYYY-MM-DD format.');
                return;
            }
            if (eventDateObj) {
                const tripStart = parseDateSafe(selected.startDate || selected.start);
                const tripEnd = parseDateSafe(selected.endDate || selected.end);
                if (tripStart && eventDateObj < tripStart) {
                    showValidationPopup(`Event date is before the itinerary start date (${tripStart.toISOString().slice(0,10)}).`);
                    return;
                }
                if (tripEnd && eventDateObj > tripEnd) {
                    showValidationPopup(`Event date is after the itinerary end date (${tripEnd.toISOString().slice(0,10)}).`);
                    return;
                }
            }

            const conflict = flatEvents.find(ev => {
                if (!ev) return false;
                const evTitle = ev.title || ev.name || '';
                const evDate = ev.date || ev.day || '';
                return evTitle === titleVal && evDate === dateVal;
            });

            if (conflict) {
                showValidationPopup('This event already exists in the selected itinerary.');
                return;
            }

            // All validations passed: proceed to add/redirect
            // Store the new event details
            const eventData = {
                title: eventTitleInput.value,
                date: dateInput.value,
                time: document.getElementById('time') ? document.getElementById('time').value : '',
                name: nameInput.value,
                email: emailInput.value,
                phone: document.getElementById('phone') ? document.getElementById('phone').value : '',
                guests: document.getElementById('guest-number') ? document.getElementById('guest-number').value : ''
            };
            sessionStorage.setItem('newEventData', JSON.stringify(eventData));
            sessionStorage.setItem('newEventTrip', selectedId);
            modal.style.display = 'none';
            // navigate to itinerary week with selected trip
            window.location.href = `../pages/ItineraryWeek.html?trip=${encodeURIComponent(selectedId)}`;
        });
    }
}