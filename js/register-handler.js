document.addEventListener('DOMContentLoaded', () => {

  if (Auth.isLoggedIn()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form        = document.getElementById('registerForm');
  const alertBox    = document.getElementById('registerAlert');
  const registerBtn = document.getElementById('registerBtn');

  function setupToggle(btnId, inputId) {
    const btn   = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (btn && input) {
      btn.addEventListener('click', () => {
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        btn.textContent = isHidden ? '🙈' : '👁️';
      });
    }
  }

  setupToggle('togglePw', 'password');
  setupToggle('toggleConfirmPw', 'confirmPassword');

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

  function clearFieldError(fieldId) {
    const el = document.getElementById('err-' + fieldId);
    if (el) {
      el.textContent = '';
      el.classList.remove('show');
    }
  }

  function clearAllErrors() {
    document.querySelectorAll('.error-msg').forEach(el => {
      el.textContent = '';
      el.classList.remove('show');
    });
  }

  const pwInput       = document.getElementById('password');
  const strengthBar   = document.getElementById('pwStrengthBar');
  const strengthLabel = document.getElementById('pwStrengthLabel');

  const ruleMap = {
    'rule-length':  (p) => p.length >= 8,
    'rule-upper':   (p) => /[A-Z]/.test(p),
    'rule-lower':   (p) => /[a-z]/.test(p),
    'rule-number':  (p) => /[0-9]/.test(p),
    'rule-special': (p) => /[^A-Za-z0-9]/.test(p),
  };

  const ruleLabels = {
    'rule-length':  '8 characters minimum',
    'rule-upper':   'One uppercase letter',
    'rule-lower':   'One lowercase letter',
    'rule-number':  'One number',
    'rule-special': 'One special character (!@#$...)',
  };

  function updatePasswordUI(password) {
    Object.entries(ruleMap).forEach(([id, test]) => {
      const el = document.getElementById(id);
      if (!el) return;
      const passes = test(password);
      el.textContent = (passes ? '✓ ' : '✗ ') + ruleLabels[id];
      el.className   = passes ? 'pass' : 'fail';
    });

    if (password.length === 0) {
      strengthBar.className = 'pw-strength-bar';
      strengthLabel.textContent = '';
      return;
    }

    const strength = Auth.getPasswordStrength(password);
    const labelText = { weak: '🔴 Weak', medium: '🟡 Medium', strong: '🟢 Strong' };

    strengthBar.className   = `pw-strength-bar ${strength}`;
    strengthLabel.className = `pw-strength-label ${strength}`;
    strengthLabel.textContent = labelText[strength];
  }

  pwInput.addEventListener('input', () => {
    updatePasswordUI(pwInput.value);
    clearFieldError('password');
    clearAlert();
    const confirm = document.getElementById('confirmPassword').value;
    if (confirm) {
      if (confirm !== pwInput.value) {
        showFieldError('confirmPassword', 'Passwords do not match.');
      } else {
        clearFieldError('confirmPassword');
      }
    }
  });

  document.getElementById('confirmPassword').addEventListener('input', function () {
    const pw = pwInput.value;
    if (this.value && this.value !== pw) {
      showFieldError('confirmPassword', 'Passwords do not match.');
    } else {
      clearFieldError('confirmPassword');
    }
  });

  const emailInput = document.getElementById('email');
  if (emailInput) {
    emailInput.addEventListener('input', () => {
      clearFieldError('email');
      clearAlert();
      const val = emailInput.value.trim();
      if (val && !Auth.validateEmailDomain(val)) {
        showFieldError('email', `Only @${Auth.ALLOWED_DOMAIN} emails are allowed.`);
      }
    });
  }

  ['fullname', 'username'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { clearFieldError(id); clearAlert(); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();
    clearAlert();

    const fullname        = document.getElementById('fullname').value.trim();
    const email           = document.getElementById('email').value.trim();
    const username        = document.getElementById('username').value.trim();
    const password        = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating account...';

    const result = await Auth.register({ fullname, email, username, password, confirmPassword });

    if (result.success) {
      showAlert(result.message, 'success');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    } else {
      showAlert(result.message, 'error');
      registerBtn.disabled = false;
      registerBtn.textContent = 'Create Account';
    }
  });

});