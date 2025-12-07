// script.js
const saveButton = document.getElementById('save-info-btn');
const callButton = document.getElementById('call-contact-btn');
const editContactButton = document.getElementById('edit-contact');
const searchButton = document.getElementById('button-search');
const closeContactModal = document.getElementById('close-contact-modal');
const closeSearchModal = document.getElementById('close-search-modal');

//Input info
const inputName = document.getElementById('name-input');
const inputPhone = document.getElementById('phone-input');

//Stored Info
const storedName = document.getElementById('name');
const storedPhone = document.getElementById('phone');

const labelName = document.getElementById('label-name');
const labelPhone = document.getElementById('label-phone');

//Search input
const cityInput = document.getElementById('city-input');
const provinceInput = document.getElementById('province-input')

//Modals
const missingContactModal = document.getElementById('missing-contact-modal');
const noSearchResultModal = document.getElementById('no-search-modal');


closeSearchModal.addEventListener('click', function () {
    noSearchResultModal.style.display = "none";    
})

closeContactModal.addEventListener('click', function () {
    missingContactModal.style.display = "none";
});

saveButton.addEventListener('click', function () {

    console.log(typeof(inputName.value));

    if (inputName.value == "" || inputPhone.value == ""){
        //alert("Cannot save a non-existent contact!");
        missingContactModal.style.display = "flex";
        missingContactModal.style.flexDirection = "column";
        return;
    }

    saveButton.style.display = "none";
    editContactButton.style.display = "block";
    callButton.style.display = "block";

    //Display Info
    inputName.style.display = "none";
    inputPhone.style.display = "none";

    storedName.style.display = "block";
    storedPhone.style.display = "block";

    storedName.innerText = inputName.value;
    storedPhone.innerText = inputPhone.value;
});

callButton.addEventListener('click', function () {
    alert("Calling functionality under development!");
});

editContactButton.addEventListener('click', function () {
    callButton.style.display = "none";
    editContactButton.style.display = "none";
    saveButton.style.display = "block";
    
    inputName.style.display = "block";
    inputPhone.style.display = "block";

    storedName.style.display = "none";
    storedPhone.style.display = "none";
});

searchButton.addEventListener('click', function () {

    let searchResults = document.querySelectorAll('.search-result');
    console.log(searchResults);

    if (cityInput.value == "Calgary" && provinceInput.value == "Alberta")
    {
        for (let i = 0; i < searchResults.length; i++) {
            console.log(searchResults[i]);
            searchResults[i].style.display = "block";
        }   
    }
    else {
        for (let i = 0; i < searchResults.length; i++) {
            console.log(searchResults[i]);
            searchResults[i].style.display = "none";
        } 
        noSearchResultModal.style.display = "flex";
    }
});