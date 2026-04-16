<?php
// ============================================================
//  BookNest — Database Connection
//  config/db.php
// ============================================================

$host     = 'localhost';
$dbname   = 'booknest';
$username = 'root';       // your MySQL username
$password = '';           // your MySQL password (usually empty on localhost)

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}