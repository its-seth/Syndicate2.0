PrintSmart Management System
PrintSmart is a comprehensive, web-based management system tailored for printing shops. It streamlines daily operations by centralizing order tracking, customer relationships, supplier management, employee administration, and expense logging into a single, unified dashboard.

🚀 Key Features


Dashboard Analytics: Get an instant overview of recent orders, recent transactions, and aggregate business stats.
Order Management: Track customer printing orders, order details, totals, and payment status seamlessly.
Customer Management: Maintain a directory of clients for easy access to their contact details.
Supplier Management: Monitor suppliers, track consumable stock amounts, and manage payment deadlines.
Employee Management: Organize staff roles, designations, salaries, and contact details centrally.
Expense Management: Log printing shop expenses, categorize them, and keep track of pending bills or receipts.



💻 Technology Stack
Frontend: HTML5, CSS3, JavaScript. Features a completely bespoke, modern design system utilizing CSS variables and flexbox for a cleanly unified, premium layout.
Backend: PHP (8.x) structured to offer modular RESTful APIs that return JSON.
Database: MySQL (accessed strictly via PHP PDO for secure, prepared SQL queries).
Environment: Designed to run seamlessly on a WAMP64 or any standard Apache server environment.
📂 Project Structure
PrintSmart/
├── Frontend/             # Sub-pages and client-side logic
│   ├── index.html        # Main Application Dashboard
│   ├── pages/            # Modules (orders.html, customers.html, etc.)
│   └── assets/           
│       ├── css/          # global.css and module-specific stylesheets
│       └── js/           # API fetching and DOM manipulation
│
└── Backend/              # Server-side PHP scripts
    ├── api/              # API endpoints to handle database CRUD operations
    └── config/           # Database connection handling (db_connect.php)

	
🛠️ Setup Instructions (Local Environment)
To run this project locally on your machine:

Environment Setup: Ensure you have WAMP (or XAMPP/MAMP) installed and actively running.
Repository Placement: Place this project folder exactly inside your WAMP server's web root (C:\wamp64\www\PrintSmart).
Database Configuration:
Start your MySQL service via your WAMP control panel.
Open phpMyAdmin and create a MySQL database (ensure the name matches what is required in Backend/config/db_connect.php).
Make sure you run the appropriate DB migration SQL files for your users, orders, suppliers, expenses, and customers tables.
Run Application: Access the system by pointing your web browser to:
http://localhost/PrintSmart/Frontend/index.html

🎨 Theme & Design
The project features a highly unified, responsive visual language initialized via a streamlined CSS approach:

Unified Foundation (global.css): Centralizes brand colors, sidebars, top headers, modal designs, and table aesthetics.
Fast & Modern Aesthetic: Employs the Inter font family and clean, standard inline SVGs for maximum crispness and reduced external dependencies.
