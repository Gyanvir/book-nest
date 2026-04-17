// ============================================================
//  BookNest — Module 2: Authentication & Session Management
//  js/auth.js
//
//  Hybrid auth:
//    - register()  → POST api/register.php  (MySQL)
//    - login()     → POST api/login.php     (MySQL)
//    - Session stored in sessionStorage after PHP confirms
//    - session-guard.js uses getSession() / requireLogin()
// ============================================================

const Auth = (() => {

  const SESSION_KEY = 'booknest_session';

  // ── Resolve API base (works whether page is at root or /admin/) ──
  function apiUrl(endpoint) {
    // Find the root by detecting if we're inside /admin/
    const path = window.location.pathname;
    const inSubdir = path.includes('/admin/');
    return (inSubdir ? '../' : '') + 'api/' + endpoint;
  }

  // ── Password Strength (still used by register-handler UI) ───────

  const PASSWORD_RULES = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
  };

  function validatePassword(password) {
    const errors = [];
    if (password.length < PASSWORD_RULES.minLength)
      errors.push(`At least ${PASSWORD_RULES.minLength} characters`);
    if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password))
      errors.push('At least one uppercase letter (A-Z)');
    if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password))
      errors.push('At least one lowercase letter (a-z)');
    if (PASSWORD_RULES.requireNumber && !/[0-9]/.test(password))
      errors.push('At least one number (0-9)');
    if (PASSWORD_RULES.requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password))
      errors.push('At least one special character (!@#$%...)');
    return { valid: errors.length === 0, errors };
  }

  function getPasswordStrength(password) {
    let score = 0;
    if (password.length >= 8)  score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    return 'strong';
  }

  // ── Email Domain Validation ──────────────────────────────────────

  const ALLOWED_DOMAIN = 'dseu.ac.in';

  function validateEmailDomain(email) {
    return email.toLowerCase().trim().endsWith('@' + ALLOWED_DOMAIN);
  }

  // ── Registration → api/register.php ─────────────────────────────

  /**
   * Registers a new user via PHP backend.
   * Returns a Promise<{ success, message }>.
   */
  async function register({ fullname, email, username, password, confirmPassword }) {

    // --- Client-side pre-checks ---
    if (!fullname || !email || !username || !password || !confirmPassword)
      return { success: false, message: 'All fields are required.' };

    if (fullname.trim().length < 2)
      return { success: false, message: 'Full name must be at least 2 characters.' };

    // Email domain check
    if (!validateEmailDomain(email))
      return { success: false, message: `Only @${ALLOWED_DOMAIN} emails are allowed.` };

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      return { success: false, message: 'Username must be 3–20 characters (letters, numbers, underscore only).' };

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid)
      return { success: false, message: 'Password must have: ' + pwCheck.errors.join(', ') + '.' };

    if (password !== confirmPassword)
      return { success: false, message: 'Passwords do not match.' };

    // --- Call PHP backend ---
    try {
      const body = new FormData();
      body.append('fullname',         fullname.trim());
      body.append('email',            email.toLowerCase().trim());
      body.append('username',         username.trim());
      body.append('password',         password);
      body.append('confirm_password', confirmPassword);

      const res  = await fetch(apiUrl('register.php'), { method: 'POST', body });
      const data = await res.json();
      return data; // { success, message }
    } catch (err) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // ── Login → api/login.php ────────────────────────────────────────

  /**
   * Logs in a user via PHP backend.
   * On success, stores session in sessionStorage.
   * Returns a Promise<{ success, message, user? }>.
   */
  async function login({ usernameOrEmail, password }) {
    if (!usernameOrEmail || !password)
      return { success: false, message: 'Please enter your username/email and password.' };

    try {
      const body = new FormData();
      body.append('usernameOrEmail', usernameOrEmail.trim());
      body.append('password',        password);

      const res  = await fetch(apiUrl('login.php'), { method: 'POST', body });
      const data = await res.json();

      if (data.success && data.user) {
        // Store session locally so session-guard.js can protect pages
        sessionStorage.setItem(SESSION_KEY, JSON.stringify({
          id:       data.user.id,
          fullname: data.user.fullname,
          username: data.user.username,
          email:    data.user.email,
          role:     data.user.role,
          loginTime: new Date().toISOString(),
        }));
      }

      return data;
    } catch (err) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  }

  // ── Session Management ───────────────────────────────────────────

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  }

  function isLoggedIn() {
    return getSession() !== null;
  }

  function requireLogin(redirectTo = 'login.html') {
    if (!isLoggedIn()) {
      window.location.href = redirectTo;
    }
  }

  function logout(redirectTo = 'login.html') {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = redirectTo;
  }

  // ── Public API ───────────────────────────────────────────────────
  return {
    validatePassword,
    getPasswordStrength,
    validateEmailDomain,
    ALLOWED_DOMAIN,
    register,
    login,
    logout,
    getSession,
    isLoggedIn,
    requireLogin,
  };

})();