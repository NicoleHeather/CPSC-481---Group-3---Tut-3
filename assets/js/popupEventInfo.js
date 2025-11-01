// script.js
const editButton = document.getElementById('event-edit-btn');
const editPopupForm = document.getElementById('editPopupForm');
const removeButton = document.getElementById('event-remove-btn');
const removePopupForm = document.getElementById('removePopupForm');
const background = document.getElementById('whole-page');
const shareButton = document.getElementById('event-share-btn');
const modal = document.querySelector('.modal');
const modal2 = document.querySelector('.modal-2');

// Stored event info
const currentTitle = document.querySelector('#event-title');
const currentDate = document.querySelector('#current-date');
const currentTime = document.querySelector('#current-time');
const currentLocation = document.querySelector('#current-location');
const currentCost = document.querySelector('#current-cost')
const currentDescription = document.querySelector('#current-description');

//Input from form
const titleInput = document.getElementById('title');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const locationInput = document.getElementById('location');
const costInput = document.getElementById('cost');
const descriptionInput = document.getElementById('description');

removeButton.addEventListener('click', function () {
    removePopupForm.style.display = 'block';
    modal2.style.display = 'block';
});
 

editButton.addEventListener('click', function () {

    titleInput.value = currentTitle.textContent;
    dateInput.value = currentDate.textContent;

    dateInput.style.color = 'grey';

    timeInput.value = currentTime.textContent;

    timeInput.style.color = 'grey';

    locationInput.value = currentLocation.textContent;

    locationInput.style.color = 'grey';

    costInput.value = currentCost.textContent;
    descriptionInput.value = currentDescription.textContent;

    editPopupForm.style.display = 'block';
    modal.style.display = 'block';
    
});