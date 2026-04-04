// assets/js/expenses.js
// API paths updated: Backend/api/expenses.php and Backend/api/reminders.php

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    syncWithDB();
});

const API_EXPENSES = '../../Backend/api/expenses.php';
const API_REMINDERS = '../../Backend/api/reminders.php';

const apiPost = (url, payload) => {
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .catch(e => console.warn('API Post failed (Offline mode)', e));
};

const apiDelete = (url, id) => {
    fetch(`${url}?id=${id}`, { method: 'DELETE' }).catch(e => console.warn('API Delete failed (Offline mode)', e));
};

const searchExpenseInput     = document.getElementById('searchExpenseInput');
const btnNotifications       = document.getElementById('btnNotifications');
const backFromRemindersBtn   = document.getElementById('backFromRemindersBtn');
const reminderOverlayModal   = document.getElementById('reminderOverlayModal');
const closeReminderOverlayBtn = document.getElementById('closeReminderOverlayBtn');
const addExpenseBtn          = document.getElementById('addExpenseBtn');
const markAllPaidBtn         = document.getElementById('markAllPaidBtn');
const expenseTableBody       = document.getElementById('expenseTableBody');
const expenseModal           = document.getElementById('expenseModal');
const expenseForm            = document.getElementById('expenseForm');
const modalTitle             = document.getElementById('modalTitle');
const remindersListContainer = document.getElementById('remindersListContainer');
const addReminderBtn         = document.getElementById('addReminderBtn');

let editingId = null, deletingType = null, deletingId = null;

let expenses = [
    { id: 1025, date: '2026-01-02', category: 'Water Bill',       amount: '1250.00', status: 'Pending' },
    { id: 1026, date: '2026-01-20', category: 'Electricity Bill', amount: '800.00',  status: 'Overdue' },
    { id: 1027, date: '2026-01-26', category: 'WIFI Bill',         amount: '120.00',  status: 'Paid'    },
];

let reminders = [
    { id: 2001, date: '2026-10-18', title: 'water bill',   amount: '1200.00', status: 'Overdue',  icon: 'pencil',    reminderOn: true  },
    { id: 2002, date: '2026-10-24', title: 'Electricity',  amount: '45000.00',status: 'Upcoming', icon: 'zap',       reminderOn: true  },
    { id: 2003, date: '2026-11-02', title: 'WIFI',         amount: '8500.00', status: 'Upcoming', icon: 'file-text', reminderOn: false },
];

async function syncWithDB() {
    try {
        const r = await fetch(API_EXPENSES);
        if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) expenses = d; }
    } catch { console.warn('Offline expenses mode'); }
    renderTable();

    try {
        const r = await fetch(API_REMINDERS);
        if (r.ok) { const d = await r.json(); if (Array.isArray(d) && d.length) reminders = d; }
    } catch { console.warn('Offline reminders mode'); }
    renderReminders();
}

const formatDate = d => { const dt = new Date(d); const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return isNaN(dt.getTime()) ? d : `${m[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}`; };
const formatCurrency = a => `LKR ${Number(a).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;

btnNotifications.addEventListener('click', e => { e.preventDefault(); reminderOverlayModal.classList.add('active'); document.body.style.overflow = 'hidden'; });
const closeOverlay = () => { reminderOverlayModal.classList.remove('active'); document.body.style.overflow = ''; };
if (backFromRemindersBtn) backFromRemindersBtn.addEventListener('click', closeOverlay);
if (closeReminderOverlayBtn) closeReminderOverlayBtn.addEventListener('click', closeOverlay);

const renderTable = () => {
    expenseTableBody.innerHTML = '';
    const searchTerm = searchExpenseInput ? searchExpenseInput.value.toLowerCase() : '';
    const filteredExpenses = expenses.filter(expense => 
        expense.category.toLowerCase().includes(searchTerm) || 
        expense.status.toLowerCase().includes(searchTerm) ||
        expense.id.toString().includes(searchTerm) ||
        expense.amount.toString().includes(searchTerm)
    );

    if (!Array.isArray(filteredExpenses) || !filteredExpenses.length) {
        expenseTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-muted);">No expenses found.</td></tr>`;
        return;
    }
    filteredExpenses.forEach(expense => {
        const tr = document.createElement('tr');
        const statusClass = `status-${expense.status.toLowerCase()}`;
        tr.innerHTML = `
            <td><span class="expense-id">#EXP-${expense.id}</span></td>
            <td><div class="category-cell"><div class="category-icon-box"></div><span>${expense.category}</span></div></td>
            <td><span class="amount-text">${formatCurrency(expense.amount)}</span></td>
            <td><span class="date-text">${formatDate(expense.date).replace(',','')}</span></td>
            <td><div class="status-cell-wrapper"><span class="status-pill ${statusClass}"><span class="dot"></span>${expense.status}</span>${expense.status==='Pending'?'<i data-lucide="bell" class="status-bell-alert"></i>':''}</div></td>
            <td><i data-lucide="file-text" class="receipt-icon"></i></td>
            <td><div class="action-btns">
                <button class="action-btn edit" onclick="window.openEditModal(${expense.id})" title="Edit"><i data-lucide="pencil"></i></button>
                <button class="action-btn delete" onclick="window.openDeleteModal('expense',${expense.id})" title="Delete"><i data-lucide="trash-2"></i></button>
            </div></td>`;
        expenseTableBody.appendChild(tr);
    });
    lucide.createIcons();
};

