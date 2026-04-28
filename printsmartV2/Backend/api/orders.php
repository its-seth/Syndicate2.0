<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');


require_once '../config/db_connect.php';


$action = isset($_REQUEST['action']) ? $_REQUEST['action'] : '';

switch ($action) {
    case 'get_orders':
        getOrders($conn);
        break;

    case 'get_customers':
        getCustomers($conn);
        break;

    case 'add_order':
        addOrder($conn);
        break;

    case 'delete_order':
        deleteOrder($conn);
        break;

    case 'get_order_details':
        getOrderDetails($conn);
        break;

    case 'update_order':
        updateOrder($conn);
        break;

    case 'get_monthly_report':
        getMonthlyReport($conn);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

//-----------------------------------------------------------------get order---------------------------------------------------------
function getOrders($conn)
{
    $sql = "SELECT o.*, c.name as customer_name, c.customer_id as customer_code 
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            ORDER BY o.id DESC";
    $result = $conn->query($sql);

    $orders = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
        }
    }

    echo json_encode(['success' => true, 'data' => $orders]);
}



//------------------------------------------------------------add order--------------------------------------------------------------
function addOrder($conn)
{
    if (!isset($_POST['order'])) {
        echo json_encode(['success' => false, 'message' => 'No order data received']);
        return;
    }

    $order = $_POST['order'];

    $customer_id = $order['customer_id'];
    $order_date = $order['order_date'];
    $deadline = $order['deadline'];
    $status = $order['status'];
    $total_amount = $order['total_amount'];
    $order_details = $order['order_details'];

    $customer_id = (int)$customer_id;
    $total_amount = (float)$total_amount;

    
    $max_result = $conn->query("SELECT MAX(CAST(SUBSTRING(order_number, 6) AS UNSIGNED)) as max_number FROM orders");
    $max_row = $max_result->fetch_assoc();
    $max_number = $max_row['max_number'] ?? 0;  
    
    $next_number = $max_number + 1;

    
    if ($next_number < 10) {
        $order_number = "#ORD-00" . $next_number;
    } elseif ($next_number < 100) {
        $order_number = "#ORD-0" . $next_number;
    } else {
        $order_number = "#ORD-" . $next_number;
    }

    $sql = "INSERT INTO orders (customer_id, order_number, order_date, deadline, status, total_amount, order_details) 
            VALUES ($customer_id, '$order_number', '$order_date', '$deadline', '$status', $total_amount, '$order_details')";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Order added successfully',
            'order_number' => $order_number
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to add order: ' . $conn->error
        ]);
    }
}


//--------------------------------------------------------------------delete order--------------------------------------------------------------------------
function deleteOrder($conn)
{
    $order_id = $_POST['id'];

    if ($conn->query("DELETE FROM orders WHERE id = $order_id")) {
        echo json_encode(['success' => true, 'message' => 'Order deleted']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Delete failed: ' . $conn->error]);
    }
}


//------------------------------------------------------------------------------get customers---------------------------------------------------
function getCustomers($conn)
{
    $sql = "SELECT id, name FROM customers ORDER BY name";
    $result = $conn->query($sql);

    $customers = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $customers[] = $row;
        }
    }

    echo json_encode(['success' => true, 'data' => $customers]);
}

//-----------------------------------------------------------------get single order details---------------------------------------------------------
function getOrderDetails($conn)
{
    $order_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($order_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
        return;
    }

    $sql = "SELECT o.*, c.name as customer_name, c.customer_id as customer_code 
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            WHERE o.id = $order_id";

    $result = $conn->query($sql);

    if ($result && $result->num_rows > 0) {
        $order = $result->fetch_assoc();
        echo json_encode(['success' => true, 'data' => $order]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Order not found']);
    }
}

//-----------------------------------------------------------------update order---------------------------------------------------------
function updateOrder($conn)
{
    if (!isset($_POST['order'])) {
        echo json_encode(['success' => false, 'message' => 'No order data received']);
        return;
    }

    $order = $_POST['order'];

    $id = (int)$order['id'];
    $customer_id = (int)$order['customer_id'];
    $order_date = $order['order_date'];
    $deadline = $order['deadline'];
    $status = $order['status'];
    $total_amount = (float)$order['total_amount'];
    $order_details = $conn->real_escape_string($order['order_details']);

    $sql = "UPDATE orders SET 
            customer_id = $customer_id,
            order_date = '$order_date',
            deadline = '$deadline',
            status = '$status',
            total_amount = $total_amount,
            order_details = '$order_details'
            WHERE id = $id";

    if ($conn->query($sql) === TRUE) {
        echo json_encode([
            'success' => true,
            'message' => 'Order updated successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update order: ' . $conn->error
        ]);
    }
}

//-----------------------------------------------------------------get monthly report---------------------------------------------------------
function getMonthlyReport($conn)
{
    $month = isset($_GET['month']) ? (int)$_GET['month'] : 0;
    $year = isset($_GET['year']) ? (int)$_GET['year'] : 0;

    if ($month <= 0 || $month > 12 || $year <= 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid month or year']);
        return;
    }

    
    $start_date = "$year-$month-01";
    $end_date = date("Y-m-t", strtotime($start_date));

    
    $sql = "SELECT o.*, c.name as customer_name, c.customer_id 
            FROM orders o 
            LEFT JOIN customers c ON o.customer_id = c.id 
            WHERE o.order_date BETWEEN '$start_date' AND '$end_date'
            ORDER BY o.order_date DESC";

    $result = $conn->query($sql);
    $orders = [];
    $total_revenue = 0;
    $status_count = ['completed' => 0, 'processing' => 0, 'pending' => 0];
    $customer_totals = [];

    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $orders[] = $row;
            $total_revenue += $row['total_amount'];

            
            $status = strtolower($row['status']);
            if (isset($status_count[$status])) {
                $status_count[$status]++;
            }

            // Track customers
            $customer_id = $row['customer_id'];
            if (!isset($customer_totals[$customer_id])) {
                $customer_totals[$customer_id] = [
                    'name' => $row['customer_name'],
                    'customer_id' => $row['customer_id'],
                    'total_spent' => 0,
                    'order_count' => 0
                ];
            }
            $customer_totals[$customer_id]['total_spent'] += $row['total_amount'];
            $customer_totals[$customer_id]['order_count']++;
        }
    }

    // Calculationssss
    $total_orders = count($orders);
    $avg_order_value = $total_orders > 0 ? $total_revenue / $total_orders : 0;
    $completed_orders = $status_count['completed'];
    $completion_rate = $total_orders > 0 ? round(($completed_orders / $total_orders) * 100, 1) : 0;

    // top 5
    usort($customer_totals, function ($a, $b) {
        return $b['total_spent'] <=> $a['total_spent'];
    });
    $top_customers = array_slice($customer_totals, 0, 5);

    echo json_encode([
        'success' => true,
        'data' => [
            'orders' => $orders,
            'total_orders' => $total_orders,
            'total_revenue' => $total_revenue,
            'avg_order_value' => $avg_order_value,
            'completed_orders' => $completed_orders,
            'completion_rate' => $completion_rate,
            'status_breakdown' => $status_count,
            'top_customers' => array_values($top_customers)
        ]
    ]);
}
?>