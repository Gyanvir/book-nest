// ============================================================
//  BookNest — Module 2: Session Guard & Logout Handler
//  module2/session-guard.js
//
//  HOW TO USE:
//  Add this to ANY page that requires login:
//  <script src="module2/auth.js"></script>
//  <script src="module2/session-guard.js"></script>
//
//  It will:
//  1. Redirect to login.html if not logged in
//  2. Populate user info anywhere you put data-auth="..."
//  3. Handle logout buttons automatically
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // ── 1. Guard: Redirect if not logged in ─────────────────
  Auth.requireLogin('login.html');

  const user = Auth.getSession();
  if (!user) return; // Already redirected above

  // ── 2. Populate user info in the page ───────────────────
  //
  // In your HTML, add data-auth attributes to show user info:
  //   <span data-auth="fullname"></span>   → shows full name
  //   <span data-auth="username"></span>   → shows username
  //   <span data-auth="email"></span>      → shows email
  //   <span data-auth="id"></span>         → shows User ID (e.g. BN1023)
  //   <span data-auth="role"></span>       → shows role (student/admin)

  document.querySelectorAll('[data-auth]').forEach(el => {
    const key = el.getAttribute('data-auth');
    if (user[key] !== undefined) {
      el.textContent = user[key];
    }
  });

  // ── 3. Logout Button Handler ─────────────────────────────
  //
  // Add class="logout-btn" to any logout link/button:
  //   <a class="logout-btn" href="#">Logout</a>
  //   <button class="logout-btn">Logout</button>

  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout('login.html');
    });
  });

  // Also handle any <a href="login.html"> that says "Logout" text
  document.querySelectorAll('a[href="login.html"]').forEach(link => {
    if (link.textContent.trim().toLowerCase() === 'logout') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout('login.html');
      });
    }
  });

});