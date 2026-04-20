document.addEventListener('DOMContentLoaded', () => {

  if (Auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form       = document.getElementById('loginForm');
  const alertBox   = document.getElementById('loginAlert');
  const loginBtn   = document.getElementById('loginBtn');
  const toggleBtn  = document.getElementById('toggleLoginPw');
  const pwInput    = document.getElementById('loginPassword');

  if (toggleBtn && pwInput) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = pwInput.type === 'password';
      pwInput.type = isHidden ? 'text' : 'password';
      toggleBtn.textContent = isHidden ? '🙈' : '👁️';
    });
  }

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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors();
    clearAlert();

    const usernameOrEmail = document.getElementById('usernameOrEmail').value.trim();
    const password        = document.getElementById('loginPassword').value;

    let hasError = false;
    if (!usernameOrEmail) { showFieldError('usernameOrEmail', 'Please enter your username or email.'); hasError = true; }
    if (!password)         { showFieldError('password', 'Please enter your password.'); hasError = true; }
    if (hasError) return;

    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    const result = await Auth.login({ usernameOrEmail, password });

    if (result.success) {
      showAlert('Login successful! Redirecting...', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
    } else {
      showAlert(result.message, 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = 'Login';
    }
  });

  document.getElementById('usernameOrEmail').addEventListener('input', () => {
    document.getElementById('err-usernameOrEmail').classList.remove('show');
    clearAlert();
  });

  document.getElementById('loginPassword').addEventListener('input', () => {
    document.getElementById('err-password').classList.remove('show');
    clearAlert();
  });

});