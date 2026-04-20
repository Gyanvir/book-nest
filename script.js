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

if (issueForm) {
  issueForm.addEventListener("submit", function (event) {
    const issueDate = new Date(
      document.querySelector('input[name="issue_date"]').value,
    );
    const returnDate = new Date(
      document.querySelector('input[name="return_date"]').value,
    );

    const timeDiff = returnDate - issueDate;
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

    let fine = 0;

    if (daysDiff > 15) {
      fine = (daysDiff - 15) * 5;
    }

    alert("Borrowing Days: " + daysDiff + "\nFine Amount: ₹" + fine);
  });
}
