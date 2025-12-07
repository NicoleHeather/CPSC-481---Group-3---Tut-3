(function() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const eventId = urlParams.get('id');
  const tripId = urlParams.get('trip');

  let currentEvent = null;
  let allEvents = [];

  // Helper function
  function to12Hour(time24) {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2,'0')} ${period}`;
  }

  // Load event data
  async function loadEventData() {
    const base = window.location.pathname.includes("/pages/") ? ".." : ".";
    
    // Try to load from localStorage first (saved events)
    const storageKey = `events-${tripId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        allEvents = JSON.parse(saved);
        currentEvent = allEvents.find(e => e.id === eventId);
        if (currentEvent) {
          renderEventInfo();
          return;
        }
      }
    } catch (e) { /* ignore */ }

    // Fall back to per-trip JSON file
    let file;
    if (tripId === "trip-calgary-2026") {
      file = `${base}/assets/data/events-trip-calgary-2026.json`;
    } else {
      file = `${base}/assets/data/events-trip-banff-2026.json`;
    }

    try {
      const response = await fetch(file);
      const data = await response.json();
      allEvents = data.explore || [];
      currentEvent = allEvents.find(e => e.id === eventId);
      renderEventInfo();
    } catch (e) {
      console.error('Failed to load event:', e);
    }
  }

  function renderEventInfo() {
    if (!currentEvent) return;

    document.getElementById('event-title-stored').textContent = currentEvent.title || 'Untitled Event';
    document.getElementById('current-date').textContent = currentEvent.date || '';
    
    const startTime = currentEvent.time || '';
    const duration = currentEvent.duration ? parseFloat(currentEvent.duration) : 0;
    
    document.getElementById('current-start').textContent = to12Hour(startTime);
    
    if (startTime && duration) {
      const [h, m] = startTime.split(':').map(Number);
      const totalMins = h * 60 + m + (duration * 60);
      const endH = Math.floor(totalMins / 60) % 24;
      const endM = totalMins % 60;
      const endTime24 = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
      document.getElementById('current-end').textContent = to12Hour(endTime24);
    } else {
      document.getElementById('current-end').textContent = '';
    }

    document.getElementById('current-location').textContent = currentEvent.location || '';
    document.getElementById('current-cost').textContent = currentEvent.price ? `$${parseFloat(currentEvent.price).toFixed(2)}` : '$0.00';
    document.getElementById('current-description').textContent = currentEvent.description || currentEvent.notes || '';
  }

  // Setup edit button
  document.getElementById('event-edit-btn').addEventListener('click', () => {
    if (!currentEvent) return;

    const editModal = window.createAddEventModal({
      prefilledDate: currentEvent.date,
      onSubmit: (formData) => {
        // Update event object
        currentEvent.title = formData.title;
        currentEvent.date = formData.date;
        currentEvent.time = formData.time;
        currentEvent.duration = ((new Date(`2000-01-01T${formData.endTime}`) - new Date(`2000-01-01T${formData.time}`)) / (1000 * 60 * 60)).toFixed(1);
        currentEvent.location = formData.location;
        currentEvent.price = parseFloat(formData.price) || 0;
        currentEvent.description = formData.description;

        // Save to localStorage
        const storageKey = `events-${tripId}`;
        try {
          const saved = localStorage.getItem(storageKey);
          if (saved) {
            const events = JSON.parse(saved);
            const idx = events.findIndex(e => e.id === currentEvent.id);
            if (idx >= 0) {
              events[idx] = currentEvent;
              localStorage.setItem(storageKey, JSON.stringify(events));
            }
          }
        } catch (e) { /* ignore */ }

        renderEventInfo();
      },
      onCancel: () => {
        // modal hides automatically
      }
    });

    // Populate modal with current event data
    editModal.modal.querySelector('input[name="title"]').value = currentEvent.title || '';
    editModal.modal.querySelector('input[name="date"]').value = currentEvent.date || '';
    editModal.modal.querySelector('input[name="time"]').value = currentEvent.time || '';
    editModal.modal.querySelector('input[name="location"]').value = currentEvent.location || '';
    editModal.modal.querySelector('input[name="price"]').value = currentEvent.price || '0';
    editModal.modal.querySelector('textarea[name="description"]').value = currentEvent.description || currentEvent.notes || '';

    // Calculate and set end time
    if (currentEvent.time && currentEvent.duration) {
      const [h, m] = currentEvent.time.split(':').map(Number);
      const totalMins = h * 60 + m + (parseFloat(currentEvent.duration) * 60);
      const endH = Math.floor(totalMins / 60) % 24;
      const endM = totalMins % 60;
      const endTime = `${String(endH).padStart(2,'0')}:${String(endM).padStart(2,'0')}`;
      editModal.modal.querySelector('input[name="endTime"]').value = endTime;
    }

    editModal.show();
    editModal.modal.querySelector('input[name="title"]').focus();
  });

  // Setup remove button
  document.getElementById('event-remove-btn').addEventListener('click', () => {
    if (!confirm(`Are you sure you want to remove "${currentEvent.title}"?`)) return;

    // Remove from localStorage
    const storageKey = `events-${tripId}`;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const events = JSON.parse(saved);
        const filtered = events.filter(e => e.id !== currentEvent.id);
        localStorage.setItem(storageKey, JSON.stringify(filtered));
      }
    } catch (e) { /* ignore */ }

    // Redirect back to itinerary
    if (currentEvent.date) {
      window.location.href = `./ItineraryDay.html?trip=${encodeURIComponent(tripId)}&date=${encodeURIComponent(currentEvent.date)}`;
    } else {
      window.location.href = './Itineraries.html';
    }
  });

  // Setup share button
  document.getElementById('event-share-btn').addEventListener('click', () => {
    window.location.href = './Share.html';
  });

  // Load and render on page load
  loadEventData();
})();

