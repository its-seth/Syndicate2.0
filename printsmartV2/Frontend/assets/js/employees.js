// assets/js/employees.js
// All API calls now point to Backend/api/employees.php (single consolidated endpoint)

const API_EMP = '../../Backend/api/employees.php';

const modal = document.getElementById('addEmployeeModal');
const openBtn = document.getElementById('openAddEmployeeModal');
const closeBtn = document.getElementById('closeAddEmployeeModal');
const saveBtn = document.querySelector('.save-btn');
const toast = document.getElementById('successToast');
const toastMsg = document.querySelector('.toast-message');
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
        const initials = emp.name ? emp.name.substring(0, 2).toUpperCase() : 'NA';
        const roleStr = (emp.role || '').toLowerCase();
        const roleClass = roleStr.includes('designer') ? 'designer' : roleStr.includes('manager') ? 'manager' :
            roleStr.includes('lead') ? 'lead' : roleStr.includes('operator') ? 'operator' :
                roleStr.includes('analyst') ? 'analyst' : 'tech';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="id-color">${displayIdStr}</td>
            <td><div class="name-cell"><span class="avatar blue-avatar">${initials}</span><b>${emp.name}</b></div></td>
            <td><span class="role-badge ${roleClass}">${emp.role || ''}</span></td>
            <td class="text-gray">${emp.phone || ''}</td>
            <td><b>${emp.email || ''}</b></td>
            <td class="actions">
                <svg class="view-btn" data-id="${emp.id}" style="cursor:pointer; margin-right: 8px;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                <svg class="edit-btn" data-id="${emp.id}" style="cursor:pointer; margin-right: 8px;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                <svg class="delete-btn" data-id="${emp.id}" style="cursor:pointer;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </td>`;
        tableBody.appendChild(tr);
    });
}

const searchInputEl = document.getElementById('searchInput');
if (searchInputEl) {
    searchInputEl.addEventListener('input', (e) => triggerSearchFilter(e.target.value));
}

// Delete employee
async function deleteEmployee(id) {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
        const res = await fetch(API_EMP, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const result = await res.json();
        if (result.success) {
            if (toastMsg) toastMsg.textContent = 'Deleted Successfully !!!';
            if (toast) toast.style.display = 'flex';
            fetchEmployees();
        } else { alert(result.message); }
    } catch (err) { console.error('Error deleting employee:', err); }
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
                if (toastMsg) toastMsg.textContent = 'Added Successfully !!!';
                if (toast) toast.style.display = 'flex';
                fetchEmployees();
            } else { alert(result.message); }
        } catch (err) { console.error('Error adding employee:', err); }
    });
}

if (toast) toast.addEventListener('click', () => { toast.style.display = 'none'; });

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
                if (toastMsg) toastMsg.textContent = 'Updated Successfully !!!';
                if (toast) toast.style.display = 'flex';
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
            let finalY = doc.lastAutoTable.finalY || 40;

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text("Employee Analysis Summary", 14, finalY + 15);

            const totalEmployees = employees.length;
            let roleDistribution = {};
            let totalSalary = 0;
            let hasSalaryData = false;

            employees.forEach(emp => {
                const role = emp.role || 'Unassigned';
                roleDistribution[role] = (roleDistribution[role] || 0) + 1;

                if (emp.salary) {
                    const sal = parseFloat(String(emp.salary).replace(/[^0-9.-]+/g, ""));
                    if (!isNaN(sal)) {
                        totalSalary += sal;
                        hasSalaryData = true;
                    }
                }
            });

            doc.setFontSize(11);
            doc.setTextColor(50);
            doc.text(`Total Employees: ${totalEmployees}`, 14, finalY + 25);

            let yPos = finalY + 25;

            if (hasSalaryData) {
                yPos += 7;
                doc.text(`Total Payroll: $${totalSalary.toFixed(2)}`, 14, yPos);
            }

            const roleData = Object.keys(roleDistribution).map(role => [role, roleDistribution[role]]);
            doc.autoTable({
                head: [['Role Breakdown', 'Employee Count']],
                body: roleData,
                startY: yPos + 10,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 4 },
                headStyles: { fillColor: [46, 204, 113] }
            });

            finalY = doc.lastAutoTable.finalY || (yPos + 10);

            if (hasSalaryData) {
                let salaryDistribution = {};
                employees.forEach(emp => {
                    const role = emp.role || 'Unassigned';
                    if (emp.salary) {
                        const sal = parseFloat(String(emp.salary).replace(/[^0-9.-]+/g, ""));
                        if (!isNaN(sal)) {
                            salaryDistribution[role] = (salaryDistribution[role] || 0) + sal;
                        }
                    }
                });

                const salaryData = Object.keys(salaryDistribution).map(role => [role, `$${salaryDistribution[role].toFixed(2)}`]);
                doc.autoTable({
                    head: [['Role', 'Total Salary']],
                    body: salaryData,
                    startY: finalY + 10,
                    theme: 'grid',
                    styles: { fontSize: 9, cellPadding: 4 },
                    headStyles: { fillColor: [243, 156, 18] }
                });
            }

            doc.save('Employee_Report.pdf');
        } catch (err) {
            console.error('Error generating report:', err);
            alert('Failed to generate the report data.');
        }
    });
}
