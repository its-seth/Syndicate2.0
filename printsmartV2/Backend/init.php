<?php
// Backend/init.php — One-time database seeder for MySQL. Run once to create tables and seed data.
// Visit: http://localhost/PrintSmart/Backend/init.php

require_once __DIR__ . '/config/db_connect.php';

echo "<h2>PrintSmart — MySQL Auto-Setup & Seeder</h2>";
echo "<p>Connected to database: <strong>printsmart_db</strong></p><hr>";

try {
    // 1. Employees Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        emp_id_str VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150),
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        role VARCHAR(100),
        salary DECIMAL(10,2),
        additional_details TEXT,
        reg_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 2. Customers Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        address TEXT,
        email VARCHAR(150),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 3. Orders Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        customer_id INT,
        order_number VARCHAR(30) UNIQUE NOT NULL,
        order_date DATE,
        deadline DATE,
        status VARCHAR(50) DEFAULT 'Pending',
        total_amount DECIMAL(10,2) DEFAULT 0.00,
        order_details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
    )");

    // 4. Suppliers Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS suppliers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        EmpID INT DEFAULT 1,
        SName VARCHAR(150) NOT NULL,
        SEmail VARCHAR(150),
        SContact_No VARCHAR(20),
        SAddress TEXT,
        supply_type VARCHAR(100),
        supply_details TEXT,
        Stotal DECIMAL(10,2) DEFAULT 0.00,
        SDueDate DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 5. Supplier Reminders Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS supplier_reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        supplier_id INT NOT NULL,
        reminder_name VARCHAR(150),
        reminder_type VARCHAR(100),
        reminder_date DATE,
        reminder_time TIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    )");

    // 6. Expenses Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expense_id VARCHAR(30) NOT NULL UNIQUE,
        category VARCHAR(100),
        amount DECIMAL(10,2) DEFAULT 0.00,
        date DATE,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    // 7. Expense Reminders Table
    $pdo->exec("CREATE TABLE IF NOT EXISTS expense_reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reminder_id INT NOT NULL UNIQUE,
        title VARCHAR(150),
        amount DECIMAL(10,2) DEFAULT 0.00,
        date DATE,
        status VARCHAR(50),
        icon VARCHAR(50),
        reminderOn TINYINT(1) DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");

    echo "✅ Database tables checked/created successfully.<br>";

    // ----- SEED DATA -----
    
    // Seed Employees
    $stmt = $pdo->query("SELECT COUNT(*) FROM employees");
    if ($stmt->fetchColumn() == 0) {
        $st = $pdo->prepare("INSERT INTO employees (emp_id_str, name, email, phone, role, salary) VALUES (?,?,?,?,?,?)");
        $st->execute(['#EM-001', 'John Doe', 'JD@gmail.com', '0771234567', 'Graphic Designer', 5000.00]);
        $st->execute(['#EM-002', 'Alice Smith', 'As@gmail.com', '0714586324', 'Press Operator', 4000.00]);
        $st->execute(['#EM-003', 'Mark Brown', 'MB@gmail.com', '0753851475', 'Account Manager', 6000.00]);
        echo "✅ Employees: 3 default records seeded.<br>";
    } else {
        echo "ℹ️ Employees: already has data — skipped.<br>";
    }

    echo "<hr><p>✅ <strong>Done!</strong> You can now open the app.</p>";
    echo "<p><a href='../Frontend/index.html'>→ Open Dashboard</a></p>";

} catch (PDOException $e) {
    echo "<h3>❌ Error during initialization:</h3>";
    echo "<p style='color:red'>" . $e->getMessage() . "</p>";
}
?>
