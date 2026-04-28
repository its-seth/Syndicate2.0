<?php
// Backend/api/employees.php
// MySQL single endpoint for all employee operations.
// GET  → list all employees
// POST → add new employee
// DELETE → delete employee (id)

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../config/db_connect.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── GET — list all employees ───────────────────────────────────────
if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT * FROM employees ORDER BY id DESC");
        $employees = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($employees);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
    exit;
}

// ── POST — add new employee ────────────────────────────────────────
if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data) {
        echo json_encode(['success' => false, 'message' => 'No data received']);
        exit;
    }

    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $address = trim($data['address'] ?? '');
    $role = trim($data['role'] ?? '');
    $salary = trim($data['salary'] ?? '');
    $additional_details = trim($data['additional_details'] ?? $data['details'] ?? '');

    // Validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[a-zA-Z0-9._%+\-]+@gmail\.com$/', $email)) {
        echo json_encode(['success' => false, 'message' => 'Only valid Gmail addresses are allowed']);
        exit;
    }

    $clean_phone = preg_replace('/[^0-9]/', '', $phone);
    if (empty($clean_phone) || strlen($clean_phone) !== 10) {
        echo json_encode(['success' => false, 'message' => 'Valid phone number is required (exactly 10 digits)']);
        exit;
    }

    // Duplicate check
    $stmt = $pdo->prepare("SELECT id FROM employees WHERE phone = ?");
    $stmt->execute([$phone]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Phone number already exists in the system']);
        exit;
    }

    // Generate emp_id_str safely avoiding conflicts from deleted rows
    $stmt = $pdo->query("SELECT MAX(id) FROM employees");
    $maxId = $stmt->fetchColumn();
    $maxId = $maxId ? (int)$maxId : 0;
    $emp_id_str = '#EM-' . str_pad($maxId + 1, 3, '0', STR_PAD_LEFT);

    try {
        $sql = "INSERT INTO employees (emp_id_str, name, email, phone, address, role, salary, additional_details) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$emp_id_str, $name, $email, $phone, $address, $role, $salary, $additional_details]);

        echo json_encode([
            'success' => true,
            'message' => 'Employee added successfully',
            'id' => $pdo->lastInsertId(),
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// ── PUT — edit an existing employee ─────────────────────────────────
if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'ID is required to update']);
        exit;
    }

    $id = $data['id'];
    $name = trim($data['name'] ?? '');
    $email = trim($data['email'] ?? '');
    $phone = trim($data['phone'] ?? '');
    $address = trim($data['address'] ?? '');
    $role = trim($data['role'] ?? '');
    $salary = trim($data['salary'] ?? '');
    $additional_details = trim($data['additional_details'] ?? $data['details'] ?? '');

    // Validations
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !preg_match('/^[a-zA-Z0-9._%+\-]+@gmail\.com$/', $email)) {
        echo json_encode(['success' => false, 'message' => 'Only valid Gmail addresses are allowed']);
        exit;
    }

    $clean_phone = preg_replace('/[^0-9]/', '', $phone);
    if (empty($clean_phone) || strlen($clean_phone) !== 10) {
        echo json_encode(['success' => false, 'message' => 'Valid phone number is required (exactly 10 digits)']);
        exit;
    }

    // Duplicate phone check for other user
    $stmt = $pdo->prepare("SELECT id FROM employees WHERE phone = ? AND id != ?");
    $stmt->execute([$phone, $id]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Phone number already exists in the system']);
        exit;
    }

    try {
        $sql = "UPDATE employees SET name = ?, email = ?, phone = ?, address = ?, role = ?, salary = ?, additional_details = ? WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$name, $email, $phone, $address, $role, $salary, $additional_details, $id]);

        echo json_encode([
            'success' => true,
            'message' => 'Employee updated successfully'
        ]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

// ── DELETE — remove employee by ID ───────────────────
if ($method === 'DELETE') {
    $data = json_decode(file_get_contents('php://input'), true);
    $id = isset($_GET['id']) ? $_GET['id'] : ($data['id'] ?? null);

    if (!$id) {
        echo json_encode(['success' => false, 'message' => 'No ID received']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM employees WHERE id = ?");
        $stmt->execute([$id]);

        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true, 'message' => 'Employee deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Employee not found']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
    }
    exit;
}

echo json_encode(['success' => false, 'message' => 'Method not allowed']);
