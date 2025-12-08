// script.js
const bookingRequestButton = document.getElementById('booking-request-btn');
const saveButton = document.getElementById('save-btn');
let exploreInfo = [];
let currentEvent;

// Get input fields from doc
const pageTitle = document.getElementById("page-title");
const pageDescription = document.getElementById("page-description")
const pageImage = document.getElementById("page-image");
const pageDate = document.getElementById("page-date");
const pageTime = document.getElementById("page-time");
const pageLocation = document.getElementById("page-location");
const pageCost = document.getElementById("page-cost")
const pageDuration = document.getElementById("page-duration");

window.onload = function () {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    console.log(urlParams);

    const eventId = urlParams.get('id');
    console.log('Event ID:', eventId);

    fetch('../assets/data/events.json')
        .then(response => response.json())
        .then(response => {
            exploreInfo = response.explore;
            savedInfo = response.saved;

            console.log(exploreInfo);
            console.log(exploreInfo[0])

            console.log(savedInfo);
            console.log(savedInfo[0])

            for (let i = 0; i < exploreInfo.length; i++) {
                let tmp = exploreInfo[i];
                if (!tmp) continue;
                console.log(tmp.id);
                if (tmp.id == eventId){
                    currentEvent = tmp;
                    break;
                }
            }

            for (let j = 0; j < savedInfo.length; j ++){
                if (currentEvent != undefined && currentEvent != null){
                    break;
                }
                let tmp2 = savedInfo[j];
                if (!tmp2) continue;
                if (tmp2.id == eventId){
                    currentEvent = tmp2;
                    break;
                }
            }

            console.log(currentEvent);

            if (pageTitle && currentEvent && currentEvent.title) pageTitle.innerText = currentEvent.title;
            if (pageDescription && currentEvent && currentEvent.description) pageDescription.innerText = currentEvent.description;
            if (pageImage && currentEvent && currentEvent.img) pageImage.src = currentEvent.img;
            if (pageDate && currentEvent && currentEvent.date) pageDate.innerText = currentEvent.date;
            if (pageTime && currentEvent && currentEvent.time) pageTime.innerText = currentEvent.time;
            if (pageLocation && currentEvent && currentEvent.location) pageLocation.innerText = currentEvent.location;

            if (pageCost) {
                if (currentEvent && currentEvent.price == undefined){
                    pageCost.innerText = "Free";
                }
                else if (currentEvent && currentEvent.price !== undefined) {
                    pageCost.innerText = currentEvent.price;
                }
            }

            if (pageDuration && currentEvent && currentEvent.duration !== undefined) {
                pageDuration.innerText = currentEvent.duration + " HR";
            }
        })
};


if (bookingRequestButton) {
    bookingRequestButton.addEventListener('click', function () {
        if (!currentEvent) return;
        console.log("Send data");
        console.log(currentEvent.id);
        bookingRequestButton.href = `BookingRequest.html?date=${currentEvent.date}&time=${currentEvent.time}&title=${currentEvent.title}&id=${currentEvent.id}`;
    });
}
