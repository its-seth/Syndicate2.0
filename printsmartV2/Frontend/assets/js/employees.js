// assets/js/employees.js
// All API calls now point to Backend/api/employees.php (single consolidated endpoint)

const API_EMP = '../../Backend/api/employees.php';

const modal = document.getElementById('addEmployeeModal');
const openBtn = document.getElementById('openAddEmployeeModal');
const closeBtn = document.getElementById('closeAddEmployeeModal');
const saveBtn = document.querySelector('.save-btn');
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
const tableBody = document.querySelector('tbody');

const empName = document.getElementById('empName');
const empEmail = document.getElementById('empEmail');
const empPhone = document.getElementById('empPhone');
const empAddress = document.getElementById('empAddress');
const empDetails = document.getElementById('empDetails');
const empRole = document.getElementById('empRole');
const empSalary = document.getElementById('empSalary');

let allEmployeesData = [];

// Helper function to handle search and filtering
function triggerSearchFilter(searchTerm) {
    const trm = (searchTerm || '').toLowerCase().trim();
    if (!trm) {
        renderEmployees(allEmployeesData);
        return;
    }
    const filtered = allEmployeesData.filter(emp => {
        return (emp.name && emp.name.toLowerCase().includes(trm)) ||
            (emp.emp_id_str && emp.emp_id_str.toLowerCase().includes(trm)) ||
            (emp.role && emp.role.toLowerCase().includes(trm)) ||
            (emp.email && emp.email.toLowerCase().includes(trm)) ||
            (emp.phone && emp.phone.includes(trm));
    });
    renderEmployees(filtered);
}

// Fetch employee list
async function fetchEmployees() {
    try {
        const res = await fetch(API_EMP);
        allEmployeesData = await res.json();

        // Dynamically renumber employees so the oldest is 1 and newest is N
        if (Array.isArray(allEmployeesData)) {
            // API returns DESC (newest first). Reverse to oldest first.
            allEmployeesData.reverse();

            allEmployeesData.forEach((emp, index) => {
                const seq = index + 1;
                emp.emp_id_str = '#EM-' + String(seq).padStart(3, '0');
            });

            // Reverse back to newest first for descending display
            allEmployeesData.reverse();
        }

        const searchInput = document.getElementById('searchInput');
        triggerSearchFilter(searchInput ? searchInput.value : '');
    } catch (err) { console.error('Error fetching employees:', err); }
}

