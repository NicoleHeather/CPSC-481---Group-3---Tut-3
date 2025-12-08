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
    const BASE_PATH = window.location.pathname.includes('/pages/') ? '..' : '.';

    async function loadEventsForTrip(tripId) {
        // Prefer user's saved events in localStorage under `events-<tripId>`.
        try {
            const key = `events-${tripId}`;
            const raw = localStorage.getItem(key);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed;
            }
        } catch (e) { /* ignore parse errors */ }

        // Next, try per-trip seed file in assets/data/events-<tripId>.json
        try {
            const resp = await fetch(`${BASE_PATH}/assets/data/events-${encodeURIComponent(tripId)}.json`);
            if (resp && resp.ok) {
                const body = await resp.json();
                if (body && Array.isArray(body.explore)) return body.explore.slice();
            }
        } catch (e) { /* ignore fetch errors */ }

        // Fallback: try global events.json and filter by trip id mapping (best-effort)
        try {
            const resp = await fetch(`${BASE_PATH}/assets/data/events.json`);
            if (resp && resp.ok) {
                const body = await resp.json();
                if (body && Array.isArray(body.explore)) {
                    // Best-effort: return events that mention the tripId in their id or location
                    return body.explore.filter(ev => String(ev.id).includes(tripId) || (ev.location && String(ev.location).toLowerCase().includes(tripId.split('-')[1] || '')));
                }
            }
        } catch (e) { /* ignore */ }

        return [];
    }

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

    function parseTimeToMinutes(t) {
        if (!t) return null;
        const s = String(t).trim();
        // 12-hour with AM/PM
        const m12 = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (m12) {
            let hh = parseInt(m12[1], 10);
            const mm = parseInt(m12[2], 10);
            const period = m12[3].toUpperCase();
            if (period === 'PM' && hh !== 12) hh += 12;
            if (period === 'AM' && hh === 12) hh = 0;
            return hh * 60 + mm;
        }
        // 24-hour HH:MM
        const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
        if (m24) {
            const hh = parseInt(m24[1], 10);
            const mm = parseInt(m24[2], 10);
            return hh * 60 + mm;
        }
        return null;
    }

    function parseTimeRange(rangeStr, defaultDurationMins = 120) {
        if (!rangeStr) return null;
        // split on hyphen or en-dash
        const parts = rangeStr.split(/\s*[\-–]\s*/);
        const start = parseTimeToMinutes(parts[0]);
        let end = null;
        if (parts.length > 1) end = parseTimeToMinutes(parts[1]);
        if (start !== null && end === null) end = start + defaultDurationMins;
        if (start === null) return null;
        return { start, end };
    }

    function showValidationPopup(message, copyText, navigatePayload) {
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

        // If navigatePayload includes attemptedTitle, show that above the message
        const msg = document.createElement('div');
        msg.style.margin = '0';
        msg.style.color = 'var(--color-text, #222)';
        msg.style.fontSize = '0.95rem';
        msg.style.lineHeight = '1.3';
        let attempt = null;
        if (navigatePayload && navigatePayload.attemptedTitle) {
            attempt = document.createElement('div');
            attempt.style.fontWeight = '700';
            attempt.style.marginBottom = '6px';
            attempt.textContent = `Attempting to add: ${navigatePayload.attemptedTitle}`;
        }
        msg.textContent = message;

        // inline link to view the conflicting event in itinerary (if payload provided)
        let inlineLink = null;
        if (navigatePayload && navigatePayload.tripId && navigatePayload.eventId) {
            inlineLink = document.createElement('a');
            inlineLink.href = '#';
            inlineLink.textContent = 'View conflicting event';
            inlineLink.style.display = 'inline-block';
            inlineLink.style.marginTop = '6px';
            inlineLink.style.fontSize = '0.95rem';
            inlineLink.addEventListener('click', function (e) {
                e.preventDefault();
                try {
                    if (window.bookingHighlight && typeof window.bookingHighlight.set === 'function') {
                        window.bookingHighlight.set(navigatePayload, { basePath: BASE_PATH });
                        return;
                    }
                } catch (err) { /* swallow */ }
                try { sessionStorage.setItem('bookingHighlight', JSON.stringify(navigatePayload)); } catch(e){}
                window.location.href = `${BASE_PATH}/pages/ItineraryWeek.html?trip=${encodeURIComponent(navigatePayload.tripId)}`;
            });
        }

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '0.5rem';
        actions.style.justifyContent = 'flex-end';

        

        // Build buttons: Cancel (left), Copy (if provided), OK (right)
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.className = 'btn-cancel btn btn-outline';
        cancelBtn.style.minWidth = '84px';
        cancelBtn.addEventListener('click', removeOverlay);
        actions.appendChild(cancelBtn);

        // Optional Copy button
        if (copyText) {
            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy';
            copyBtn.className = 'btn btn-outline';
            copyBtn.style.minWidth = '84px';
            copyBtn.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(copyText);
                    copyBtn.textContent = 'Copied';
                    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
                } catch (e) {
                    const ta = document.createElement('textarea'); ta.value = copyText; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); copyBtn.textContent = 'Copied'; setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500); } catch(_){} ta.remove();
                }
            });
            actions.appendChild(copyBtn);
        }

        // OK button (right)
        const ok = document.createElement('button');
        ok.textContent = 'OK';
        ok.className = 'btn';
        ok.style.minWidth = '84px';
        ok.style.padding = '0.5rem 0.85rem';
        ok.addEventListener('click', removeOverlay);
        actions.appendChild(ok);
        panel.appendChild(heading);
        if (attempt) panel.appendChild(attempt);
        panel.appendChild(msg);
        if (inlineLink) panel.appendChild(inlineLink);
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
        addBtn.addEventListener('click', async function () {
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
                const payload = buildAttemptPayload({ tripId: selectedId });
                showValidationPopup('Please complete required fields: ' + missing.join(', '), null, payload);
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
            const timeVal = document.getElementById('time') ? document.getElementById('time').value : '';

            function buildAttemptPayload(extra) {
                const p = Object.assign({}, extra || {});
                p.attemptedTitle = titleVal || '';
                p.attemptedDate = dateVal || '';
                p.attemptedTime = timeVal || '';
                return p;
            }

            // Validate event date within selected itinerary range (if trip defines start/end)
            const eventDateObj = parseDateSafe(dateVal);
            if ((selected.startDate || selected.start || selected.endDate || selected.end) && !eventDateObj) {
                const payload = buildAttemptPayload({ tripId: selectedId });
                showValidationPopup('Unable to parse the event date for range validation. Use YYYY-MM-DD format.', null, payload);
                return;
            }
            if (eventDateObj) {
                const tripStart = parseDateSafe(selected.startDate || selected.start);
                const tripEnd = parseDateSafe(selected.endDate || selected.end);
                if (tripStart && eventDateObj < tripStart) {
                    const payload = buildAttemptPayload({ tripId: selectedId });
                    showValidationPopup(`Event date is before the itinerary start date (${tripStart.toISOString().slice(0,10)}).`, null, payload);
                    return;
                }
                if (tripEnd && eventDateObj > tripEnd) {
                    const payload = buildAttemptPayload({ tripId: selectedId });
                    showValidationPopup(`Event date is after the itinerary end date (${tripEnd.toISOString().slice(0,10)}).`, null, payload);
                    return;
                }
            }

            // Load existing events for the selected trip (localStorage or per-trip file)
            const existing = await loadEventsForTrip(selectedId);
            let flatEventsFromStore = Array.isArray(existing) ? existing.slice() : [];

            // Normalize structure: some stored formats may wrap events per-day; attempt to flatten
            if (!flatEventsFromStore.length && Array.isArray(selected.days)) {
                selected.days.forEach(d => { if (Array.isArray(d.events)) flatEventsFromStore = flatEventsFromStore.concat(d.events); });
            }

            // Check for exact duplicate (title + date)
            const exactConflict = flatEventsFromStore.find(ev => {
                if (!ev) return false;
                const evTitle = ev.title || ev.name || '';
                const evDate = ev.date || ev.day || '';
                return evTitle === titleVal && evDate === dateVal;
            });
            if (exactConflict) {
                const payload = buildAttemptPayload({ tripId: selectedId });
                const copy = `Duplicate: ${titleVal} on ${dateVal}`;
                showValidationPopup('This event already exists in the selected itinerary.', copy, payload);
                return;
            }
            // Check for time overlap conflicts on the same date
            const timeStr = document.getElementById('time') ? document.getElementById('time').value : '';
            const newRange = parseTimeRange(timeStr, 120);
            if (newRange) {
                const overlap = flatEventsFromStore.find(ev => {
                    const evDate = ev.date || ev.day || '';
                    if (evDate !== dateVal) return false;
                    const evStart = parseTimeToMinutes(ev.time);
                    const evDurMins = (ev.duration && !isNaN(Number(ev.duration))) ? Math.round(Number(ev.duration) * 60) : 60;
                    const evEnd = (evStart !== null) ? (evStart + evDurMins) : null;
                    if (evStart === null || evEnd === null) return false;
                    return (newRange.start < evEnd) && (evStart < newRange.end);
                });
                if (overlap) {
                    const evStart = parseTimeToMinutes(overlap.time);
                    const evDur = (overlap.duration && !isNaN(Number(overlap.duration))) ? Math.round(Number(overlap.duration) * 60) : 60;
                    const evEnd = evStart + evDur;
                    function fmtMin(m) { const hh = Math.floor(m/60)%24; const mm = String(m%60).padStart(2,'0'); const ampm = hh>=12?'PM':'AM'; const ph = hh%12||12; return `${ph}:${mm} ${ampm}`; }
                    const conflictText = `Time conflicts with "${overlap.title}" on ${dateVal} at ${fmtMin(evStart)} - ${fmtMin(evEnd)}.`;
                    const copyText = `Conflict: ${overlap.title} on ${dateVal} ${fmtMin(evStart)}-${fmtMin(evEnd)}`;
                    const payload = buildAttemptPayload({ tripId: selectedId, eventId: (overlap.id || overlap.eventId || overlap._id || overlap.title), msg: conflictText });
                    showValidationPopup(conflictText, copyText, payload);
                    return;
                }
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