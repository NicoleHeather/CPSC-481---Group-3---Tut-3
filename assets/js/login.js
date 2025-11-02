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
    // wire the forgot-password trigger inside the injected form
    const forgotBtn = cardBody.querySelector('#forgot-password-trigger');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        openResetModal();
      });
    }
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

  /* ---------------------- Password reset modal logic --------------------- */
  const resetModal = document.getElementById('reset-modal');
  const resetForm = resetModal ? resetModal.querySelector('#reset-form') : null;
  let _lastActive = null;

  function trapTabKey(ev) {
    if (ev.key !== 'Tab') return;
    const focusable = resetModal.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (ev.shiftKey) {
      if (document.activeElement === first) {
        ev.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        ev.preventDefault();
        first.focus();
      }
    }
  }

  function openResetModal() {
    if (!resetModal) return;
    _lastActive = document.activeElement;
    resetModal.setAttribute('aria-hidden', 'false');
    resetModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    const input = resetModal.querySelector('#reset-email');
    if (input) input.focus();
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeResetModal() {
    if (!resetModal) return;
    resetModal.setAttribute('aria-hidden', 'true');
    resetModal.classList.remove('open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onModalKeydown);
    if (_lastActive) _lastActive.focus();
  }

  function onModalKeydown(ev) {
    if (ev.key === 'Escape') {
      closeResetModal();
      return;
    }
    trapTabKey(ev);
  }

  // close buttons / backdrop
  if (resetModal) {
    resetModal.addEventListener('click', (ev) => {
      const closer = ev.target.closest('[data-modal-close]');
      if (closer) closeResetModal();
    });
  }

  if (resetForm) {
    resetForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      const email = resetForm.querySelector('#reset-email');
      if (!email || !email.value) { if (email) email.focus(); return; }
      // Demo behavior: show confirmation and close modal. Replace with API call.
      // In a real app, POST to your password-reset endpoint here and handle errors.
      alert('If that email exists, a reset link has been sent.');
      closeResetModal();
    });
  }

})();