confirmRemoveButton.addEventListener('click', function () {
    removePopupForm.style.display = "none";
    modal2.style.display = "none";
});
 
editButton.addEventListener('click', function () {

    titleInput.value = currentTitle.textContent;
    dateInput.value = currentDate.textContent;
    locationInput.value = currentLocation.textContent;
    costInput.value = currentCost.textContent;
    descriptionInput.value = currentDescription.textContent;
    endInput.value = currentEnd.textContent;

    editPopupForm.style.display = 'block';
    modal.style.display = 'block';

    if (!customEvent){

        dateInput.readOnly = true;
        dateInput.style.color = 'grey';

        startInput.readOnly = true;
        startInput.style.color = 'grey';

        //durationInput.readOnly = true;
        durationInput.style.color = 'grey';
        //disable not supported for select input types.

        endInput.readOnly = true;
        endInput.style.color = 'grey';

        locationInput.readOnly = true;
        locationInput.style.color = 'grey';
    }
});

//Save button
saveButton.addEventListener("click", function () {

    console.log("Here");
    currentTitle.textContent = titleInput.value;
    currentStart.textContent = arrTimeOptions[startInput.selectedIndex];

    let tmp = arrTimeOptions[startInput.selectedIndex].split(":");
    let tmp2 = arrDurationOptions[durationInput.selectedIndex];
    tmp = tmp[0];

    currentEnd.textContent = String(Number(tmp) + Number(tmp2)) + ":00"

    //Changing the end time directly does not work at the moment.
    if(currentEnd.textContent.length > 5) {
        let tmp3 = currentEnd.textContent.split(".");
        let tmp4 = tmp3[0];
        console.log(tmp4);
        currentEnd.textContent = tmp4 + ":30";
    }

    currentLocation.textContent = locationInput.value;
    currentCost.textContent = costInput.value;
    currentDescription.textContent = descriptionInput.value;

    editPopupForm.style.display = 'none';
    modal.style.display = 'none';   
})

cancelEditButton.addEventListener("click", function () {
    editPopupForm.style.display = 'none';
    modal.style.display = 'none';  
})
