// script.js
const editButton = document.getElementById('event-edit-btn');
const editPopupForm = document.getElementById('editPopupForm');
const removeButton = document.getElementById('event-remove-btn');
const removePopupForm = document.getElementById('removePopupForm');
const background = document.getElementById('event-info');
const shareButton = document.getElementById('event-share-btn');

// Stored event info
const currentTitle = document.querySelector('#event-title');
const currentDate = document.querySelector('#current-date');
const currentTime = document.querySelector('#current-time');
const currentLocation = document.querySelector('#current-location');
const currentDescription = document.querySelector('#current-description');

//Input from form
const titleInput = document.getElementById('title');
const dateInput = document.getElementById('date');
const timeInput = document.getElementById('time');
const locationInput = document.getElementById('location');
const descriptionInput = document.getElementById('description');

removeButton.addEventListener('click', function () {
    removePopupForm.style.display = 'block';
    background.style.filter = 'blur(5px)';
    removeButton.style.filter = 'blur(5px)';
    shareButton.style.filter = 'blur(5px)';
    editButton.style.filter = 'blur(5px)';
});
 

editButton.addEventListener('click', function () {

    titleInput.value = currentTitle.textContent;
    dateInput.value = currentDate.textContent;
    //timeInput.value = currentTime.textContent;
    //locationInput.value = currentLocation.textContent;
    //descriptionInput.value = currentDescription.textContent;

    editPopupForm.style.display = 'block';
    background.style.filter = 'blur(5px)';
    removeButton.style.filter = 'blur(5px)';
    shareButton.style.filter = 'blur(5px)';
    editButton.style.filter = 'blur(5px)';
});