window.toggleReminderStatus = id => {
    reminders = reminders.map(r => { if(r.id===id){const u={...r,reminderOn:!r.reminderOn};apiPost(API_REMINDERS,u);return u;} return r; });
    renderReminders();
};

if (markAllPaidBtn) markAllPaidBtn.addEventListener('click', () => {
    reminders = reminders.map(r => { const u={...r,status:'Upcoming'};apiPost(API_REMINDERS,u);return u; });
    renderReminders();
});

const renderReminders = () => {
    remindersListContainer.innerHTML = '';
    if (!Array.isArray(reminders) || !reminders.length) { remindersListContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No pending bills.</p>'; return; }

    const today = new Date();
    today.setHours(0,0,0,0);

    const sortedReminders = [...reminders].sort((a,b) => new Date(a.date) - new Date(b.date));

    sortedReminders.forEach(r => {
        const rDate = new Date(r.date);
        if (rDate < today && r.status !== 'Paid' && r.status !== 'Overdue') {
            r.status = 'Overdue';
        }

        const isOverdue = r.status === 'Overdue';
        remindersListContainer.insertAdjacentHTML('beforeend', `
            <div class="reminder-card ${isOverdue?'card-red':'card-blue'}">
                <div class="card-left"><div class="card-icon"><i data-lucide="${r.icon}"></i></div></div>
                <div class="card-middle">
                    <div class="card-title-row"><h4>${r.title}</h4><span class="status-pill-small ${isOverdue?'pill-red':'pill-blue'}">${r.status.toUpperCase()}</span></div>
                    <div class="card-due">Due: ${formatDate(r.date)}</div>
                    <div class="card-amount">${formatCurrency(r.amount)}</div>
                </div>
                <div class="card-right">
                    <label class="toggle-switch">
                        <input type="checkbox" onchange="window.toggleReminderStatus(${r.id})" ${r.reminderOn?'checked':''}>
                        <span class="slider round"></span>
                    </label>
                    <span class="toggle-label">${r.reminderOn?'REMINDER ON':'REMINDER OFF'}</span>
                </div>
            </div>`);
    });
    lucide.createIcons();
};

const openModal = m => m.classList.add('active');
const closeAllModals = () => {
    expenseModal.classList.remove('active');
    const rm = document.getElementById('reminderModal');
    if (rm) rm.classList.remove('active');
    document.getElementById('deleteModal').classList.remove('active');
    expenseForm.reset();
    const rf = document.getElementById('reminderForm');
    if (rf) rf.reset();
    editingId = deletingType = deletingId = null;
};

document.querySelectorAll('.close-modal, .close-delete-modal').forEach(btn => btn.addEventListener('click', closeAllModals));

window.openEditModal = id => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
        document.getElementById('expenseCategory').value = expense.category;
        document.getElementById('expenseAmount').value   = expense.amount;
        document.getElementById('expenseDate').value     = expense.date;
        document.getElementById('expenseStatus').value   = expense.status;
        editingId = id; modalTitle.textContent = 'Update Expense';
        openModal(expenseModal);
    }
};

window.openDeleteModal = (type, id) => { deletingType = type; deletingId = id; openModal(document.getElementById('deleteModal')); };

expenseForm.addEventListener('submit', e => {
    e.preventDefault();
    const amountVal = parseFloat(document.getElementById('expenseAmount').value);
    const newExpense = {
        id: editingId || Math.floor(1000 + Math.random() * 9000),
        category: document.getElementById('expenseCategory').value,
        amount: isNaN(amountVal) ? '0.00' : amountVal.toFixed(2),
        date: document.getElementById('expenseDate').value,
        status: document.getElementById('expenseStatus').value,
    };
    if (editingId) expenses = expenses.map(e => e.id === editingId ? newExpense : e);
    else expenses.unshift(newExpense);
    closeAllModals(); renderTable();
    apiPost(API_EXPENSES, newExpense);
});

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (deletingId) {
        if (deletingType === 'expense') { expenses = expenses.filter(e => e.id !== deletingId); apiDelete(API_EXPENSES, deletingId); closeAllModals(); renderTable(); }
        else { reminders = reminders.filter(e => e.id !== deletingId); apiDelete(API_REMINDERS, deletingId); closeAllModals(); renderReminders(); }
    }
});

