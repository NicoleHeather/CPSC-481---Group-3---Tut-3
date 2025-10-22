// script.js
const bookingRequestButton = document.getElementById('booking-request-btn');
const bookingPopupForm = document.getElementById('booking-request-form');

bookingRequestButton.addEventListener('click', function () {
    bookingPopupForm.style.display = 'block';
});