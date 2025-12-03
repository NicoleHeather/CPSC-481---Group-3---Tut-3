// script.js
const bookingConfirmtButton = document.getElementById('submit-info-btn');
const bookingConfirmForm = document.getElementById('booking-request-popup');
const bookingConflictForm = document.getElementById('booking-request-conflict');
const background = document.getElementById('whole-screen');
const cardBackground = document.getElementById('booking-event')
const modal = document.querySelector('.modal');
const missingInfoForm = document.getElementById('missing-required-info');
const processingDisplay = document.getElementById('booking-request-processing');
const addEventButton = document.getElementById('booking-request-confirm');

//Track Input
const time = document.querySelector('#time');
const date = document.querySelector('#date');
const guestNumber = document.querySelector('#guest-number');
const email = document.querySelector('#email');
const nameInput = document.querySelector('#name');

const evTitle = document.getElementById('event-name-booking')

//Timeout
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));


window.onload = function () {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    //console.log(urlParams);
    const paramTime = urlParams.get('time');
    const paramDate = urlParams.get('date')
    const paramTitle = urlParams.get('title')
    console.log('D:', paramDate);
    console.log('T:', paramTime);

    time.value = paramTime;
    date.value = paramDate;
    evTitle.innerText = paramTitle;
}

bookingConfirmtButton.addEventListener('click', async function () {
    
    submittedTime = time.value;
    submittedDate = date.value;

    //Users have to refill input on refresh - fix this
    if (time.value == "" || date.value == "" || 
        guestNumber.value == "" || email.value == "" || nameInput.value == "") 
    {
        missingInfoForm.style.display = 'flex';
        modal.style.display = "block";

        return;
    }

    //If the time input is the same as the conflicting event time, show conflict popup.
    if (submittedTime == "6:00 PM" || submittedTime == "6 PM") {
        bookingConflictForm.style.display = 'flex';
        modal.style.display = "block";
        return;
    }
    else {
        modal.style.display = "block";
        processingDisplay.style.display = "flex";
        await sleep(5000); //Delay to simulate "processing of booking"
        processingDisplay.style.display = "none";
        bookingConfirmForm.style.display = 'flex';
        return;
    }
});

addEventButton.addEventListener ('click', function () {
    
});
