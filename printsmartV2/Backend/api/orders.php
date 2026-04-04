<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');


require_once '../config/db_connect.php';

//action req
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

    $count_result = $conn->query("SELECT COUNT(*) as total FROM orders");
    $count_row = $count_result->fetch_assoc();
    $order_count = $count_row['total'];

    $next_number = $order_count + 1;

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
        
        $new_id = $conn->insert_id;

        echo json_encode([
            'success' => true,
            'message' => 'Order added successfully',
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


?>