function renderEmployees(employees) {
    tableBody.innerHTML = '';
    if (!employees.length) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No employees found.</td></tr>';
        return;
    }
    employees.forEach((emp, index) => {
        const displayIdStr = emp.emp_id_str || ('#EM-' + String(emp.id).padStart(3, '0'));
        const roleStr = (emp.role || '').toLowerCase();
        const roleClass = roleStr.includes('designer') ? 'designer' : roleStr.includes('manager') ? 'manager' :
            roleStr.includes('lead') ? 'lead' : roleStr.includes('operator') ? 'operator' :
                roleStr.includes('analyst') ? 'analyst' : 'tech';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="id-color">${displayIdStr}</td>
            <td><b>${emp.name}</b></td>
            <td><span class="role-badge ${roleClass}">${emp.role || ''}</span></td>
            <td class="text-gray">${emp.phone || ''}</td>
            <td><b>${emp.email || ''}</b></td>
            <td class="actions">
                <i class="fa-regular fa-eye view-btn" data-id="${emp.id}"></i>
                <i class="fa-regular fa-pen-to-square edit-btn" data-id="${emp.id}"></i>
                <i class="fa-regular fa-trash-can delete-btn" data-id="${emp.id}"></i>
            </td>`;
        tableBody.appendChild(tr);
    });
}

const searchInputEl = document.getElementById('searchInput');
if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => triggerSearchFilter(e.target.value));
}

// Delete Employee Modal Setup
let pendingDeleteId = null;
let pendingDeleteName = '';

const deleteModal = document.getElementById('deleteConfirmModal');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteMessageSpan = document.getElementById('deleteMessage');

if (closeDeleteModalBtn) {
    closeDeleteModalBtn.addEventListener('click', () => { if (deleteModal) deleteModal.style.display = 'none'; });
}
if (deleteModal) {
    window.addEventListener('click', e => { if (e.target === deleteModal) deleteModal.style.display = 'none'; });
}

// Delete employee (Triggered when trash icon clicked)
function deleteEmployee(id) {
    const emp = allEmployeesData.find(e => e.id == id);
    const name = emp ? emp.name : 'this employee';
    pendingDeleteId = id;
    pendingDeleteName = name;
    if (deleteMessageSpan) deleteMessageSpan.textContent = `Are you sure you want to delete ${name}? `;
    if (deleteModal) deleteModal.style.display = 'flex';
}

if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!pendingDeleteId) return;
        try {
            const res = await fetch(API_EMP, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pendingDeleteId })
            });
            const result = await res.json();
            if (result.success) {
                showToast(`"${pendingDeleteName}" deleted successfully`);
                fetchEmployees();
            } else { alert(result.message); }
        } catch (err) { console.error('Error deleting employee:', err); }
        finally {
            if (deleteModal) deleteModal.style.display = 'none';
            pendingDeleteId = null; S
        }
    });
}

// Modal controls
if (openBtn) openBtn.addEventListener('click', () => { modal.style.display = 'flex'; });
if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

// Save employee
if (saveBtn) {
    saveBtn.addEventListener('click', async function () {
        const data = {
            name: empName?.value || '', email: empEmail?.value || '',
            phone: empPhone?.value || '', address: empAddress?.value || '',
            details: empDetails?.value || '', role: empRole?.value || '',
            salary: empSalary?.value || ''
        };
        if (!data.name) { alert('Please enter employee name'); return; }
        try {
            const res = await fetch(API_EMP, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                [empName, empEmail, empPhone, empAddress, empDetails, empRole, empSalary]
                    .forEach(el => { if (el) el.value = ''; });
                modal.style.display = 'none';
                showToast('Employee added successfully');
                fetchEmployees();
            } else { alert(result.message); }
        } catch (err) { console.error('Error adding employee:', err); }
    });
}

// Old static toast click listener removed

// Event delegation for actions
tableBody.addEventListener('click', function (e) {
    const delBtn = e.target.closest('.delete-btn');
    if (delBtn) {
        deleteEmployee(delBtn.getAttribute('data-id'));
        return;
    }

    const viewBtn = e.target.closest('.view-btn');
    if (viewBtn) {
        openViewModal(viewBtn.getAttribute('data-id'));
        return;
    }

    const editBtn = e.target.closest('.edit-btn');
    if (editBtn) {
        openEditModal(editBtn.getAttribute('data-id'));
        return;
    }
});

const viewModal = document.getElementById('viewEmployeeModal');
const closeViewBtn = document.getElementById('closeViewEmployeeModal');
if (closeViewBtn) {
    closeViewBtn.addEventListener('click', () => { if (viewModal) viewModal.style.display = 'none'; });
}
window.addEventListener('click', e => { if (e.target === viewModal) viewModal.style.display = 'none'; });

function openViewModal(id) {
    const emp = allEmployeesData.find(e => e.id == id);
    if (!emp) return;

    const displayIdStr = emp.emp_id_str || ('#EM-' + String(emp.id).padStart(3, '0'));
    const initials = emp.name ? emp.name.substring(0, 2).toUpperCase() : 'NA';

    // Set text contents safely
    if (document.getElementById('viewEmpAvatar')) document.getElementById('viewEmpAvatar').textContent = initials;
    if (document.getElementById('viewEmpName')) document.getElementById('viewEmpName').textContent = emp.name || 'Unknown';
    if (document.getElementById('viewEmpRole')) document.getElementById('viewEmpRole').textContent = emp.role || 'Unassigned';
    if (document.getElementById('viewEmpId')) document.getElementById('viewEmpId').textContent = 'ID: ' + displayIdStr;

    if (document.getElementById('viewEmpEmail')) document.getElementById('viewEmpEmail').textContent = emp.email || 'N/A';
    if (document.getElementById('viewEmpPhone')) document.getElementById('viewEmpPhone').textContent = emp.phone || 'N/A';
    if (document.getElementById('viewEmpAddress')) document.getElementById('viewEmpAddress').textContent = emp.address || 'N/A';
    if (document.getElementById('viewEmpSalary')) document.getElementById('viewEmpSalary').textContent = emp.salary || 'N/A';

    if (viewModal) viewModal.style.display = 'flex';
}

const editModal = document.getElementById('editEmployeeModal');
const closeEditBtn = document.getElementById('closeEditEmployeeModal');
const saveEditBtn = document.getElementById('saveEditEmployeeBtn');

if (closeEditBtn) {
    closeEditBtn.addEventListener('click', () => { if (editModal) editModal.style.display = 'none'; });
}
window.addEventListener('click', e => { if (e.target === editModal) editModal.style.display = 'none'; });

function openEditModal(id) {
    const emp = allEmployeesData.find(e => e.id == id);
    if (!emp) return;

    document.getElementById('editEmpId').value = emp.id;
    document.getElementById('editEmpName').value = emp.name || '';
    document.getElementById('editEmpEmail').value = emp.email || '';
    document.getElementById('editEmpPhone').value = emp.phone || '';
    document.getElementById('editEmpAddress').value = emp.address || '';
    document.getElementById('editEmpDetails').value = emp.additional_details || emp.details || '';
    document.getElementById('editEmpRole').value = emp.role || '';
    document.getElementById('editEmpSalary').value = emp.salary || '';

    if (editModal) editModal.style.display = 'flex';
}

if (saveEditBtn) {
    saveEditBtn.addEventListener('click', async function () {
        const data = {
            id: document.getElementById('editEmpId').value,
            name: document.getElementById('editEmpName').value,
            email: document.getElementById('editEmpEmail').value,
            phone: document.getElementById('editEmpPhone').value,
            address: document.getElementById('editEmpAddress').value,
            details: document.getElementById('editEmpDetails').value,
            role: document.getElementById('editEmpRole').value,
            salary: document.getElementById('editEmpSalary').value
        };
        if (!data.name) { alert('Please enter employee name'); return; }

        try {
            const res = await fetch(API_EMP, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (result.success) {
                if (editModal) editModal.style.display = 'none';
                showToast('✅ Employee updated successfully');
                fetchEmployees();
            } else { alert(result.message); }
        } catch (err) { console.error('Error updating employee:', err); }
    });
}

document.addEventListener('DOMContentLoaded', fetchEmployees);

const reportBtn = document.querySelector('.report-btn');
if (reportBtn) {
    reportBtn.addEventListener('click', async () => {
        if (!window.jspdf || !window.jspdf.jsPDF) {
            alert('PDF library is not loaded properly.');
            return;
        }

        try {
            // Fetch the latest employee data
            const res = await fetch(API_EMP);
            const employees = await res.json();

            // Apply dynamic sequential numbering to match the UI
            if (Array.isArray(employees)) {
                // API returns DESC (newest first). Reverse to oldest first.
                employees.reverse();
                employees.forEach((emp, index) => {
                    const seq = index + 1;
                    emp.emp_id_str = '#EM-' + String(seq).padStart(3, '0');
                });
                // Reverse back to newest first
                employees.reverse();
            }
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Add title
            doc.setFontSize(18);
            doc.text('Employee Report', 14, 22);

            // Add generation date
            doc.setFontSize(11);
            doc.setTextColor(100);
            const dateStr = new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString();
            doc.text(`Generated on: ${dateStr}`, 14, 30);

            // Setup table data
            const tableColumn = ["ID", "Name", "Role", "Phone", "Email"];
            const tableRows = [];

            employees.forEach((emp, index) => {
                const displayIdStr = emp.emp_id_str || ('#EM-' + String(emp.id).padStart(3, '0'));
                tableRows.push([
                    displayIdStr,
                    emp.name || '',
                    emp.role || '',
                    emp.phone || '',
                    emp.email || ''
                ]);
            });

            doc.autoTable({
                head: [tableColumn],
                body: tableRows,
                startY: 40,
                theme: 'grid',
                styles: { fontSize: 9 },
                headStyles: { fillColor: [79, 70, 229] }
            });

            // --- Analysis Section ---
            const finalY = doc.lastAutoTable.finalY || 40;

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Analysis Summary", 14, finalY + 15);

            const totalEmployees = employees.length;
            let roleDistribution = {};
            let roleSalaryTotal = {};
            let totalSalary = 0;
            let hasSalaryData = false;
            let cityDistribution = {};

            employees.forEach(emp => {
                const role = emp.role || 'Unassigned';
                roleDistribution[role] = (roleDistribution[role] || 0) + 1;

                if (emp.salary) {
                    const sal = parseFloat(String(emp.salary).replace(/[^0-9.-]+/g, ""));
                    if (!isNaN(sal)) {
                        totalSalary += sal;
                        roleSalaryTotal[role] = (roleSalaryTotal[role] || 0) + sal;
                        hasSalaryData = true;
                    }
                }

                // Extract city/area for Geographic Distribution (simplistic logic)
                if (emp.address && emp.address.trim() !== '') {
                    const parts = emp.address.split(',');
                    let city = parts[parts.length - 1].trim();
                    // Fallback to simple words if no commas used
                    if (!city || city.length > 25) {
                        const words = emp.address.trim().split(' ');
                        city = words[words.length - 1];
                    }
                    if (city) {
                        const normalizedCity = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
                        cityDistribution[normalizedCity] = (cityDistribution[normalizedCity] || 0) + 1;
                    }
                }
            });

            doc.setFontSize(11);
            doc.setTextColor(50);
            doc.text(`Total Employees: ${totalEmployees}`, 14, finalY + 25);

            let yPos = finalY + 25;

            if (hasSalaryData) {
                yPos += 7;
                doc.text(`Total Payroll: $${totalSalary.toLocaleString()}`, 14, yPos);
            }

            yPos += 10;
            doc.setFont(undefined, 'bold');
            doc.text("Role Breakdown & Average Salary:", 14, yPos);
            doc.setFont(undefined, 'normal');
            yPos += 7;

            for (const [role, count] of Object.entries(roleDistribution)) {
                let text = `- ${role}: ${count} employee(s)`;
                if (roleSalaryTotal[role]) {
                    let avg = roleSalaryTotal[role] / count;
                    text += ` (Avg: $${avg.toLocaleString()})`;
                }
                doc.text(text, 20, yPos);
                yPos += 7;
            }

            if (Object.keys(cityDistribution).length > 0) {
                yPos += 5;
                doc.setFont(undefined, 'bold');
                doc.text("Top Geographic Distributions (Address base):", 14, yPos);
                doc.setFont(undefined, 'normal');
                yPos += 7;
                // Sort cities by count descending
                const sortedCities = Object.entries(cityDistribution).sort((a, b) => b[1] - a[1]);
                // Print top 5 regions to avoid PDF overflow
                for (let i = 0; i < Math.min(sortedCities.length, 5); i++) {
                    doc.text(`- ${sortedCities[i][0]}: ${sortedCities[i][1]} employee(s)`, 20, yPos);
                    yPos += 7;
                }
            }

            doc.save('Employee_Report.pdf');
        } catch (err) {
            console.error('Error generating report:', err);
            alert('Failed to generate the report data.');
        }
    });
}
