<?php
// ============================================================
//  BookNest — API Connection Test
//  Visit: http://localhost/book-nest/api_test.php
//  DELETE after testing!
// ============================================================
error_reporting(E_ALL);
ini_set('display_errors', '1');
?>
<!DOCTYPE html>
<html>
<head><title>BookNest API Test</title>
<style>body{font-family:monospace;padding:20px;background:#f5f5f5} .ok{color:green} .fail{color:red} pre{background:#fff;padding:12px;border-radius:6px;border:1px solid #ddd}</style>
</head>
<body>
<h2>BookNest — Connection Test</h2>
<hr>

<?php
// ── 1. DB Connection ──────────────────────────────────────
echo "<h3>1. Database Connection</h3>";
require_once __DIR__ . '/api/db.php';
try {
    $pdo = getDB();
    echo "<p class='ok'>✅ Connected to MySQL successfully</p>";

    // Count users
    $count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    echo "<p class='ok'>✅ Users in DB: <strong>$count</strong></p>";

    // Show admin user
    $admin = $pdo->query("SELECT id, user_code, username, email, role FROM users WHERE username='admin'")->fetch();
    if ($admin) {
        echo "<p class='ok'>✅ Admin found:</p><pre>" . print_r($admin, true) . "</pre>";
    } else {
        echo "<p class='fail'>❌ No admin user found — re-import schema.sql</p>";
    }

} catch (Exception $e) {
    echo "<p class='fail'>❌ DB Error: " . $e->getMessage() . "</p>";
}

// ── 2. Password Test ──────────────────────────────────────
echo "<h3>2. Password Hash Test</h3>";
try {
    $admin = $pdo->query("SELECT password_hash FROM users WHERE username='admin'")->fetch();
    if ($admin) {
        $testPass = 'Admin@123';
        $ok = password_verify($testPass, $admin['password_hash']);
        if ($ok) {
            echo "<p class='ok'>✅ Password 'Admin@123' matches the stored hash</p>";
        } else {
            echo "<p class='fail'>❌ Password 'Admin@123' does NOT match hash</p>";
            echo "<p>Stored hash: <code>" . htmlspecialchars($admin['password_hash']) . "</code></p>";
            // Show what Admin@123 should hash to
            $newHash = password_hash('Admin@123', PASSWORD_BCRYPT);
            echo "<p>Run this SQL to fix it:</p>";
            echo "<pre>UPDATE users SET password_hash = '$newHash' WHERE username = 'admin';</pre>";
        }
    }
} catch (Exception $e) {
    echo "<p class='fail'>❌ Error: " . $e->getMessage() . "</p>";
}

// ── 3. API Endpoint test ──────────────────────────────────
echo "<h3>3. Login API Endpoint</h3>";
$url = 'http://localhost/book-nest/api/login.php';
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => ['usernameOrEmail' => 'admin', 'password' => 'Admin@123'],
]);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "<p>HTTP Status: <strong>$httpCode</strong></p>";
echo "<p>Raw Response:</p><pre>" . htmlspecialchars($response) . "</pre>";
$decoded = json_decode($response, true);
if ($decoded) {
    echo "<p class='" . ($decoded['success'] ? 'ok' : 'fail') . "'>";
    echo ($decoded['success'] ? '✅' : '❌') . " " . htmlspecialchars($decoded['message']) . "</p>";
} else {
    echo "<p class='fail'>❌ Response is not valid JSON — PHP is outputting something extra</p>";
}
?>

<hr>
<p style="color:#999">⚠️ Delete <code>api_test.php</code> after testing.</p>
</body>
</html>
