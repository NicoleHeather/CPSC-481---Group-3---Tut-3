// script.js
const editButton = document.getElementById('event-edit-btn');
const editPopupForm = document.getElementById('editPopupForm');
const removeButton = document.getElementById('event-remove-btn');
const cancelEditButton = document.getElementById('ev-cancel');
const removePopupForm = document.getElementById('removePopupForm');
const background = document.getElementById('whole-page');
const shareButton = document.getElementById('event-share-btn');
const modal = document.querySelector('.modal');
const modal2 = document.querySelector('.modal-2');

const startTimeOptions = document.getElementById('start-time-options');
const editForm = document.getElementById('event-form');
const saveButton = document.getElementById('save-btn')

const cancelRemove = document.getElementById('cancel-remove');
const confirmRemove = document.getElementById('yes-remove');

//Stored event info
const currentTitle = document.querySelector('#event-title-stored');
const currentDate = document.querySelector('#current-date');
const currentStart = document.querySelector('#current-start');
const currentEnd = document.querySelector('#current-end');
const currentLocation = document.querySelector('#current-location');
const currentCost = document.querySelector('#current-cost')
const currentDescription = document.querySelector('#current-description');
const currentImage = document.querySelector('#current-img');

//Input from form
const titleInput = document.getElementById('ev-title');
const dateInput = document.getElementById('ev-date');
const startInput = document.getElementById('ev-start');
const durationInput = document.getElementById('ev-dur');
const endInput = document.getElementById('ev-end');
const locationInput = document.getElementById('ev-location');
const costInput = document.getElementById('ev-cost');
const descriptionInput = document.getElementById('ev-notes');

let currentDuration;
let customEvent = true;
let tripId;
let dateISO;
//let tmpEventId = 1;
let currentEvent;
let intineraryInfo = [];
let arrTimeOptions = ["0:00", "1:00", "2:00", "3:00", "4:00", "5:00", "6:00", 
                      "7:00", "8:00", "9:00", "10:00", "11:00", "12:00", "13:00",
                      "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", 
                      "21:00", "22:00", "23:00"]

let arrDurationOptions = ["30", "1", "1.5", "2", "2.5", "3",
                            "3.5", "4", "4.5", ];

window.onload = function () {

    console.log(cancelRemove);

    //Uncomment on itinerary-day changes.
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    const eventId = urlParams.get('id');
    tripId = urlParams.get('trip');
    dateISO = urlParams.get('date');

    console.log('Event ID:', eventId);

    //Replace with whatever json data from the itinerary screen.
    fetch('../assets/data/events.json')
        .then(response => response.json())
        .then(response => {
            intineraryInfo = response.explore;

            //Replace later
            console.log(intineraryInfo);
            console.log(intineraryInfo[0])

            for (let i = 0; i < intineraryInfo.length; i ++)
            {
                let tmp = intineraryInfo[i];

                if (tmp.id == eventId){
                    currentEvent = tmp;
                    break;
                }
            }

            customEvent = currentEvent.custom;
            console.log(customEvent);

            currentTitle.innerHTML = currentEvent.title;
            currentDate.innerHTML = currentEvent.date;
            currentStart.innerHTML = currentEvent.time;

            currentDuration = currentEvent.duration;

            currentLocation.innerHTML = currentEvent.location;
            currentCost.innerHTML = currentEvent.price;
            currentDescription.innerHTML = currentEvent.description;
            currentImage.src = currentEvent.img;

            console.log(currentStart.innerHTML)

            let tmpStart;

            for (let i = 0; i < arrTimeOptions.length; i ++) {

                if (arrTimeOptions[i] == currentStart.textContent){
                    startInput.selectedIndex = i;
                    let tmp = arrTimeOptions[i].split(":");
                    console.log(tmp[1]);
                    tmpStart = tmp[0];
                    console.log(tmpStart);
                    console.log(tmp);
                }
            }

            for (let j = 0; j < arrDurationOptions.length; j++){

                if (arrDurationOptions[j] == currentEvent.duration){
                    durationInput.selectedIndex = j;
                    let tmpEnd = Number(tmpStart) + Number(arrDurationOptions[j]);
                    tmpEnd = String(tmpEnd) + ":00";
                    endInput.value = tmpEnd;
                    currentEnd.innerHTML = tmpEnd;
                    //console.log(tmpEnd);
                }
            }

            if (currentEnd.textContent.length > 5) {
                let tmp3 = currentEnd.textContent.split(".");
                let tmp4 = tmp3[0];
                console.log(tmp4);
                currentEnd.textContent = tmp4 + ":30";
            }
        })
};

//Remove event not working.
removeButton.addEventListener('click', function () {
    removePopupForm.style.display = 'block';
    modal2.style.display = 'block';
});
 

editButton.addEventListener('click', function () {

    titleInput.value = currentTitle.textContent;
    dateInput.value = currentDate.textContent;
    locationInput.value = currentLocation.textContent;
    costInput.value = currentCost.textContent;
    descriptionInput.value = currentDescription.textContent;
    endInput.value = currentEnd.textContent;

    editPopupForm.style.display = 'block';
    modal.style.display = 'block';

    if (!customEvent){

        dateInput.readOnly = true;
        dateInput.style.color = 'grey';

        startInput.readOnly = true;
        startInput.style.color = 'grey';

        //durationInput.readOnly = true;
        durationInput.style.color = 'grey';
        //disable not supported for select input types.

        endInput.readOnly = true;
        endInput.style.color = 'grey';

        locationInput.readOnly = true;
        locationInput.style.color = 'grey';
    }
});

//Save button
saveButton.addEventListener("click", function () {

    console.log("Here");
    currentTitle.textContent = titleInput.value;
    currentStart.textContent = arrTimeOptions[startInput.selectedIndex];

    let tmp = arrTimeOptions[startInput.selectedIndex].split(":");
    let tmp2 = arrDurationOptions[durationInput.selectedIndex];
    tmp = tmp[0];

    currentEnd.textContent = String(Number(tmp) + Number(tmp2)) + ":00"

    //Changing the end time directly does not work at the moment.
    if(currentEnd.textContent.length > 5) {
        let tmp3 = currentEnd.textContent.split(".");
        let tmp4 = tmp3[0];
        console.log(tmp4);
        currentEnd.textContent = tmp4 + ":30";
    }

    currentLocation.textContent = locationInput.value;
    currentCost.textContent = costInput.value;
    currentDescription.textContent = descriptionInput.value;

    editPopupForm.style.display = 'none';
    modal.style.display = 'none';   
})

cancelEditButton.addEventListener("click", function () {
    editPopupForm.style.display = 'none';
    modal.style.display = 'none';  
});

cancelRemove.addEventListener('click', function () {
    console.log("IN HERE");
    removePopupForm.style.display = 'none';
    modal2.style.display = 'none';
});

confirmRemove.addEventListener('click', function () {
    console.log(window.history);

    //Removed events still appear on the itinerary-week view
    confirmRemove.href = `ItineraryDay.html?id=${currentEvent.id}&remove=${1}&trip=${tripId}&date=${dateISO}`;    
});

