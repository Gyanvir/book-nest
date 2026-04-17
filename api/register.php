<?php
// ============================================================
//  BookNest — Module 2: Register Handler (PHP Backend)
//  module2/php/register.php
//
//  Accepts POST: fullname, email, username, password, confirm_password
//  Returns JSON: { success, message }
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

session_start();

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$fullname        = trim($_POST['fullname']         ?? '');
$email           = trim(strtolower($_POST['email'] ?? ''));
$username        = trim($_POST['username']         ?? '');
$password        = $_POST['password']              ?? '';
$confirmPassword = $_POST['confirm_password']      ?? '';

// ── 1. Required fields ────────────────────────────────────
if (!$fullname || !$email || !$username || !$password || !$confirmPassword) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit;
}

// ── 2. Full name ──────────────────────────────────────────
if (strlen($fullname) < 2) {
    echo json_encode(['success' => false, 'message' => 'Full name must be at least 2 characters.']);
    exit;
}

// ── 3. Email format ───────────────────────────────────────
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Please enter a valid email address.']);
    exit;
}

// ── 3b. Email domain restriction ─────────────────────────
$allowedDomain = 'dseu.ac.in';
if (!str_ends_with($email, '@' . $allowedDomain)) {
    echo json_encode(['success' => false, 'message' => "Only @{$allowedDomain} institutional emails are allowed."]);
    exit;
}

// ── 4. Username format ────────────────────────────────────
if (!preg_match('/^[a-zA-Z0-9_]{3,20}$/', $username)) {
    echo json_encode(['success' => false, 'message' => 'Username must be 3-20 characters (letters, numbers, underscore only).']);
    exit;
}

// ── 5. Password validation ────────────────────────────────
$pwErrors = [];

if (strlen($password) < 8)
    $pwErrors[] = 'at least 8 characters';

if (!preg_match('/[A-Z]/', $password))
    $pwErrors[] = 'one uppercase letter';

if (!preg_match('/[a-z]/', $password))
    $pwErrors[] = 'one lowercase letter';

if (!preg_match('/[0-9]/', $password))
    $pwErrors[] = 'one number';

if (!preg_match('/[^A-Za-z0-9]/', $password))
    $pwErrors[] = 'one special character (!@#$...)';

if (!empty($pwErrors)) {
    echo json_encode(['success' => false, 'message' => 'Password must contain: ' . implode(', ', $pwErrors) . '.']);
    exit;
}

// ── 6. Confirm password match ─────────────────────────────
if ($password !== $confirmPassword) {
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit;
}

// ── 7. Check duplicates ───────────────────────────────────
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
$stmt->execute([':email' => $email]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'An account with this email already exists.']);
    exit;
}

$stmt = $pdo->prepare("SELECT id FROM users WHERE username = :username LIMIT 1");
$stmt->execute([':username' => strtolower($username)]);
if ($stmt->fetch()) {
    echo json_encode(['success' => false, 'message' => 'This username is already taken. Please choose another.']);
    exit;
}

// ── 8. Hash password & insert ─────────────────────────────
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare(
    "INSERT INTO users (fullname, email, username, password_hash, role, created_at)
     VALUES (:fullname, :email, :username, :password_hash, 'student', NOW())"
);

$stmt->execute([
    ':fullname'      => $fullname,
    ':email'         => $email,
    ':username'      => strtolower($username),
    ':password_hash' => $passwordHash,
]);

echo json_encode(['success' => true, 'message' => 'Account created successfully! Please login.']);