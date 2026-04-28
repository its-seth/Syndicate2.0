<?php
// Backend/api/suppliers.php — Supplier API (MySQL)
require_once __DIR__ . '/../config/db_connect.php';
session_start();

$action = $_POST['action'] ?? $_GET['action'] ?? '';
$empId  = (int) ($_SESSION['EmpID'] ?? 1);

// Helper: format supplier ID
function formatSupplierId($id) {
    return '#SUP-' . str_pad($id, 3, '0', STR_PAD_LEFT);
}

if ($action === 'list') {
    $search = trim($_POST['search'] ?? '');
    
    if (!empty($search)) {
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE EmpID = ? AND (SName LIKE ? OR SEmail LIKE ? OR SContact_No LIKE ?) ORDER BY SName ASC");
        $term = "%$search%";
        $stmt->execute([$empId, $term, $term, $term]);
    } else {
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE EmpID = ? ORDER BY SName ASC");
        $stmt->execute([$empId]);
    }
    
    $suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Add formatted supplier_id and ensure Stotal is float
    foreach($suppliers as &$sup) {
        $sup['supplier_id'] = formatSupplierId($sup['id']);
        $sup['Stotal'] = (float)$sup['Stotal'];
        $sup['SID'] = $sup['id']; // keep for compatibility
    }
    echo json_encode($suppliers);
    exit;
}

if ($action === 'add') {
    parse_str($_POST['data'], $data);
    $stmt = $pdo->prepare("INSERT INTO suppliers (EmpID, SName, SEmail, SContact_No, SAddress, supply_type, supply_details, Stotal, SDueDate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $empId, $data['SName'] ?? '', $data['SEmail'] ?? '', $data['SContact_No'] ?? '', 
        $data['SAddress'] ?? '', $data['supply_type'] ?? '', $data['supply_details'] ?? '', 
        (float)($data['Stotal'] ?? 0), empty($data['SDueDate']) ? null : $data['SDueDate']
    ]);
    echo json_encode(['status' => 'success']);
    exit;
}

if ($action === 'edit') {
    parse_str($_POST['data'], $data);
    $sid = $data['SID'] ?? null;
    if (!$sid) { echo json_encode(['status' => 'error', 'message' => 'No SID']); exit; }
    try {
        $stmt = $pdo->prepare("UPDATE suppliers SET SName=?, SEmail=?, SContact_No=?, SAddress=?, supply_type=?, supply_details=?, Stotal=?, SDueDate=? WHERE id=? AND EmpID=?");
        $stmt->execute([
            $data['SName'] ?? '', $data['SEmail'] ?? '', $data['SContact_No'] ?? '', 
            $data['SAddress'] ?? '', $data['supply_type'] ?? '', $data['supply_details'] ?? '', 
            (float)($data['Stotal'] ?? 0), empty($data['SDueDate']) ? null : $data['SDueDate'],
            $sid, $empId
        ]);
        echo json_encode(['status' => 'success']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'delete') {
    $id = $_POST['id'] ?? null;
    if (!$id) { echo json_encode(['status' => 'error', 'message' => 'No ID']); exit; }
    try {
        $stmt = $pdo->prepare("DELETE FROM suppliers WHERE id=? AND EmpID=?");
        $stmt->execute([$id, $empId]);
        echo json_encode(['status' => 'success']);
    } catch (PDOException $e) {
        echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'view' || $action === 'get_supplier') {
    $id = $_POST['id'] ?? null;
    if (!$id) { echo json_encode(['error' => 'No ID']); exit; }
    try {
        $stmt = $pdo->prepare("SELECT * FROM suppliers WHERE id=? AND EmpID=?");
        $stmt->execute([$id, $empId]);
        $doc = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$doc) {
            echo json_encode(['error' => 'Supplier not found']);
        } else {
            $doc['supplier_id'] = formatSupplierId($doc['id']);
            $doc['Stotal'] = (float)$doc['Stotal'];
            echo json_encode($doc);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
    exit;
}

if ($action === 'add_reminder') {
    parse_str($_POST['data'], $data);
    $stmt = $pdo->prepare("INSERT INTO supplier_reminders (supplier_id, reminder_name, reminder_type, reminder_date, reminder_time, notes) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $data['supplier_id'] ?? '', $data['reminder_name'] ?? '', $data['reminder_type'] ?? '', 
        empty($data['reminder_date']) ? null : $data['reminder_date'], 
        empty($data['reminder_time']) ? null : $data['reminder_time'], 
        $data['notes'] ?? ''
    ]);
    echo json_encode(['status' => 'success']);
    exit;
}

if ($action === 'get_reminders') {
    $supplierId = $_POST['id'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM supplier_reminders WHERE supplier_id=? ORDER BY reminder_date ASC");
    $stmt->execute([$supplierId]);
    $reminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($reminders);
    exit;
}

echo json_encode(['status' => 'error', 'message' => 'Unknown action']);