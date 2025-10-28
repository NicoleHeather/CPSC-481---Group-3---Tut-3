// script.js
const editButton = document.getElementById('event-edit-btn');
const editPopupForm = document.getElementById('editPopupForm');
const removeButton = document.getElementById('event-remove-btn');
const removePopupForm = document.getElementById('removePopupForm');
const background = document.getElementById('event-info');
const shareButton = document.getElementById('event-share-btn');

removeButton.addEventListener('click', function () {
    removePopupForm.style.display = 'block';
    background.style.filter = 'blur(5px)';
    removeButton.style.filter = 'blur(5px)';
    shareButton.style.filter = 'blur(5px)';
    editButton.style.filter = 'blur(5px)';
});
 

editButton.addEventListener('click', function () {
    editPopupForm.style.display = 'block';
    background.style.filter = 'blur(5px)';
    removeButton.style.filter = 'blur(5px)';
    shareButton.style.filter = 'blur(5px)';
    editButton.style.filter = 'blur(5px)';
});