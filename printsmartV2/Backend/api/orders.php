<?php
// Backend/api/orders.php — Orders API (MySQL)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit(0); }

require_once __DIR__ . '/../config/db_connect.php';

$action = $_REQUEST['action'] ?? '';


switch ($action) {
    case 'get_orders':  
        getOrders($pdo);    
        break;

    case 'get_customers': 
        getCustomers($pdo); 
        break;

    case 'add_order':     
        addOrder($pdo);     
        break;

    case 'delete_order':  
        deleteOrder($pdo);  
        break;

    default: 
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function getOrders($pdo): void {
    $sql = "SELECT o.*, c.name as customer_name, c.customer_id as customer_code 
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            ORDER BY o.id DESC";
    $stmt = $pdo->query($sql);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    
    
    echo json_encode(['success' => true, 'data' => $orders]);
}

function addOrder($pdo): void {
    if (!isset($_POST['order'])) { echo json_encode(['success' => false, 'message' => 'No order data received']); return; }
    $order        = $_POST['order'];
    $customerId   = $order['customer_id']    ?? null;
    $order_date   = empty($order['order_date']) ? null : $order['order_date'];
    $deadline     = empty($order['deadline']) ? null : $order['deadline'];
    $status       = $order['status']         ?? 'Pending';
    $total_amount = (float) ($order['total_amount'] ?? 0);
    $order_details = $order['order_details'] ?? '';
    
    $stmt = $pdo->query("SELECT COUNT(id) FROM orders");
    $count = $stmt->fetchColumn();
    $order_number = '#ORD-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
    
    $sql = "INSERT INTO orders (customer_id, order_number, order_date, deadline, status, total_amount, order_details) 
            VALUES (?, ?, ?, ?, ?, ?, ?)";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$customerId, $order_number, $order_date, $deadline, $status, $total_amount, $order_details]);
    
    echo json_encode(['success' => true, 'message' => 'Order added successfully']);
}

function deleteOrder($pdo): void {
    $id = $_POST['id'] ?? null;
    if (!$id) { echo json_encode(['success' => false, 'message' => 'No ID provided']); return; }
    try {
        $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(['success' => true, 'message' => 'Order deleted']);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Delete failed: ' . $e->getMessage()]);
    }
}

function getCustomers($pdo): void {
    $stmt = $pdo->query("SELECT id, name, customer_id FROM customers ORDER BY name ASC");
    $customers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'data' => $customers]);
}
