// script.js
const bookingConfirmtButton = document.getElementById('submit-info-btn');
const bookingConfirmForm = document.getElementById('booking-request-popup');
const bookingConflictForm = document.getElementById('booking-request-conflict');
const background = document.getElementById('whole-screen');
const cardBackground = document.getElementById('booking-event')
const modal = document.querySelector('.modal');
const missingInfoForm = document.getElementById('missing-required-info');
const processingDisplay = document.getElementById('booking-request-processing');

//pop-up buttons
const addEventButton = document.getElementById('booking-request-confirm');
const missingInfoOkayButton = document.getElementById("missing-required-info-ok");
const bookingConflictOkay = document.getElementById("booking-request-conflict-ok");
const bookingRequestOverride = document.getElementById("booking-request-conflict-override");
const bookingRequestView = document.getElementById("booking-request-conflict-view-event");

//Track Input
const time = document.querySelector('#time');
const date = document.querySelector('#date');
const guestNumber = document.querySelector('#guest-number');
const email = document.querySelector('#email');
const nameInput = document.querySelector('#name');

const evTitle = document.getElementById('event-name-booking')
let eventId;

//Timeout
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));


window.onload = function () {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    //console.log(urlParams);
    const paramTime = urlParams.get('time');
    const paramDate = urlParams.get('date');
    const paramTitle = urlParams.get('title');
    eventId = urlParams.get('id');
    console.log(eventId);

    
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
    if (submittedTime == "6:00") {
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

    const itinerary = document.getElementById('choose-itinerary');
    console.log(itinerary.value);

    bookingConfirmForm.style.display = 'none';
    modal.style.display = "none";

    addEventButton.href = `ItineraryDay.html?date=${date.value}&trip=${itinerary}&id=${eventId}&add=${1}&`

    /*fetch('../assets/data/events.json')
        .then(response => response.json())
        .then(data => {
            console.log('JSON data loaded');
            currentEvent = data.explore.find(e => e.id === eventId);
            console.log(currentEvent);
        })
    */

});

missingInfoOkayButton.addEventListener ('click', function () {
    missingInfoForm.style.display = 'none';
    modal.style.display = "none";    
});

bookingConflictOkay.addEventListener ('click', function () {
    missingInfoForm.style.display = 'none';
    modal.style.display = "none";
});

bookingRequestOverride.addEventListener ('click', function () {
    missingInfoForm.style.display = 'none';
    modal.style.display = "none";
});

bookingRequestView.addEventListener ('click', function () {
    bookingRequestView.href = `EventInfo.html?id=${eventId}&source=booking`;
});