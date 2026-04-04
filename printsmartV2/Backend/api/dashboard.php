<?php
// Backend/api/dashboard.php — Dashboard data
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/../config/db_connect.php';

try {
    $data = ['success' => true];

    // Customers Count
    $stmt = $pdo->query("SELECT COUNT(*) FROM customers");
    $data['customers'] = (int) $stmt->fetchColumn();

    // Suppliers Count
    $stmt = $pdo->query("SELECT COUNT(*) FROM suppliers");
    $data['suppliers'] = (int) $stmt->fetchColumn();

    // Employees Count
    $stmt = $pdo->query("SELECT COUNT(*) FROM employees");
    $data['employees'] = (int) $stmt->fetchColumn();

    // Expenses Stats
    $stmt = $pdo->query("SELECT SUM(amount) as total FROM expenses");
    $data['expenses'] = [
        'total' => (float) $stmt->fetchColumn()
    ];

    // Orders Stats
    $stmt = $pdo->query("SELECT COUNT(*) as count, SUM(total_amount) as revenue FROM orders");
    $orderStats = $stmt->fetch(PDO::FETCH_ASSOC);
    $data['orders'] = [
        'count' => (int) $orderStats['count'],
        'revenue' => (float) $orderStats['revenue']
    ];

    // Recent Orders (limit 3)
    $stmt = $pdo->query("
        SELECT o.order_number, c.name as customer_name, o.order_details, o.total_amount, o.status 
        FROM orders o 
        LEFT JOIN customers c ON o.customer_id = c.id 
        ORDER BY o.id DESC LIMIT 4
    ");
    $data['recent_orders'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Recent Transactions/Expenses (limit 3)
    $stmt = $pdo->query("
        SELECT expense_id, category, amount, date, status 
        FROM expenses 
        ORDER BY id DESC LIMIT 4
    ");
    $data['recent_expenses'] = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($data);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
