// script.js
const editButton = document.getElementById('event-edit-btn');
const editPopupForm = document.getElementById('editPopupForm');
const removeButton = document.getElementById('event-remove-btn');
const removePopupForm = document.getElementById('removePopupForm');
const background = document.getElementById('whole-page');
const shareButton = document.getElementById('event-share-btn');

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
const header = document.querySelector('#whole-page');
const footer = document.getElementsByClassName('.site-footer');

removeButton.addEventListener('click', function () {
    removePopupForm.style.display = 'block';
    background.style.background = 'grey';
    //header.style.background = 'lightgrey';
    //footer.style.background = 'lightgrey';
});
 

editButton.addEventListener('click', function () {

    console.log(header);
    console.log(footer);

    titleInput.value = currentTitle.textContent;
    dateInput.value = currentDate.textContent;
    timeInput.value = currentTime.textContent;
    locationInput.value = currentLocation.textContent;
    costInput.value = currentCost.textContent;
    descriptionInput.value = currentDescription.textContent;

    editPopupForm.style.display = 'block';
    background.style.background = 'grey';
    header.style.background.color = 'grey';

    //footer.style.background = 'lightgrey';
    
});