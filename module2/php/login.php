<?php
// ============================================================
//  BookNest — Module 2: Login Handler (PHP Backend)
//  module2/php/login.php
//
//  Accepts POST: usernameOrEmail, password
//  Returns JSON: { success, message, user? }
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

session_start();

require_once '../../config/db.php'; // ✅ points to config/db.php

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$usernameOrEmail = trim($_POST['usernameOrEmail'] ?? '');
$password        = $_POST['password'] ?? '';

// ── 1. Basic validation ──────────────────────────────────
if (empty($usernameOrEmail) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Username/email and password are required.']);
    exit;
}

// ── 2. Find user in DB ────────────────────────────────────
$stmt = $pdo->prepare(
    "SELECT * FROM users WHERE email = :val OR username = :val LIMIT 1"
);
$stmt->execute([':val' => strtolower($usernameOrEmail)]);
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo json_encode(['success' => false, 'message' => 'No account found with that username or email.']);
    exit;
}

// ── 3. Verify password ────────────────────────────────────
if (!password_verify($password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Incorrect password. Please try again.']);
    exit;
}

// ── 4. Create session ─────────────────────────────────────
$_SESSION['user_id']   = $user['id'];
$_SESSION['fullname']  = $user['fullname'];
$_SESSION['username']  = $user['username'];
$_SESSION['email']     = $user['email'];
$_SESSION['role']      = $user['role'];
$_SESSION['logged_in'] = true;

echo json_encode([
    'success' => true,
    'message' => 'Login successful!',
    'user' => [
        'id'       => $user['id'],
        'fullname' => $user['fullname'],
        'username' => $user['username'],
        'email'    => $user['email'],
        'role'     => $user['role'],
    ]
]);