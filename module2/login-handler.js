// ============================================================
//  BookNest — Module 2: Login Page Handler
//  module2/login-handler.js
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // If already logged in, skip login page
  if (Auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form       = document.getElementById('loginForm');
  const alertBox   = document.getElementById('loginAlert');
  const loginBtn   = document.getElementById('loginBtn');
  const toggleBtn  = document.getElementById('toggleLoginPw');
  const pwInput    = document.getElementById('loginPassword');

  // ── Show/Hide Password Toggle ───────────────────────────
  if (toggleBtn && pwInput) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = pwInput.type === 'password';
      pwInput.type = isHidden ? 'text' : 'password';
      toggleBtn.textContent = isHidden ? '🙈' : '👁️';
    });
  }

  // ── Alert Helper ────────────────────────────────────────
  function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert-box show ${type}`;
  }

  function clearAlert() {
    alertBox.className = 'alert-box';
    alertBox.textContent = '';
  }

  function showFieldError(fieldId, message) {
    const el = document.getElementById('err-' + fieldId);
    if (el) {
      el.textContent = message;
      el.classList.add('show');
    }
  }

  function clearFieldErrors() {
    document.querySelectorAll('.error-msg').forEach(el => {
      el.textContent = '';
      el.classList.remove('show');
    });
  }

  // ── Form Submit ─────────────────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    clearFieldErrors();
    clearAlert();

    const usernameOrEmail = document.getElementById('usernameOrEmail').value.trim();
    const password        = document.getElementById('loginPassword').value;

    // Client-side empty checks
    let hasError = false;

    if (!usernameOrEmail) {
      showFieldError('usernameOrEmail', 'Please enter your username or email.');
      hasError = true;
    }

    if (!password) {
      showFieldError('password', 'Please enter your password.');
      hasError = true;
    }

    if (hasError) return;

    // Disable button during processing
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    // Call Auth module
    setTimeout(() => {
      const result = Auth.login({ usernameOrEmail, password });

      if (result.success) {
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
      } else {
        showAlert(result.message, 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      }
    }, 300); // small delay for UX feel
  });

  // Clear error on input
  document.getElementById('usernameOrEmail').addEventListener('input', () => {
    document.getElementById('err-usernameOrEmail').classList.remove('show');
    clearAlert();
  });

  document.getElementById('loginPassword').addEventListener('input', () => {
    document.getElementById('err-password').classList.remove('show');
    clearAlert();
  });

});