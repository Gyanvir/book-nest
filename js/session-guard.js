document.addEventListener('DOMContentLoaded', () => {

  Auth.requireLogin('login.html');

  const user = Auth.getSession();
  if (!user) return;

  document.querySelectorAll('[data-auth]').forEach(el => {
    const key = el.getAttribute('data-auth');
    if (user[key] !== undefined) {
      el.textContent = user[key];
    }
  });

  document.querySelectorAll('.logout-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      Auth.logout('login.html');
    });
  });

  document.querySelectorAll('a[href="login.html"]').forEach(link => {
    if (link.textContent.trim().toLowerCase() === 'logout') {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout('login.html');
      });
    }
  });

});