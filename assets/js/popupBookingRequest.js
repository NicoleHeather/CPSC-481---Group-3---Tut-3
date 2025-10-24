// script.js
const bookingConfirmtButton = document.getElementById('submit-info-btn');
const bookingConfrimForm = document.getElementById('booking-request-popup');
const time = document.querySelector('#time');
const bookingConflictForm = document.getElementById('booking-request-conflict');

bookingConfirmtButton.addEventListener('click', function () {
    value = time.value
    console.log(value)

    //If the time input is the same as the conflicting event time, show conflict popup.
    if (value == "6PM") {
        bookingConflictForm.style.display = 'flex';
    }
    else {
        bookingConfrimForm.style.display = 'flex';
    }
});