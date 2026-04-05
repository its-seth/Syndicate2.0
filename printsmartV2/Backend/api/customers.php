<?php
// Backend/api/customers.php — CRUD API for Customers (MySQL)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config/db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];
$request = explode('/', trim($_SERVER['PATH_INFO'] ?? '', '/'));

function generateCustomerId($pdo): string {
    $stmt = $pdo->query("SELECT customer_id FROM customers ORDER BY id DESC LIMIT 1");
    $last = $stmt->fetchColumn();
    if ($last) {
        $num = (int) substr($last, 4);
        return 'CUS-' . str_pad($num + 1, 3, '0', STR_PAD_LEFT);
    }
    return 'CUS-001';
}

try {
    switch ($method) {
        case 'GET':
            $from_date = $_GET['from_date'] ?? null;
            $to_date = $_GET['to_date'] ?? null;
            $search = $_GET['search'] ?? '';

            // Check which columns exist
            $stmt = $pdo->query("SHOW COLUMNS FROM customers");
            $existingColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
            
            $selectCols = ['id', 'customer_id', 'name', 'phone', 'address', 'email'];
            if (in_array('additional_details', $existingColumns)) $selectCols[] = 'additional_details';
            if (in_array('created_at', $existingColumns)) $selectCols[] = 'created_at';
            
            $sql = "SELECT " . implode(',', $selectCols) . " FROM customers WHERE 1=1";
            $params = [];

            if ($from_date && in_array('created_at', $existingColumns)) {
                $sql .= " AND created_at >= ?";
                $params[] = $from_date . ' 00:00:00';
            }
            if ($to_date && in_array('created_at', $existingColumns)) {
                $sql .= " AND created_at <= ?";
                $params[] = $to_date . ' 23:59:59';
            }
            if ($search) {
                // Search only by customer_id OR name (not phone/email)
                $sql .= " AND (customer_id LIKE ? OR name LIKE ?)";
                $like = "%$search%";
                $params[] = $like;
                $params[] = $like;
            }
            $sql .= " ORDER BY id DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['success' => true, 'data' => $customers]);
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) { echo json_encode(['success' => false, 'message' => 'Invalid JSON']); break; }
            $name = trim($data['name'] ?? ''); $phone = trim($data['phone'] ?? '');
            $address = trim($data['address'] ?? ''); $email = trim($data['email'] ?? '');
            $additional = trim($data['additional_details'] ?? '');
            
            if (empty($name) || empty($phone)) { echo json_encode(['success' => false, 'message' => 'Name and phone are required']); break; }
            
            $customerId = generateCustomerId($pdo);
            // Check if additional_details column exists
            $stmt = $pdo->query("SHOW COLUMNS FROM customers LIKE 'additional_details'");
            $hasAdditional = $stmt->rowCount() > 0;
            
            if ($hasAdditional) {
                $stmt = $pdo->prepare("INSERT INTO customers (customer_id, name, phone, address, email, additional_details) VALUES (?, ?, ?, ?, ?, ?)");
                $stmt->execute([$customerId, $name, $phone, $address, $email, $additional]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO customers (customer_id, name, phone, address, email) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$customerId, $name, $phone, $address, $email]);
            }
            echo json_encode(['success' => true, 'message' => 'Customer added successfully', 'customer_id' => $customerId]);
            break;

        case 'PUT':
            $id = $request[0] ?? null;
            if (!$id) { echo json_encode(['success' => false, 'message' => 'Missing customer ID']); break; }
            $data = json_decode(file_get_contents('php://input'), true);
            if (!$data) { echo json_encode(['success' => false, 'message' => 'Invalid JSON']); break; }
            
            $name = trim($data['name'] ?? ''); $phone = trim($data['phone'] ?? '');
            $address = trim($data['address'] ?? ''); $email = trim($data['email'] ?? '');
            $additional = trim($data['additional_details'] ?? '');
            
            if (empty($name) || empty($phone)) { echo json_encode(['success' => false, 'message' => 'Name and phone are required']); break; }
            
            $stmt = $pdo->query("SHOW COLUMNS FROM customers LIKE 'additional_details'");
            $hasAdditional = $stmt->rowCount() > 0;
            
            if ($hasAdditional) {
                $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, address = ?, email = ?, additional_details = ? WHERE id = ?");
                $stmt->execute([$name, $phone, $address, $email, $additional, $id]);
            } else {
                $stmt = $pdo->prepare("UPDATE customers SET name = ?, phone = ?, address = ?, email = ? WHERE id = ?");
                $stmt->execute([$name, $phone, $address, $email, $id]);
            }
            echo json_encode(['success' => true, 'message' => 'Customer updated successfully']);
            break;

        case 'DELETE':
            $id = $request[0] ?? null;
            if (!$id) { echo json_encode(['success' => false, 'message' => 'Missing customer ID']); break; }
            $stmt = $pdo->prepare("DELETE FROM customers WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true, 'message' => 'Customer deleted successfully']);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}
?>