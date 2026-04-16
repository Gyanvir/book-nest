<?php
// ============================================================
//  BookNest — Module 2: Logout Handler (PHP Backend)
//  module2/php/logout.php
// ============================================================

session_start();
session_unset();
session_destroy();

header('Location: ../../login.html');
exit;