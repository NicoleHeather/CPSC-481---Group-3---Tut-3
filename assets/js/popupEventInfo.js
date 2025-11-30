// script.js
const editButton = document.getElementById('event-edit-btn');
const editPopupForm = document.getElementById('editPopupForm');
const removeButton = document.getElementById('event-remove-btn');
const removePopupForm = document.getElementById('removePopupForm');
const background = document.getElementById('whole-page');
const shareButton = document.getElementById('event-share-btn');
const modal = document.querySelector('.modal');
const modal2 = document.querySelector('.modal-2');

const editForm = document.getElementById('event-form');
const saveButton = document.getElementById('save-btn')
console.log(editForm);

//Stored event info
const currentTitle = document.querySelector('#event-title-stored');
const currentDate = document.querySelector('#current-date');
const currentStart = document.querySelector('#current-start');
const currentEnd = document.querySelector('#current-end');
const currentLocation = document.querySelector('#current-location');
const currentCost = document.querySelector('#current-cost')
const currentDescription = document.querySelector('#current-description');

//Input from form
const titleInput = document.getElementById('ev-title');
const dateInput = document.getElementById('ev-date');
const startInput = document.getElementById('ev-start');
const durationInput = document.getElementById('ev-dur');
const endInput = document.getElementById('ev-end');
const locationInput = document.getElementById('ev-location');
const costInput = document.getElementById('ev-cost');
const descriptionInput = document.getElementById('ev-notes');

let customEvent = true;

//Cancel button on edit input does not work, as well as remove event not working.

removeButton.addEventListener('click', function () {
    removePopupForm.style.display = 'block';
    modal2.style.display = 'block';
});
 

editButton.addEventListener('click', function () {

    titleInput.value = currentTitle.textContent;
    dateInput.value = currentDate.textContent;
    startInput.value = String(currentStart.textContent);
    endInput.value = currentEnd.textContent;

   // let help = document.createTextNode(currentStart.textContent)
    //startInput.innerHTML = '';
    //startInput.appendChild(help);
    //console.log(startInput.selectedIndex);
    durationInput.selectedIndex = "3";

    //Something is wrong with <select> where we are unable to select a start and duration
    //As well as being unable to set span values on edit pop-up
    
   // let tmp1 = Number(startInput.textContent[0] + startInput.textContent[1]);
    //let tmp2 = Number(endInput.value[0] + endInput.value[1]);

    //console.log(String(tmp2 - tmp1));
    //durationInput.value = String(tmp2 - tmp1);

    locationInput.value = currentLocation.textContent;
    costInput.value = currentCost.textContent;
    descriptionInput.value = currentDescription.textContent;

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

editForm.addEventListener("submit", (e) => {

    e.preventDefault();
    console.log("Here");
    
    currentTitle.textContent = titleInput.value;
    //currentStart.textContent = currentStart.value;
    currentEnd.textContent = endInput.value;
    currentLocation.textContent = locationInput.value;
    currentCost.textContent = costInput.value;
    currentDescription.textContent = descriptionInput.value;

    console.log(titleInput.value)
    console.log(currentTitle.textContent)

    //editForm.submit();
})