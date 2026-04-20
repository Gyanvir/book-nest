<?php

ob_start();
error_reporting(0);
ini_set('display_errors', '0');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204); ob_end_clean(); exit;
}

session_start();

require_once __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

$usernameOrEmail = trim($_POST['usernameOrEmail'] ?? '');
$password        = $_POST['password'] ?? '';

if (empty($usernameOrEmail) || empty($password)) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Username/email and password are required.']);
    exit;
}

try {
    $pdo  = getDB();
    $val  = strtolower($usernameOrEmail);
    $stmt = $pdo->prepare(
        "SELECT * FROM users WHERE email = :email OR username = :username LIMIT 1"
    );
    $stmt->execute([':email' => $val, ':username' => $val]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
} catch (Exception $e) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
    exit;
}

if (!$user) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'No account found with that username or email.']);
    exit;
}

if (!password_verify($password, $user['password_hash'])) {
    ob_end_clean();
    echo json_encode(['success' => false, 'message' => 'Incorrect password. Please try again.']);
    exit;
}

$_SESSION['user_id']   = $user['id'];
$_SESSION['fullname']  = $user['fullname'];
$_SESSION['username']  = $user['username'];
$_SESSION['email']     = $user['email'];
$_SESSION['role']      = $user['role'];
$_SESSION['logged_in'] = true;

ob_end_clean();
echo json_encode([
    'success' => true,
    'message' => 'Login successful!',
    'user'    => [
        'id'       => $user['id'],
        'fullname' => $user['fullname'],
        'username' => $user['username'],
        'email'    => $user['email'],
        'role'     => $user['role'],
    ]
]);
