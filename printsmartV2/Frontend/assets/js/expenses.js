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

function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    if (isError) toast.classList.add('error');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function escapeJsString(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

function formatExpenseId(id) {
    return `#EXP-${String(id).padStart(3, '0')}`;
}

let expenses = [];

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
            <td class="id-color">${formatExpenseId(expense.id)}</td>
            <td><div class="category-cell"><span>${expense.category}</span></div></td>
            <td><span class="amount-text">${formatCurrency(expense.amount)}</span></td>
            <td><span class="date-text">${formatDate(expense.date).replace(',','')}</span></td>
            <td><div class="status-cell-wrapper"><span class="status-pill ${statusClass}">${expense.status.toUpperCase()}</span></div></td>
            <td class="actions"><div class="action-btns">
                <i class="fa-regular fa-eye action-view" onclick="window.openViewModal(${expense.id})" title="View" style="cursor:pointer;"></i>
                <i class="fa-regular fa-pen-to-square action-edit" onclick="window.openEditModal(${expense.id})" title="Edit"></i>
                <i class="fa-regular fa-trash-can action-delete" onclick="window.openDeleteModal('expense', ${expense.id}, '${escapeJsString(expense.category)}')" title="Delete"></i>
            </div></td>`;
        expenseTableBody.appendChild(tr);
    });
    lucide.createIcons();
};

window.toggleReminderStatus = id => {
    expenses = expenses.map(e => { 
        if(e.id===id){
            const u={...e, reminderOn: e.reminderOn === false ? true : false};
            apiPost(API_EXPENSES, u);
            return u;
        } 
        return e; 
    });
    renderReminders();
    showToast('✅ Reminder updated successfully');
};

if (markAllPaidBtn) markAllPaidBtn.addEventListener('click', () => {
    expenses = expenses.map(e => { 
        if(e.status !== 'Paid'){
            const u={...e, status: 'Paid'};
            apiPost(API_EXPENSES, u);
            return u;
        }
        return e;
    });
    renderTable();
    renderReminders();
    showToast('✅ All reminders marked as paid');
});

const renderReminders = () => {
    if (!remindersListContainer) return;
    remindersListContainer.innerHTML = '';
    
    const pendingExpenses = expenses.filter(e => e.status !== 'Paid');

    if (!Array.isArray(pendingExpenses) || !pendingExpenses.length) { 
        remindersListContainer.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">No pending bills.</p>'; 
        return; 
    }

    const today = new Date();
    today.setHours(0,0,0,0);

    const sortedReminders = [...pendingExpenses].sort((a,b) => new Date(a.date) - new Date(b.date));

    sortedReminders.forEach(r => {
        const rDate = new Date(r.date);
        if (rDate < today && r.status !== 'Paid' && r.status !== 'Overdue') {
            r.status = 'Overdue';
        }

        const isOverdue = r.status === 'Overdue';
        const isReminderOn = r.reminderOn !== false; // Default to true

        remindersListContainer.insertAdjacentHTML('beforeend', `
            <div class="reminder-card ${isOverdue?'card-red':'card-blue'}">
                <div class="card-left"><div class="card-icon"><i data-lucide="bell"></i></div></div>
                <div class="card-middle">
                    <div class="card-title-row"><h4>${escapeJsString(r.category)}</h4><span class="status-pill-small ${isOverdue?'pill-red':'pill-blue'}">${r.status.toUpperCase()}</span></div>
                    <div class="card-due">Due: ${formatDate(r.date)}</div>
                    <div class="card-amount">${formatCurrency(r.amount)}</div>
                </div>
                <div class="card-right">
                    <label class="toggle-switch">
                        <input type="checkbox" onchange="window.toggleReminderStatus(${r.id})" ${isReminderOn?'checked':''}>
                        <span class="slider round"></span>
                    </label>
                    <span class="toggle-label">${isReminderOn?'REMINDER ON':'REMINDER OFF'}</span>
                </div>
            </div>`);
    });
    if (window.lucide) window.lucide.createIcons();
};

const openModal = m => m.classList.add('active');
const closeAllModals = () => {
    expenseModal.classList.remove('active');
    const rm = document.getElementById('reminderModal');
    if (rm) rm.classList.remove('active');
    document.getElementById('deleteModal').classList.remove('active');
    const vm = document.getElementById('viewModal');
    if (vm) vm.classList.remove('active');
    expenseForm.reset();
    const rf = document.getElementById('reminderForm');
    if (rf) rf.reset();
    editingId = deletingType = deletingId = null;
};

document.querySelectorAll('.close-modal, .close-delete-modal, .close-view-modal').forEach(btn => btn.addEventListener('click', closeAllModals));

window.openViewModal = id => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
        document.getElementById('viewExpenseId').textContent = formatExpenseId(expense.id);
        document.getElementById('viewExpenseCategory').textContent = expense.category;
        document.getElementById('viewExpenseAmount').textContent = formatCurrency(expense.amount);
        document.getElementById('viewExpenseDate').textContent = formatDate(expense.date).replace(',', '');
        const statusEl = document.getElementById('viewExpenseStatus');
        statusEl.textContent = expense.status.toUpperCase();
        statusEl.className = `status-pill status-${expense.status.toLowerCase()}`;
        openModal(document.getElementById('viewModal'));
    }
};

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

window.openDeleteModal = (type, id, title = '') => { 
    deletingType = type; 
    deletingId = id; 
    const msg = document.getElementById('deleteMessage');
    if (msg) msg.textContent = title ? `Are you sure you want to delete "${title}"?` : 'Are you sure you want to delete this expense?';
    openModal(document.getElementById('deleteModal')); 
};

expenseForm.addEventListener('submit', e => {
    e.preventDefault();
    const amountVal = parseFloat(document.getElementById('expenseAmount').value);
    const newId = expenses.length > 0 ? Math.max(...expenses.map(e => parseInt(e.id) || 0)) + 1 : 1;
    const newExpense = {
        id: editingId || newId,
        category: document.getElementById('expenseCategory').value,
        amount: isNaN(amountVal) ? '0.00' : amountVal.toFixed(2),
        date: document.getElementById('expenseDate').value,
        status: document.getElementById('expenseStatus').value,
    };
    if (editingId) {
        expenses = expenses.map(e => e.id === editingId ? newExpense : e);
        showToast('✅ Expense updated successfully');
    } else {
        expenses.unshift(newExpense);
        showToast('✅ Expense added successfully');
    }
    closeAllModals(); 
    renderTable();
    renderReminders();
    apiPost(API_EXPENSES, newExpense);
});

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
    if (deletingId) {
        if (deletingType === 'expense') { 
            expenses = expenses.filter(e => e.id !== deletingId); apiDelete(API_EXPENSES, deletingId); closeAllModals(); renderTable(); 
            showToast('✅ Expense deleted successfully');
        } else { 
            reminders = reminders.filter(e => e.id !== deletingId); apiDelete(API_REMINDERS, deletingId); closeAllModals(); renderReminders(); 
            showToast('✅ Reminder deleted successfully');
        }
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
        
        // Add title
        doc.setFontSize(18);
        doc.text('Expense Report', 14, 22);
        
        // Add generation date
        doc.setFontSize(11);
        doc.setTextColor(100);
        const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
        doc.text(`Generated on: ${dateStr}`, 14, 30);
        
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

        // --- Details Section ---
        const tableBody = filteredExpenses.map(e => [
            formatExpenseId(e.id), 
            e.category, 
            formatCurrency(e.amount),
            formatDate(e.date).replace(',', ''), 
            e.status.toUpperCase()
        ]);
        
        doc.autoTable({
            head: [['Expense ID', 'Category', 'Amount', 'Date', 'Status']],
            body: tableBody,
            startY: 40,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [79, 70, 229] }
        });

        let finalY = doc.lastAutoTable.finalY || 40;

        // --- Analysis Summary Section ---
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.setFont(undefined, 'bold');
        doc.text("Analysis Summary", 14, finalY + 15);
        doc.setFont(undefined, 'normal');

        doc.setFontSize(11);
        doc.setTextColor(50);
        doc.text(`Total Expense Amount: ${formatCurrency(totalExpensesAmount)}`, 14, finalY + 25);

        let yPos = finalY + 35;
        doc.setFont(undefined, 'bold');
        doc.text("Category Breakdown:", 14, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 7;

        for (const [cat, amt] of Object.entries(categoryTotals)) {
            doc.text(`- ${cat}: ${formatCurrency(amt)}`, 20, yPos);
            yPos += 7;
        }

        yPos += 3;
        doc.setFont(undefined, 'bold');
        doc.text("Status Breakdown:", 14, yPos);
        doc.setFont(undefined, 'normal');
        yPos += 7;

        for (const [st, amt] of Object.entries(statusTotals)) {
            doc.text(`- ${st}: ${formatCurrency(amt)}`, 20, yPos);
            yPos += 7;
        }

        // --- Reminders Section ---
        if (Array.isArray(reminders) && reminders.length > 0) {
            let nextY = yPos + 10;
            if (nextY > 250) { doc.addPage(); nextY = 20; }

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.setFont(undefined, 'bold');
            doc.text("Payment Reminders", 14, nextY);
            doc.setFont(undefined, 'normal');

            const sortedReminders = [...reminders].sort((a,b) => new Date(a.date) - new Date(b.date));
            const remindersBody = sortedReminders.map(r => [
                r.title, 
                formatCurrency(r.amount),
                formatDate(r.date).replace(',', ''), 
                r.status.toUpperCase()
            ]);

            doc.autoTable({
                head: [['Reminder Title', 'Amount', 'Due Date', 'Status']],
                body: remindersBody,
                startY: nextY + 7,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [79, 70, 229] }
            });
        }
        
        doc.save("PrintSmart_Expense_Report.pdf");
    });
}
