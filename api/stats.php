<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/db.php';

try {
    $pdo = getDB();

    // Total books (titles)
    $stmtTotal = $pdo->query('SELECT COUNT(*) FROM books');
    $totalBooks = (int)$stmtTotal->fetchColumn();

    // Available books (titles that have at least 1 copy available)
    $stmtAvail = $pdo->query('SELECT COUNT(*) FROM books WHERE available > 0');
    $availableBooks = (int)$stmtAvail->fetchColumn();

    // Issued Books (total physical copies currently issued)
    // Or active loans in circulation
    $stmtIssued = $pdo->query('SELECT SUM(total_copies) - SUM(available) FROM books');
    $issuedBooks = (int)$stmtIssued->fetchColumn();

    // Total users
    $stmtUsers = $pdo->query('SELECT COUNT(*) AS total_users FROM users WHERE role = "student"');
    $usersData = $stmtUsers->fetch();
    $totalUsers = (int)($usersData['total_users'] ?? 0);

    echo json_encode([
        'success' => true,
        'data' => [
            'total_books' => $totalBooks,
            'issued_books' => $issuedBooks,
            'available_books' => $availableBooks,
            'total_users' => $totalUsers
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}
