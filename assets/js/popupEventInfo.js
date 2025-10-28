// script.js
const editButton = document.getElementById('event-edit-btn');
const editPopupForm = document.getElementById('editPopupForm');
const removeButton = document.getElementById('event-remove-btn');
const removePopupForm = document.getElementById('removePopupForm');

removeButton.addEventListener('click', function () {
    removePopupForm.style.display = 'block';
});
 

editButton.addEventListener('click', function () {
    editPopupForm.style.display = 'block';
});


/*document.addEventListener('DOMContentLoaded', () => {
const savedText = localStorage.getItem('textInput');
const message = document.getElementById('message');

if (savedText) {
message.textContent = `Previously saved text: ${savedText}`;
}

const form = document.getElementById('textForm');
form.addEventListener('submit', (event) => {
event.preventDefault();
const textInput = document.getElementById('textInput').value;
localStorage.setItem('textInput', textInput);
message.textContent = `Text saved: ${textInput}`;
});
});
*/