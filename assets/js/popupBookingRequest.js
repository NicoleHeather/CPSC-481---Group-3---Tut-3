// script.js
const bookingConfirmtButton = document.getElementById('submit-info-btn');
const bookingConfrimForm = document.getElementById('booking-request-popup');

bookingConfirmtButton.addEventListener('click', function () {
    bookingConfrimForm.style.display = 'block';
});