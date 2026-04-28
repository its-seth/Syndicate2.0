<?php
// Backend/reports/suppliers.php
session_start();
require_once __DIR__ . '/../config/db_connect.php';

$empId = (int) ($_SESSION['EmpID'] ?? 1);

// Fetch all suppliers for this employee
$stmt = $pdo->prepare("SELECT * FROM suppliers WHERE EmpID = ? ORDER BY SName ASC");
$stmt->execute([$empId]);
$suppliers = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Calculating processed data
$totalOutstanding = 0;
$supplyTypeCount = [];
$overdueCount = 0;
$upcomingCount = 0;
$today = date('Y-m-d');

foreach ($suppliers as &$s) {
    $totalOutstanding += (float)$s['Stotal'];
    $type = $s['supply_type'] ?: 'Other';
    $supplyTypeCount[$type] = ($supplyTypeCount[$type] ?? 0) + 1;
    
    if ($s['SDueDate']) {
        if ($s['SDueDate'] < $today) $overdueCount++;
        else $upcomingCount++;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supplier Report - PrintSmart</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" integrity="sha512-GsLlZN/3F2ErC5ifS5QtgpiJtWd43JWSuIgh7mbzZ8zBps+dvLusV+eNQATqgA/HdeKFVgA5v3S/cIrLF7QnIg==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    
    
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #F8FAFC;
            padding: 40px;
            color: #1E293B;
        }
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.05);
            padding: 32px;
        }
        h1 {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .subtitle {
            color: #64748B;
            margin-bottom: 32px;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 16px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .stat-card {
            background: #F1F5F9;
            border-radius: 20px;
            padding: 20px;
            text-align: center;
        }
        .stat-card h3 {
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            margin-bottom: 8px;
        }
        .stat-card .value {
            font-size: 32px;
            font-weight: 800;
            color: #0C4EA3;
        }
        .charts-row {
            display: flex;
            flex-wrap: wrap;
            gap: 30px;
            margin-bottom: 40px;
        }
        .chart-box {
            flex: 1;
            min-width: 250px;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 20px;
            padding: 20px;
        }
        .chart-box h3 {
            margin-bottom: 20px;
            font-size: 18px;
            font-weight: 600;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #E2E8F0;
        }
        th {
            background: #F8FAFC;
            font-weight: 600;
            color: #475569;
        }
        .btn-group {
            margin-top: 32px;
            display: flex;
            gap: 16px;
            justify-content: flex-end;
        }
        .btn {
            padding: 10px 24px;
            border-radius: 40px;
            font-weight: 600;
            cursor: pointer;
            border: none;
            transition: 0.2s;
        }
        .btn-primary {
            background: #0C4EA3;
            color: white;
        }
        .btn-primary:hover {
            background: #093b7b;
        }
        .btn-secondary {
            background: #E2E8F0;
            color: #1E293B;
        }
        .btn-secondary:hover {
            background: #CBD5E1;
        }
        footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #94A3B8;
        }
        @media print {
            .btn-group { display: none; }
            body { padding: 0; background: white; }
            .report-container { box-shadow: none; padding: 20px; }
        }
    </style>



</head>
<body>
<div class="report-container" id="reportContent">
    <h1>
        <i class="fas fa-truck" style="color:#0C4EA3;"></i>
        Supplier Performance Report
    </h1>
    <div class="subtitle">Generated on: <?php echo date('F j, Y, g:i a'); ?></div>

    <!-- Statistics Cards -->
    <div class="stats-grid">
        <div class="stat-card">
            <h3>Total Suppliers</h3>
            <div class="value"><?php echo count($suppliers); ?></div>
        </div>
        <div class="stat-card">
            <h3>Total Outstanding (LKR)</h3>
            <div class="value"><?php echo number_format($totalOutstanding, 2); ?></div>
        </div>
        <div class="stat-card">
            <h3>Overdue Payments</h3>
            <div class="value" style="color:#EF4444;"><?php echo $overdueCount; ?></div>
        </div>
        <div class="stat-card">
            <h3>Upcoming Due Dates</h3>
            <div class="value" style="color:#10B981;"><?php echo $upcomingCount; ?></div>
        </div>
    </div>

    <!-- Charts -->
    <div class="charts-row">
        <div class="chart-box">
            <h3>Supplies by Type</h3>
            <canvas id="supplyChart" style="max-height: 250px;"></canvas>
        </div>
        <div class="chart-box">
            <h3>Payment Status (Due Dates)</h3>
            <canvas id="dueChart" style="max-height: 250px;"></canvas>
        </div>
    </div>

    <!-- Supplier Details Table -->
    <h3 style="margin-top: 20px;">Supplier Details</h3>
    <div style="overflow-x: auto;">
         <table id="supplierTable">
            <thead>
                <tr><th>ID</th><th>Name</th><th>Supplies</th><th>Contact</th><th>Total (LKR)</th><th>Due Date</th></tr>
            </thead>
            <tbody>
                <?php foreach ($suppliers as $s): ?>
                <tr>
                    <td><?php echo '#SUP-' . str_pad($s['id'], 3, '0', STR_PAD_LEFT); ?></td>
                    <td><?php echo htmlspecialchars($s['SName']); ?></td>
                    <td><?php echo htmlspecialchars($s['supply_type']); ?></td>
                    <td><?php echo htmlspecialchars($s['SContact_No']); ?></td>
                    <td>LKR <?php echo number_format($s['Stotal'], 2); ?></td>
                    <td><?php echo $s['SDueDate'] ? date('M d, Y', strtotime($s['SDueDate'])) : 'N/A'; ?></td>
                </tr>
                <?php endforeach; ?>
                <?php if (empty($suppliers)): ?>
                <tr><td colspan="6" style="text-align:center;">No suppliers found.</td></tr>
                <?php endif; ?>
            </tbody>
         </table>
    </div>
</div>

<div class="btn-group">
    <button class="btn btn-secondary" onclick="window.close();">Close</button>
    <button class="btn btn-primary" id="downloadPDFBtn"><i class="fas fa-download"></i> Download as PDF</button>
</div>
<footer>PrintSmart Management System – Supplier Report</footer>

<script>
    // Prepare data for charts
    const supplyLabels = <?php echo json_encode(array_keys($supplyTypeCount)); ?>;
    const supplyData = <?php echo json_encode(array_values($supplyTypeCount)); ?>;

    const dueLabels = ['Overdue', 'Upcoming'];
    const dueData = [<?php echo $overdueCount; ?>, <?php echo $upcomingCount; ?>];

    // Bar chart for supplies
    const ctx1 = document.getElementById('supplyChart').getContext('2d');
    new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: supplyLabels,
            datasets: [{
                label: 'Number of Suppliers',
                data: supplyData,
                backgroundColor: '#3B82F6',
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' } }
        }
    });

    // Pie chart for due dates
    const ctx2 = document.getElementById('dueChart').getContext('2d');
    new Chart(ctx2, {
        type: 'pie',
        data: {
            labels: dueLabels,
            datasets: [{
                data: dueData,
                backgroundColor: ['#EF4444', '#10B981'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });

    // PDF download using html2pdf
    document.getElementById('downloadPDFBtn').addEventListener('click', function() {
        const element = document.getElementById('reportContent');
        const opt = {
            margin:        [0.5, 0.5, 0.5, 0.5],
            filename:     'supplier_report_' + new Date().toISOString().slice(0,19) + '.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { scale: 2, letterRendering: true },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    });
</script>
</body>
</html>