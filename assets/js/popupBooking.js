// script.js
const bookingRequestButton = document.getElementById('booking-request-btn');
const saveButton = document.getElementById('save-btn');
let exploreInfo = [];
let currentEvent;

// Get input fields from doc
const pageTitle = document.getElementById("page-title");
const pageDescription = document.getElementById("page-description")
const pageImage = document.getElementById("page-image");

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
            console.log(exploreInfo);
            console.log(exploreInfo[0])

            for (let i = 0; i < 20; i ++)
            {
                let tmp = exploreInfo[i];

                if (tmp == null) {
                    break;
                }

                console.log(tmp.id);

                if (tmp.id == eventId){
                    currentEvent = tmp;
                }
            }
            console.log(currentEvent);
            pageTitle.innerText = currentEvent.title;
            pageDescription.innerText = currentEvent.description;
            pageImage.src = currentEvent.img;
        })
};



bookingRequestButton.addEventListener('click', function () {
    console.log("Send data");
    bookingRequestButton.href = `BookingRequest.html?date=${currentEvent.date}&time=${currentEvent.time}&title=${currentEvent.title}&source=booking`;

});

saveButton.addEventListener('click', function () {
   
})