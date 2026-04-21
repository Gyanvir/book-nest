const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle) {
  menuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("show");
  });
}

const registerForm = document.querySelector(".register-form");

if (registerForm) {
  registerForm.addEventListener("submit", function (event) {
    const password = document.querySelector('input[name="password"]').value;
    const confirmPassword = document.querySelector(
      'input[name="confirm_password"]',
    ).value;

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      event.preventDefault();
    }
  });
}

const issueForm = document.querySelector(".issue-return-form");

// Form submit handled by inline scripts in issue_return.html
