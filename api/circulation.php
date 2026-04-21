<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    if ($method === 'POST') {
        $data = getBody();
        if ($action === 'issue') {
            issueBook($data);
        } elseif ($action === 'return') {
            returnBook($data);
        } else {
            respond(false, 'Unknown POST action');
        }
    } elseif ($method === 'GET') {
        if ($action === 'user_books') {
            getUserBooks();
        } else {
            respond(false, 'Unknown GET action');
        }
    } else {
        respond(false, 'Method not allowed');
    }
} catch (PDOException $e) {
    respond(false, 'DB error: ' . $e->getMessage());
}

function issueBook(array $d): void {
    validate($d, ['student_id', 'book_id', 'issue_date', 'return_date']);
    $pdo = getDB();

    $userCode = trim($d['student_id']);
    $bookInput = trim($d['book_id']);
    $issueDate = $d['issue_date'];
    $dueDate = $d['return_date']; // in issue form, return_date is the expected due date

    // Find User
    $stmtUser = $pdo->prepare('SELECT id FROM users WHERE user_code = :code');
    $stmtUser->execute([':code' => $userCode]);
    $userId = $stmtUser->fetchColumn();
    if (!$userId) respond(false, 'Student not found.');

    // Find Book
    $stmtBook = $pdo->prepare('SELECT book_id, available FROM books WHERE book_id = :id OR isbn = :isbn');
    $stmtBook->execute([':id' => $bookInput, ':isbn' => $bookInput]);
    $book = $stmtBook->fetch();
    if (!$book) respond(false, 'Book not found.');
    if ($book['available'] <= 0) respond(false, 'Book is currently out of stock.');

    $bookId = $book['book_id'];

    // Check if already issued and not returned
    $stmtCheck = $pdo->prepare('SELECT issue_id FROM circulation WHERE user_id = :uid AND book_id = :bid AND return_date IS NULL');
    $stmtCheck->execute([':uid' => $userId, ':bid' => $bookId]);
    if ($stmtCheck->fetch()) respond(false, 'Student already has this book issued.');

    $pdo->beginTransaction();
    try {
        // Insert circulation
        $stmtCirc = $pdo->prepare('INSERT INTO circulation (user_id, book_id, issue_date, due_date) VALUES (:uid, :bid, :idate, :ddate)');
        $stmtCirc->execute([
            ':uid' => $userId,
            ':bid' => $bookId,
            ':idate' => $issueDate,
            ':ddate' => $dueDate
        ]);

        // Update books available count
        $stmtUpdate = $pdo->prepare('UPDATE books SET available = available - 1 WHERE book_id = :bid');
        $stmtUpdate->execute([':bid' => $bookId]);

        $pdo->commit();
        respond(true, 'Book issued successfully.');
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(false, 'Error issuing book: ' . $e->getMessage());
    }
}

function returnBook(array $d): void {
    validate($d, ['student_id', 'book_id', 'return_date']);
    $pdo = getDB();

    $userCode = trim($d['student_id']);
    $bookInput = trim($d['book_id']);
    $returnDate = $d['return_date'];

    // Find User
    $stmtUser = $pdo->prepare('SELECT id FROM users WHERE user_code = :code');
    $stmtUser->execute([':code' => $userCode]);
    $userId = $stmtUser->fetchColumn();
    if (!$userId) respond(false, 'Student not found.');

    // Find Book
    $stmtBook = $pdo->prepare('SELECT book_id FROM books WHERE book_id = :id OR isbn = :isbn');
    $stmtBook->execute([':id' => $bookInput, ':isbn' => $bookInput]);
    $bookId = $stmtBook->fetchColumn();
    if (!$bookId) respond(false, 'Book not found.');

    // Find active circulation record
    $stmtCirc = $pdo->prepare('SELECT issue_id, issue_date, due_date FROM circulation WHERE user_id = :uid AND book_id = :bid AND return_date IS NULL');
    $stmtCirc->execute([':uid' => $userId, ':bid' => $bookId]);
    $circ = $stmtCirc->fetch();

    if (!$circ) respond(false, 'No active issue record found for this student and book.');

    // Calculate fine
    $issueDateObj = new DateTime($circ['issue_date']);
    $returnDateObj = new DateTime($returnDate);
    $diff = $returnDateObj->diff($issueDateObj);
    $days = $diff->days;
    // Check if return date is before issue date
    if ($returnDateObj < $issueDateObj) {
        respond(false, 'Return date cannot be before issue date.');
    }

    $fineAmount = 0;
    if ($days > 15) {
        $fineAmount = ($days - 15) * 5;
    }

    $pdo->beginTransaction();
    try {
        // Update circulation
        $stmtUpdateCirc = $pdo->prepare('UPDATE circulation SET return_date = :rdate, fine_amount = :fine WHERE issue_id = :iid');
        $stmtUpdateCirc->execute([
            ':rdate' => $returnDate,
            ':fine' => $fineAmount,
            ':iid' => $circ['issue_id']
        ]);

        // Update books available count
        $stmtUpdateBook = $pdo->prepare('UPDATE books SET available = available + 1 WHERE book_id = :bid AND available < total_copies');
        $stmtUpdateBook->execute([':bid' => $bookId]);

        $pdo->commit();
        $fineMsg = $fineAmount > 0 ? " Late fine of ₹$fineAmount applied." : "";
        respond(true, "Book returned successfully.$fineMsg", ['fine_amount' => $fineAmount]);
    } catch (Exception $e) {
        $pdo->rollBack();
        respond(false, 'Error returning book: ' . $e->getMessage());
    }
}

function getUserBooks(): void {
    $userId = $_GET['user_id'] ?? null;
    if (!$userId) respond(false, 'Missing user_id parameter.');

    $pdo = getDB();
    $stmt = $pdo->prepare('
        SELECT c.issue_id, c.issue_date, c.due_date, c.return_date, c.fine_amount,
               b.book_id, b.title as material_name
        FROM circulation c
        JOIN books b ON c.book_id = b.book_id
        WHERE c.user_id = :uid
        ORDER BY c.issue_date DESC
    ');
    $stmt->execute([':uid' => $userId]);
    $books = $stmt->fetchAll();

    respond(true, 'User books retrieved successfully.', ['data' => $books]);
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        // Fallback to $_POST if not JSON
        return $_POST;
    }
    return $data;
}

function validate(array $data, array $required): void {
    foreach ($required as $field) {
        if (empty($data[$field]) && $data[$field] !== '0') {
            respond(false, "Missing required field: $field");
        }
    }
}

function respond(bool $ok, string $msg, array $extra = []): void {
    http_response_code($ok ? 200 : 400);
    echo json_encode(array_merge(['success' => $ok, 'message' => $msg], $extra));
    exit;
}
