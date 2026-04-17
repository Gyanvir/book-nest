<?php
// ============================================================
//  BookNest — Books CRUD API
//  Module 3: api/books.php
//  Actions: list | get | add | update | delete | search
// ============================================================

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── Route ────────────────────────────────────────────────────
try {
    switch ($method) {

        case 'GET':
            if ($action === 'list')   listBooks();
            elseif ($action === 'get')    getBook();
            elseif ($action === 'search') searchBooks();
            else respond(false, 'Unknown GET action');
            break;

        case 'POST':
            $data = getBody();
            if ($action === 'add') addBook($data);
            else respond(false, 'Unknown POST action');
            break;

        case 'PUT':
            $data = getBody();
            if ($action === 'update') updateBook($data);
            else respond(false, 'Unknown PUT action');
            break;

        case 'DELETE':
            $data = getBody();
            if ($action === 'delete') deleteBook($data);
            else respond(false, 'Unknown DELETE action');
            break;

        default:
            respond(false, 'Method not allowed');
    }
} catch (PDOException $e) {
    respond(false, 'DB error: ' . $e->getMessage());
}


// ── Handlers ─────────────────────────────────────────────────

function listBooks(): void {
    $pdo  = getDB();
    $page = max(1, intval($_GET['page'] ?? 1));
    $per  = max(1, min(100, intval($_GET['per'] ?? 10)));
    $genre  = $_GET['genre']  ?? '';
    $status = $_GET['status'] ?? '';  // 'available' | 'unavailable'
    $q      = trim($_GET['q'] ?? '');

    $where  = ['1=1'];
    $params = [];

    if ($q !== '') {
        $like = '%' . $q . '%';
        $where[] = '(title LIKE :q1 OR author LIKE :q2 OR isbn LIKE :q3 OR publisher LIKE :q4 OR genre LIKE :q5)';
        $params[':q1'] = $like;
        $params[':q2'] = $like;
        $params[':q3'] = $like;
        $params[':q4'] = $like;
        $params[':q5'] = $like;
    }
    if ($genre !== '') {
        $where[] = 'genre = :genre';
        $params[':genre'] = $genre;
    }
    if ($status === 'available') {
        $where[] = 'available > 0';
    } elseif ($status === 'unavailable') {
        $where[] = 'available = 0';
    }

    $whereSQL = implode(' AND ', $where);

    // total count
    $cntStmt = $pdo->prepare("SELECT COUNT(*) FROM books WHERE $whereSQL");
    $cntStmt->execute($params);
    $total = (int)$cntStmt->fetchColumn();

    // paginated rows
    $offset = ($page - 1) * $per;
    $stmt = $pdo->prepare(
        "SELECT * FROM books WHERE $whereSQL ORDER BY created_at DESC LIMIT :limit OFFSET :offset"
    );
    foreach ($params as $k => $v) $stmt->bindValue($k, $v);
    $stmt->bindValue(':limit',  $per,    PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $books = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'data'    => $books,
        'meta'    => [
            'total'        => $total,
            'page'         => $page,
            'per_page'     => $per,
            'total_pages'  => (int)ceil($total / $per),
        ]
    ]);
}

function getBook(): void {
    $id = intval($_GET['id'] ?? 0);
    if ($id <= 0) { respond(false, 'Invalid book ID'); return; }

    $stmt = getDB()->prepare('SELECT * FROM books WHERE book_id = :id');
    $stmt->execute([':id' => $id]);
    $book = $stmt->fetch();

    if (!$book) { respond(false, 'Book not found'); return; }
    echo json_encode(['success' => true, 'data' => $book]);
}

function searchBooks(): void {
    $q     = trim($_GET['q'] ?? '');
    $genre = $_GET['genre'] ?? '';
    $status = $_GET['status'] ?? '';

    $where  = [];
    $params = [];

    if ($q !== '') {
        $where[] = '(title LIKE :q OR author LIKE :q OR isbn LIKE :q OR publisher LIKE :q)';
        $params[':q'] = "%$q%";
    }
    if ($genre !== '') {
        $where[] = 'genre = :genre';
        $params[':genre'] = $genre;
    }
    if ($status === 'available')   $where[] = 'available > 0';
    if ($status === 'unavailable') $where[] = 'available = 0';

    $whereSQL = $where ? implode(' AND ', $where) : '1=1';
    $stmt = getDB()->prepare("SELECT * FROM books WHERE $whereSQL ORDER BY title ASC LIMIT 100");
    $stmt->execute($params);
    $books = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $books, 'meta' => ['total' => count($books)]]);
}

function addBook(array $d): void {
    validate($d, ['isbn','title','author','total_copies']);

    $pdo  = getDB();
    $stmt = $pdo->prepare(
        'INSERT INTO books (isbn, title, author, publisher, year, genre, total_copies, available, cover_url, description)
         VALUES (:isbn, :title, :author, :publisher, :year, :genre, :total_copies, :available, :cover_url, :description)'
    );
    $copies = intval($d['total_copies']);
    $stmt->execute([
        ':isbn'         => trim($d['isbn']),
        ':title'        => trim($d['title']),
        ':author'       => trim($d['author']),
        ':publisher'    => trim($d['publisher'] ?? ''),
        ':year'         => $d['year'] ? intval($d['year']) : null,
        ':genre'        => trim($d['genre'] ?? ''),
        ':total_copies' => $copies,
        ':available'    => $copies,           // all copies available on add
        ':cover_url'    => trim($d['cover_url'] ?? ''),
        ':description'  => trim($d['description'] ?? ''),
    ]);
    respond(true, 'Book added successfully', ['book_id' => (int)$pdo->lastInsertId()]);
}

function updateBook(array $d): void {
    validate($d, ['book_id','isbn','title','author','total_copies']);

    $copies    = intval($d['total_copies']);
    $available = min($copies, max(0, intval($d['available'] ?? $copies)));

    $stmt = getDB()->prepare(
        'UPDATE books SET
           isbn=:isbn, title=:title, author=:author,
           publisher=:publisher, year=:year, genre=:genre,
           total_copies=:total_copies, available=:available,
           cover_url=:cover_url, description=:description
         WHERE book_id=:book_id'
    );
    $stmt->execute([
        ':book_id'      => intval($d['book_id']),
        ':isbn'         => trim($d['isbn']),
        ':title'        => trim($d['title']),
        ':author'       => trim($d['author']),
        ':publisher'    => trim($d['publisher'] ?? ''),
        ':year'         => $d['year'] ? intval($d['year']) : null,
        ':genre'        => trim($d['genre'] ?? ''),
        ':total_copies' => $copies,
        ':available'    => $available,
        ':cover_url'    => trim($d['cover_url'] ?? ''),
        ':description'  => trim($d['description'] ?? ''),
    ]);
    respond(true, 'Book updated successfully');
}

function deleteBook(array $d): void {
    $id = intval($d['book_id'] ?? 0);
    if ($id <= 0) { respond(false, 'Invalid book ID'); return; }

    $stmt = getDB()->prepare('DELETE FROM books WHERE book_id = :id');
    $stmt->execute([':id' => $id]);
    respond(true, 'Book deleted successfully');
}


// ── Helpers ──────────────────────────────────────────────────

function getBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function validate(array $data, array $required): void {
    foreach ($required as $field) {
        if (empty($data[$field]) && $data[$field] !== 0) {
            respond(false, "Missing required field: $field");
            exit;
        }
    }
}

function respond(bool $ok, string $msg, array $extra = []): void {
    http_response_code($ok ? 200 : 400);
    echo json_encode(array_merge(['success' => $ok, 'message' => $msg], $extra));
    exit;
}
