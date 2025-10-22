// script.js
const editButton = document.getElementById('event-edit-btn');
const editPopupForm = document.getElementById('editPopupForm');
const removeButton = document.getElementById('event-remove-btn');
const removePopupForm = document.getElementById('removePopupForm');
const bookingRequestButton = document.getElementById('booking-request-btn');
const bookingPopupForm = document.getElementById('booking-request-form');

removeButton.addEventListener('click', function () {
    removePopupForm.style.display = 'block';
});
 

editButton.addEventListener('click', function () {
    editPopupForm.style.display = 'block';
});

bookingRequestButton.addEventListener('click', function () {
    bookingPopupForm.style.display = 'block';
});