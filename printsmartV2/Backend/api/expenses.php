<?php
// Backend/api/expenses.php — Expenses CRUD (MySQL)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

require_once __DIR__ . '/../config/db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM expenses ORDER BY date DESC");
            echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        } catch (PDOException $e) { http_response_code(500); echo json_encode(['error' => 'Failed to fetch expenses']); }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) { http_response_code(400); echo json_encode(['error' => 'Invalid data']); break; }
        try {
            // we use expense_id mapped to 'id' in frontend JSON
            $stmt = $pdo->prepare("SELECT id FROM expenses WHERE expense_id = ?");
            $stmt->execute([$data['id']]);
            
            if ($stmt->fetch()) {
                $up = $pdo->prepare("UPDATE expenses SET category=?, amount=?, date=?, status=? WHERE expense_id=?");
                $up->execute([$data['category'], $data['amount'], empty($data['date']) ? null : $data['date'], $data['status'], $data['id']]);
                echo json_encode(['success' => true, 'message' => 'Expense updated successfully']);
            } else {
                $ins = $pdo->prepare("INSERT INTO expenses (expense_id, category, amount, date, status) VALUES (?, ?, ?, ?, ?)");
                $ins->execute([$data['id'], $data['category'], $data['amount'], empty($data['date']) ? null : $data['date'], $data['status']]);
                echo json_encode(['success' => true, 'message' => 'Expense added successfully']);
            }
        } catch (PDOException $e) { http_response_code(500); echo json_encode(['error' => 'Failed to save expense: ' . $e->getMessage()]); }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID is required']); break; }
        try {
            // deleting by expense_id
            $stmt = $pdo->prepare("DELETE FROM expenses WHERE expense_id = ?");
            $stmt->execute([$id]);
            echo $stmt->rowCount() > 0
                ? json_encode(['success' => true,  'message' => 'Expense deleted successfully'])
                : json_encode(['success' => false, 'message' => 'Expense not found']);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(['error' => 'Failed to delete expense']); }
        break;

    default:
        http_response_code(405); echo json_encode(['error' => 'Method not allowed']);
}
