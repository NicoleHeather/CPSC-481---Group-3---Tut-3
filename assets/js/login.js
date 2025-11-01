// Small script to toggle the login form inside the login card.
// Shows the login form when user clicks "I already have an account" and handles a simple submit.
(function(){
  'use strict';

  const card = document.querySelector('.login-card');
  const stack = document.querySelector('.login-stack');
  const showLink = document.querySelector('.muted-link');
  const cardBody = card ? card.querySelector('.card-body') : null;
  const loginTemplate = document.getElementById('login-template');
  // preserve the original card body so we can restore it
  const originalBodyHTML = cardBody ? cardBody.innerHTML : '';

  function attachFormHandler(form) {
    if (!form) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const user = form.querySelector('#username');
      const pass = form.querySelector('#password');
      if (!user || !pass) return;
      if (!user.value || !pass.value) {
        if (!user.value) user.focus(); else pass.focus();
        return;
      }
      // Placeholder: replace with real authentication later
      window.location.href = '../pages/Home.html';
    });
  }

  function showLogin() {
    if (!cardBody || !loginTemplate) return;
    // inject the login form from the template
    cardBody.innerHTML = loginTemplate.innerHTML;
    const form = cardBody.querySelector('#login-form');
    attachFormHandler(form);
    const first = form && form.querySelector('input');
    if (first) first.focus();
    if (showLink) showLink.textContent = 'Back';
    if (stack) stack.classList.add('has-form');
  }

  function hideLogin() {
    if (!cardBody) return;
    cardBody.innerHTML = originalBodyHTML;
    if (showLink) showLink.textContent = 'I already have an account';
    if (stack) stack.classList.remove('has-form');
  }

  if (showLink) {
    showLink.addEventListener('click', (ev) => {
      ev.preventDefault();
      // toggle by checking whether cardBody currently contains the form
      const hasForm = !!cardBody.querySelector('#login-form');
      if (hasForm) hideLogin(); else showLogin();
    });
  }

})();
