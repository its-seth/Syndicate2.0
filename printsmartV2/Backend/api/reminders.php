<?php
// Backend/api/reminders.php — Expense reminders CRUD (MySQL)
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
            $stmt = $pdo->query("SELECT * FROM expense_reminders ORDER BY date ASC");
            $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Map db columns to frontend properties
            foreach($reminders as &$rem) {
                $rem['id'] = $rem['reminder_id']; // The unique frontend id
                $rem['reminderOn'] = (bool) $rem['reminderOn'];
            }
            echo json_encode($reminders);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(['error' => 'Failed to fetch reminders']); }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data) { http_response_code(400); echo json_encode(['error' => 'Invalid data']); break; }
        try {
            $stmt = $pdo->prepare("SELECT id FROM expense_reminders WHERE reminder_id = ?");
            $stmt->execute([$data['id']]);
            
            $remOn = !empty($data['reminderOn']) ? 1 : 0;
            
            if ($stmt->fetch()) {
                $up = $pdo->prepare("UPDATE expense_reminders SET title=?, amount=?, date=?, status=?, icon=?, reminderOn=? WHERE reminder_id=?");
                $up->execute([$data['title'], $data['amount'], empty($data['date']) ? null : $data['date'], $data['status'], $data['icon'], $remOn, $data['id']]);
                echo json_encode(['success' => true, 'message' => 'Reminder updated successfully']);
            } else {
                $ins = $pdo->prepare("INSERT INTO expense_reminders (reminder_id, title, amount, date, status, icon, reminderOn) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $ins->execute([$data['id'], $data['title'], $data['amount'], empty($data['date']) ? null : $data['date'], $data['status'], $data['icon'], $remOn]);
                echo json_encode(['success' => true, 'message' => 'Reminder added successfully']);
            }
        } catch (PDOException $e) { http_response_code(500); echo json_encode(['error' => 'Failed to save reminder: ' . $e->getMessage()]); }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? $_GET['id'] : null;
        if (!$id) { http_response_code(400); echo json_encode(['error' => 'ID is required']); break; }
        try {
            $stmt = $pdo->prepare("DELETE FROM expense_reminders WHERE reminder_id = ?");
            $stmt->execute([$id]);
            echo $stmt->rowCount() > 0
                ? json_encode(['success' => true,  'message' => 'Reminder deleted successfully'])
                : json_encode(['success' => false, 'message' => 'Reminder not found']);
        } catch (PDOException $e) { http_response_code(500); echo json_encode(['error' => 'Failed to delete reminder']); }
        break;

    default:
        http_response_code(405); echo json_encode(['error' => 'Method not allowed']);
}
