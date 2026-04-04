-- 1. Create the Database
CREATE DATABASE IF NOT EXISTS `printsmart_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `printsmart_db`;

-- 2. Employees Table
CREATE TABLE IF NOT EXISTS `employees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `emp_id_str` VARCHAR(20) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(150),
    `phone` VARCHAR(20) NOT NULL,
    `address` TEXT,
    `role` VARCHAR(100),
    `salary` DECIMAL(10,2),
    `additional_details` TEXT,
    `reg_date` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS `customers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` VARCHAR(20) NOT NULL UNIQUE,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `address` TEXT,
    `email` VARCHAR(150),
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS `orders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `customer_id` INT,
    `order_number` VARCHAR(30) UNIQUE NOT NULL,
    `order_date` DATE,
    `deadline` DATE,
    `status` VARCHAR(50) DEFAULT 'Pending',
    `total_amount` DECIMAL(10,2) DEFAULT 0.00,
    `order_details` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE
);


-- 5. Suppliers Table
CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `EmpID` INT DEFAULT 1,
    `SName` VARCHAR(150) NOT NULL,
    `SEmail` VARCHAR(150),
    `SContact_No` VARCHAR(20),
    `SAddress` TEXT,
    `supply_type` VARCHAR(100),
    `supply_details` TEXT,
    `Stotal` DECIMAL(10,2) DEFAULT 0.00,
    `SDueDate` DATE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Supplier Reminders Table
CREATE TABLE IF NOT EXISTS `supplier_reminders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `supplier_id` INT NOT NULL,
    `reminder_name` VARCHAR(150),
    `reminder_type` VARCHAR(100),
    `reminder_date` DATE,
    `reminder_time` TIME,
    `notes` TEXT,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`supplier_id`) REFERENCES `suppliers`(`id`) ON DELETE CASCADE
);

-- 7. Expenses Table
CREATE TABLE IF NOT EXISTS `expenses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `expense_id` VARCHAR(30) NOT NULL UNIQUE,
    `category` VARCHAR(100),
    `amount` DECIMAL(10,2) DEFAULT 0.00,
    `date` DATE,
    `status` VARCHAR(50) DEFAULT 'Pending',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 8. Expense Reminders Table
CREATE TABLE IF NOT EXISTS `expense_reminders` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `reminder_id` INT NOT NULL UNIQUE,
    `title` VARCHAR(150),
    `amount` DECIMAL(10,2) DEFAULT 0.00,
    `date` DATE,
    `status` VARCHAR(50),
    `icon` VARCHAR(50),
    `reminderOn` TINYINT(1) DEFAULT 1,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 9. Insert Dummy Data (Employees)
INSERT INTO `employees` (`emp_id_str`, `name`, `email`, `phone`, `role`, `salary`) VALUES 
('#EM-001', 'John Doe', 'JD@gmail.com', '0771234567', 'Graphic Designer', 5000.00),
('#EM-002', 'Alice Smith', 'As@gmail.com', '0714586324', 'Press Operator', 4000.00),
('#EM-003', 'Mark Brown', 'MB@gmail.com', '0753851475', 'Account Manager', 6000.00);
