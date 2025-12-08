// popupBookingRequest.js - Minimal Fresh Version
window.onload = function () {
    console.log('[popupBookingRequest] loaded');
    const sendRequestBtn = document.getElementById('submit-info-btn');
    const modal = document.getElementById('booking-request-modal');
    const backBtn = document.getElementById('modal-booking-back');
    const addBtn = document.getElementById('modal-booking-add');
    const itinerarySelect = document.getElementById('modal-itinerary-select');

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
                    merged = trips.concat(extras.map(t => Object.assign({isExtra: true}, t)));
                    merged = merged.filter(t => t.id && !deleted.has(t.id));
                    console.log('[popupBookingRequest] merged itineraries:', merged);
                    // Clear existing options except the first one
                    while (itinerarySelect.options.length > 1) {
                        itinerarySelect.remove(1);
                    }
                    // Add trip options
                    merged.forEach(trip => {
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
            if (!itinerarySelect.value) {
                alert('Please select a valid itinerary.');
                return;
            }
            // Add your logic here for adding to itinerary
            modal.style.display = 'none';
        });
    }
}