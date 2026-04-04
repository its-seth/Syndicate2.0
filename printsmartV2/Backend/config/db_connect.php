<?php
// config/db_connect.php
// MySQL Connection using PDO

$host = 'localhost';
$user = 'root';
$pass = '';
$db   = 'printsmart_db';

try {
    // Attempt to connect to MySQL server
    $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass);
    // Set the PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Create database if it doesn't exist and select it
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $pdo->exec("USE `$db`");
} catch(PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => "Connection failed: " . $e->getMessage()]);
    exit();
}
?>