if (addExpenseBtn) addExpenseBtn.addEventListener('click', () => { editingId = null; modalTitle.textContent = 'Add New Expense'; expenseForm.reset(); openModal(expenseModal); });
if (addReminderBtn) addReminderBtn.addEventListener('click', () => {
    editingId = null;
    const rt = document.getElementById('modalTitleReminder');
    if (rt) rt.textContent = 'Add New Reminder';
    const rf = document.getElementById('reminderForm');
    if (rf) rf.reset();
    const rm = document.getElementById('reminderModal');
    if (rm) openModal(rm);
});

if (searchExpenseInput) {
    searchExpenseInput.addEventListener('input', renderTable);
}

const generateReportBtn = document.getElementById('generateReportBtn');
if (generateReportBtn) {
    generateReportBtn.addEventListener('click', () => {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('PDF library is loading or failed to load. Please try again.');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text("PrintSmart - Expense Report", 14, 20);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
        
        const searchTerm = searchExpenseInput ? searchExpenseInput.value.toLowerCase() : '';
        const filteredExpenses = expenses.filter(expense => 
            expense.category.toLowerCase().includes(searchTerm) || 
            expense.status.toLowerCase().includes(searchTerm) ||
            expense.id.toString().includes(searchTerm) ||
            expense.amount.toString().includes(searchTerm)
        );

        let totalExpensesAmount = 0;
        let categoryTotals = {};
        let statusTotals = {};

        filteredExpenses.forEach(e => {
            const amt = parseFloat(e.amount) || 0;
            totalExpensesAmount += amt;
            if (!categoryTotals[e.category]) categoryTotals[e.category] = 0;
            categoryTotals[e.category] += amt;
            if (!statusTotals[e.status]) statusTotals[e.status] = 0;
            statusTotals[e.status] += amt;
        });

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Expense Analysis Summary", 14, 40);

        doc.setFontSize(11);
        doc.text(`Total Expense Amount: ${formatCurrency(totalExpensesAmount)}`, 14, 48);

        const categoryData = Object.keys(categoryTotals).map(cat => [cat, formatCurrency(categoryTotals[cat])]);
        doc.autoTable({
            head: [['Category Breakdown', 'Total Amount']],
            body: categoryData,
            startY: 55,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [46, 204, 113] }
        });

        let finalY = doc.lastAutoTable.finalY || 55;

        const statusData = Object.keys(statusTotals).map(st => [st, formatCurrency(statusTotals[st])]);
        doc.autoTable({
            head: [['Status Breakdown', 'Total Amount']],
            body: statusData,
            startY: finalY + 10,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [243, 156, 18] }
        });

        finalY = doc.lastAutoTable.finalY || (finalY + 10);

        doc.setFontSize(14);
        doc.text("Expense Details", 14, finalY + 15);

        const tableBody = filteredExpenses.map(e => [
            `#EXP-${e.id}`, 
            e.category, 
            formatCurrency(e.amount),
            formatDate(e.date).replace(',', ''), 
            e.status
        ]);
        
        doc.autoTable({
            head: [['Expense ID', 'Category', 'Amount', 'Date', 'Status']],
            body: tableBody,
            startY: finalY + 20,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 4 },
            headStyles: { fillColor: [30, 64, 175] }
        });

        if (Array.isArray(reminders) && reminders.length > 0) {
            let nextY = doc.lastAutoTable.finalY + 15;
            if (nextY > 270) { doc.addPage(); nextY = 20; }

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Upcoming & Pending Reminders", 14, nextY);

            const sortedReminders = [...reminders].sort((a,b) => new Date(a.date) - new Date(b.date));
            const remindersBody = sortedReminders.map(r => [
                r.title, 
                formatCurrency(r.amount),
                formatDate(r.date).replace(',', ''), 
                r.status.toUpperCase()
            ]);

            doc.autoTable({
                head: [['Reminder / Bill', 'Amount', 'Due Date', 'Status']],
                body: remindersBody,
                startY: nextY + 5,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 4 },
                headStyles: { fillColor: [231, 76, 60] }
            });
        }
        
        doc.save("PrintSmart_Expense_Report.pdf");
    });
}
