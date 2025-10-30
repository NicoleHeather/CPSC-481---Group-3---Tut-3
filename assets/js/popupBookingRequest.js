// script.js
const bookingConfirmtButton = document.getElementById('submit-info-btn');
const bookingConfrimForm = document.getElementById('booking-request-popup');
const time = document.querySelector('#time');
const bookingConflictForm = document.getElementById('booking-request-conflict');
const background = document.getElementById('whole-screen');
const cardBackground = document.getElementById('booking-event')
const modal = document.querySelector('.modal');

bookingConfirmtButton.addEventListener('click', function () {
    
    value = time.value;

    //If the time input is the same as the conflicting event time, show conflict popup.
    if (value == "6:00 PM" || value == "6 PM") {
        bookingConflictForm.style.display = 'flex';
        modal.style.display = "block";
    }
    else {
        bookingConfrimForm.style.display = 'flex';
        modal.style.display = "block";
    }
});