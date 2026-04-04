// assets/js/employees.js
// All API calls now point to Backend/api/employees.php (single consolidated endpoint)

const API_EMP = '../../Backend/api/employees.php';

const modal      = document.getElementById('addEmployeeModal');
const openBtn    = document.getElementById('openAddEmployeeModal');
const closeBtn   = document.getElementById('closeAddEmployeeModal');
const saveBtn    = document.querySelector('.save-btn');
const toast      = document.getElementById('successToast');
const toastMsg   = document.querySelector('.toast-message');
const tableBody  = document.querySelector('tbody');

const empName    = document.getElementById('empName');
const empEmail   = document.getElementById('empEmail');
const empPhone   = document.getElementById('empPhone');
const empAddress = document.getElementById('empAddress');
const empDetails = document.getElementById('empDetails');
const empRole    = document.getElementById('empRole');
const empSalary  = document.getElementById('empSalary');

// Fetch and render employee list
async function fetchEmployees() {
    try {
        const res = await fetch(API_EMP);
        const employees = await res.json();
        tableBody.innerHTML = '';
        if (!employees.length) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No employees found.</td></tr>';
            return;
        }
        employees.forEach((emp, index) => {
            const displayIdStr = '#EM-' + String(employees.length - index).padStart(3, '0');
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
                    <svg class="delete-btn" data-id="${emp.id}" style="cursor:pointer;" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </td>`;
            tableBody.appendChild(tr);
        });
    } catch (err) { console.error('Error fetching employees:', err); }
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
if (openBtn)  openBtn.addEventListener('click',  () => { modal.style.display = 'flex'; });
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

// Event delegation for delete
tableBody.addEventListener('click', function (e) {
    const btn = e.target.closest('.delete-btn');
    if (btn) deleteEmployee(btn.getAttribute('data-id'));
});

document.addEventListener('DOMContentLoaded', fetchEmployees);
