// ============================================================
//  BookNest — Module 2: Authentication & Session Management
//  auth.js — Core auth logic (localStorage-based)
// ============================================================

const Auth = (() => {

  // ── Storage Keys ─────────────────────────────────────────
  const USERS_KEY    = 'booknest_users';
  const SESSION_KEY  = 'booknest_session';

  // ── Password Validation Rules ─────────────────────────────
  const PASSWORD_RULES = {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecial: true,
  };

  // ── Helpers ───────────────────────────────────────────────

  /** Simple hash simulation (for demo — in production use bcrypt on PHP side) */
  function hashPassword(password) {
    // XOR-based obfuscation + base64 for localStorage demo
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      hash = ((hash << 5) - hash) + password.charCodeAt(i);
      hash |= 0;
    }
    return btoa(password.split('').reverse().join('') + hash);
  }

  function getUsers() {
    try {
      return JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function generateUserID() {
    return 'BN' + Math.floor(1000 + Math.random() * 9000);
  }

  // ── Password Validation ───────────────────────────────────

  /**
   * Validates a password against all rules.
   * @param {string} password
   * @returns {{ valid: boolean, errors: string[] }}
   */
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

  /**
   * Returns password strength: 'weak' | 'medium' | 'strong'
   * @param {string} password
   */
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

  // ── Registration ──────────────────────────────────────────

  /**
   * Registers a new user.
   * @returns {{ success: boolean, message: string }}
   */
  function register({ fullname, email, username, password, confirmPassword }) {
    // 1. Basic field presence
    if (!fullname || !email || !username || !password || !confirmPassword)
      return { success: false, message: 'All fields are required.' };

    // 2. Full name validation
    if (fullname.trim().length < 2)
      return { success: false, message: 'Full name must be at least 2 characters.' };

    // 3. Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return { success: false, message: 'Please enter a valid email address.' };

    // 4. Username format (only letters, numbers, underscores)
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username))
      return { success: false, message: 'Username must be 3-20 characters (letters, numbers, underscore only).' };

    // 5. Password strength
    const pwCheck = validatePassword(password);
    if (!pwCheck.valid)
      return { success: false, message: 'Password must have: ' + pwCheck.errors.join(', ') + '.' };

    // 6. Confirm password match
    if (password !== confirmPassword)
      return { success: false, message: 'Passwords do not match.' };

    // 7. Check duplicate email/username
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
      return { success: false, message: 'An account with this email already exists.' };

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase()))
      return { success: false, message: 'This username is already taken. Please choose another.' };

    // 8. Create user
    const newUser = {
      id: generateUserID(),
      fullname: fullname.trim(),
      email: email.toLowerCase().trim(),
      username: username.trim(),
      password: hashPassword(password),
      role: 'student',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    return { success: true, message: 'Account created successfully! Please login.' };
  }

  // ── Login ─────────────────────────────────────────────────

  /**
   * Logs in a user.
   * @returns {{ success: boolean, message: string }}
   */
  function login({ usernameOrEmail, password }) {
    if (!usernameOrEmail || !password)
      return { success: false, message: 'Please enter your username/email and password.' };

    const users = getUsers();
    const user = users.find(u =>
      u.email.toLowerCase() === usernameOrEmail.toLowerCase() ||
      u.username.toLowerCase() === usernameOrEmail.toLowerCase()
    );

    if (!user)
      return { success: false, message: 'No account found with that username or email.' };

    if (user.password !== hashPassword(password))
      return { success: false, message: 'Incorrect password. Please try again.' };

    // Create session
    const session = {
      id: user.id,
      fullname: user.fullname,
      email: user.email,
      username: user.username,
      role: user.role,
      loginTime: new Date().toISOString(),
    };

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

    return { success: true, message: 'Login successful!', user: session };
  }

  // ── Session Management ────────────────────────────────────

  /** Returns current logged-in user or null */
  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null;
    } catch {
      return null;
    }
  }

  /** Returns true if a user is logged in */
  function isLoggedIn() {
    return getSession() !== null;
  }

  /**
   * Protects a page — redirects to login if not authenticated.
   * Call this at the top of any protected page's script.
   */
  function requireLogin(redirectTo = 'login.html') {
    if (!isLoggedIn()) {
      window.location.href = redirectTo;
    }
  }

  /** Logs out the current user */
  function logout(redirectTo = 'login.html') {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = redirectTo;
  }

  // ── Public API ────────────────────────────────────────────
  return {
    validatePassword,
    getPasswordStrength,
    register,
    login,
    logout,
    getSession,
    isLoggedIn,
    requireLogin,
  };

})();