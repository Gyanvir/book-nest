<?php
require_once __DIR__ . '/api/db.php';

$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'issue';

// Mock getBody() by redefining it? No, getBody() uses php://input or $_POST.
// Let's just include circulation.php and call issueBook() if possible.
// circulation.php has logic in the global scope:
// if ($method === 'POST') {
//     $data = getBody();
//     if ($action === 'issue') {
//         issueBook($data);
// ...

$data = [
    'student_id' => 'BN1000',
    'book_id' => '978-0-06-112008-4', // To Kill a Mockingbird
    'issue_date' => '2026-04-21',
    'return_date' => '2026-05-01'
];

file_put_contents('test_input.json', json_encode($data));

// Now run the actual API script
$output = shell_exec('php -r "$_SERVER[\'REQUEST_METHOD\']=\'POST\'; $_GET[\'action\']=\'issue\'; file_put_contents(\'php://input\', file_get_contents(\'test_input.json\')); require \'api/circulation.php\';"');
echo "Output: \n" . $output;
