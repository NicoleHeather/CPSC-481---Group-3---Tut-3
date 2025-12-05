// script.js
const saveButton = document.getElementById('save-info-btn');
const callButton = document.getElementById('call-contact-btn');
const editContactButton = document.getElementById('edit-contact');

//Input info
const inputName = document.getElementById('name-input');
const inputPhone = document.getElementById('phone-input');

//Stored Info
const storedName = document.getElementById('name');
const storedPhone = document.getElementById('phone');

const labelName = document.getElementById('label-name');
const labelPhone = document.getElementById('label-phone');

saveButton.addEventListener('click', function () {
    saveButton.style.display = "none";
    editContactButton.style.display = "block";
    callButton.style.display = "block";

    //Display Info
    inputName.style.display = "none";
    inputPhone.style.display = "none";

    labelName.style.display = "none";
    labelPhone.style.display = "none";

    storedName.style.display = "block";
    storedPhone.style.display = "block";

    storedName.innerText = "Name: " + inputName.value;
    storedPhone.innerText = "Phone: " + inputPhone.value;

    storedName.style.fontWeight = "bold";
    storedPhone.style.fontWeight = "bold";
});

callButton.addEventListener('click', function () {
    alert("Under Development!");
});

editContactButton.addEventListener('click', function () {
    callButton.style.display = "none";
    editContactButton.style.display = "none";
    saveButton.style.display = "block";
    
    inputName.style.display = "block";
    inputPhone.style.display = "block";

    storedName.style.display = "none";
    storedPhone.style.display = "none";

    labelName.style.display = "block";
    labelPhone.style.display = "block";
});