<?php
// supp_report.php — Printable supplier report (MongoDB)
require_once 'config.php';
// $db and $_SESSION['EmpID'] available

use MongoDB\BSON\ObjectId;

$empId   = (int) $_SESSION['EmpID'];
$cursor  = $db->suppliers->find(
    ['EmpID' => $empId],
    ['sort' => ['SName' => 1]]
);
$suppliers = iterator_to_array($cursor);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Supplier Report - PrintSmart</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1   { color: #1e293b; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
        th { background: #f1f5f9; }
        @media print { .no-print { display: none; } }
        .no-print { margin-top: 20px; }
        button { padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; margin-right: 8px; }
    </style>
</head>
<body>
    <h1>Supplier Report</h1>
    <p>Generated on: <?php echo date('Y-m-d H:i:s'); ?></p>
    <table>
        <thead>
            <tr>
                <th>Supplier ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Supplies</th>
                <th>Total (LKR)</th>
                <th>Due Date</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($suppliers as $row): ?>
            <tr>
                <td>#SUP-<?php echo htmlspecialchars((string) $row['_id']); ?></td>
                <td><?php echo htmlspecialchars($row['SName']       ?? ''); ?></td>
                <td><?php echo htmlspecialchars($row['SEmail']      ?? ''); ?></td>
                <td><?php echo htmlspecialchars($row['SContact_No'] ?? ''); ?></td>
                <td><?php echo htmlspecialchars($row['SAddress']    ?? ''); ?></td>
                <td><?php echo htmlspecialchars($row['supply_type'] ?? ''); ?></td>
                <td><?php echo number_format((float) ($row['Stotal'] ?? 0), 2); ?></td>
                <td><?php echo htmlspecialchars($row['SDueDate']    ?? ''); ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    <div class="no-print">
        <button onclick="window.print();">Print Report</button>
        <button onclick="window.close();">Close</button>
    </div>
</body>
</html>