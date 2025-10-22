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
