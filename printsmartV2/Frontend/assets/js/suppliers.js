// assets/js/suppliers.js — rewritten to match order page style
const SUPP_API   = '../../Backend/api/suppliers.php';
const REPORT_URL = '../../Backend/reports/suppliers.php';

$(document).ready(function () {
    // Load suppliers on page load
    loadSuppliers();

    // Search with debounce
    let searchTimer;
    $('#searchInput').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadSuppliers($(this).val().trim()), 300);
    });

    // Add Supplier button
    $('#addSupplierBtn').click(function () {
        resetAddModal();
        $('#addModal').css('display', 'flex');
    });

    // Add form submission
    $('#addSupplierForm').submit(function (e) {
        e.preventDefault();
        $.post(SUPP_API, { action: 'add', data: $(this).serialize() }, function (response) {
            if (response.status === 'success') {
                showToast('Supplier added successfully!', 'success');
                $('#addModal').hide();
                $('#addSupplierForm')[0].reset();
                loadSuppliers();
            } else {
                showToast('Error: ' + (response.message || 'Unknown error'), 'error');
            }
        }, 'json').fail(() => showToast('Server error', 'error'));
    });

    // Edit form submission
    $('#editSupplierForm').submit(function (e) {
        e.preventDefault();
        $.post(SUPP_API, { action: 'edit', data: $(this).serialize() }, function (response) {
            if (response.status === 'success') {
                showToast('Supplier updated successfully!', 'success');
                $('#editModal').hide();
                loadSuppliers();
            } else {
                showToast('Error: ' + (response.message || 'Unknown error'), 'error');
            }
        }, 'json').fail(() => showToast('Server error', 'error'));
    });

    // Reminder form submission
    $('#reminderForm').submit(function (e) {
        e.preventDefault();
        $.post(SUPP_API, { action: 'add_reminder', data: $(this).serialize() }, function (response) {
            if (response.status === 'success') {
                showToast('Reminder set successfully!', 'success');
                $('#reminderModal').hide();
                $('#reminderForm')[0].reset();
                // Refresh reminders if view modal is open
                let supplierId = $('#reminder_supplier_id').val();
                if (supplierId && $('#viewModal').is(':visible')) {
                    loadReminders(supplierId);
                }
            } else {
                showToast('Error adding reminder', 'error');
            }
        }, 'json').fail(() => showToast('Server error', 'error'));
    });

    // Generate Report button
    $('#generateReportBtn').click(function () {
        window.open(REPORT_URL, '_blank');
    });

    // Close modals when clicking on background or X
    $(document).on('click', '.modal', function (e) {
        if ($(e.target).is('.modal')) {
            $('.modal').hide();
        }
    });
    $(document).on('click', '.close-modal', function () {
        $(this).closest('.modal').hide();
    });
});

function loadSuppliers(search = '') {
    $('#supplierTableBody').html('<tr><td colspan="6" style="text-align:center;">Loading...</td></tr>');
    $.post(SUPP_API, { action: 'list', search: search }, function (data) {
        let html = '';
        if (!data.length) {
            html = '<tr><td colspan="6" style="text-align:center;">No suppliers found.</td></tr>';
        } else {
            data.forEach(function (s) {
                html += `
                    <tr>
                        <td class="id-color">${escapeHtml(s.supplier_id)}</td>
                        <td>${escapeHtml(s.SName)}</td>
                        <td>${escapeHtml(s.supply_type)}</td>
                        <td>${escapeHtml(s.SContact_No)}</td>
                        <td>${escapeHtml(s.SEmail)}</td>
                        <td class="action-buttons">
                            <i class="fa-regular fa-eye btn-view" onclick="viewSupplier(${s.id})" title="View"></i>
                            <i class="fa-regular fa-pen-to-square btn-edit" onclick="editSupplier(${s.id})" title="Edit"></i>
                            <i class="fa-regular fa-trash-can btn-delete" onclick="deleteSupplier(${s.id})" title="Delete"></i>
                            <i class="fa-regular fa-bell btn-reminder" onclick="openReminderModal(${s.id}, '${escapeHtml(s.SName)}')" title="Set Reminder"></i>
                        </td>
                    </tr>
                `;
            });
        }
        $('#supplierTableBody').html(html);
    }, 'json').fail(() => {
        $('#supplierTableBody').html('<tr><td colspan="6">Failed to load. Is the server running?</td></tr>');
        showToast('Error connecting to server', 'error');
    });
}

function viewSupplier(id) {
    $.post(SUPP_API, { action: 'view', id: id }, function (s) {
        if (s.error) {
            showToast(s.error, 'error');
            return;
        }
        const dueDate = s.SDueDate ? new Date(s.SDueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';
        const today = new Date();
        const due = new Date(s.SDueDate);
        const overdue = (s.SDueDate && due < today) ? '<span style="color:red;"> (OVERDUE)</span>' : '';
        
        $('#viewModalBody').html(`
            <div style="margin-bottom:20px;">
                <p><strong>Supplier ID:</strong> ${escapeHtml(s.supplier_id)}</p>
                <p><strong>Name:</strong> ${escapeHtml(s.SName)}</p>
                <p><strong>Email:</strong> ${escapeHtml(s.SEmail)}</p>
                <p><strong>Contact:</strong> ${escapeHtml(s.SContact_No)}</p>
                <p><strong>Address:</strong> ${escapeHtml(s.SAddress || 'N/A')}</p>
                <p><strong>Supplies:</strong> ${escapeHtml(s.supply_type)}</p>
                <p><strong>Details:</strong> ${escapeHtml(s.supply_details || 'N/A')}</p>
                <p><strong>Total Amount:</strong> LKR ${parseFloat(s.Stotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                <p><strong>Due Date:</strong> ${dueDate}${overdue}</p>
            </div>
            <hr>
            <div id="remindersContainer"><p>Loading reminders...</p></div>
            <div style="margin-top:20px; display:flex; gap:10px;">
                <button class="save-btn" onclick="openReminderModal(${s.id}, '${escapeHtml(s.SName)}')">Set Reminder</button>
                <button class="cancel-btn" onclick="deleteSupplier(${s.id}, true)">Delete Supplier</button>
            </div>
        `);
        $('#viewModal').css('display', 'flex');
        loadReminders(s.id);
    }, 'json').fail(() => showToast('Error loading supplier details', 'error'));
}

function loadReminders(supplierId) {
    $.post(SUPP_API, { action: 'get_reminders', id: supplierId }, function (reminders) {
        let html = '';
        if (reminders.length === 0) {
            html = '<p>No reminders set.</p>';
        } else {
            html = '<h4 style="margin-bottom:10px;">Reminders:</h4>';
            reminders.forEach(r => {
                html += `<div style="background:#f8fafc; border-radius:8px; padding:10px; margin-bottom:8px;">
                            <strong>${escapeHtml(r.reminder_name)}</strong><br>
                            ${r.reminder_date} ${r.reminder_time || ''}<br>
                            ${r.reminder_type ? 'Type: ' + escapeHtml(r.reminder_type) : ''}
                            ${r.notes ? '<br>Notes: ' + escapeHtml(r.notes) : ''}
                         </div>`;
            });
        }
        $('#remindersContainer').html(html);
    }, 'json').fail(() => $('#remindersContainer').html('<p>Error loading reminders</p>'));
}

function editSupplier(id) {
    $.post(SUPP_API, { action: 'get_supplier', id: id }, function (s) {
        if (s.error) {
            showToast(s.error, 'error');
            return;
        }
        const form = $('#editSupplierForm');
        form.find('[name="SID"]').val(s.id);
        form.find('[name="SName"]').val(s.SName);
        form.find('[name="SEmail"]').val(s.SEmail);
        form.find('[name="SContact_No"]').val(s.SContact_No);
        form.find('[name="SAddress"]').val(s.SAddress);
        form.find('[name="supply_type"]').val(s.supply_type);
        form.find('[name="supply_details"]').val(s.supply_details);
        form.find('[name="Stotal"]').val(s.Stotal);
        form.find('[name="SDueDate"]').val(s.SDueDate);
        $('#editModal').css('display', 'flex');
    }, 'json').fail(() => showToast('Error loading supplier for edit', 'error'));
}

function deleteSupplier(id, fromView = false) {
    if (confirm('Delete this supplier? This cannot be undone.')) {
        $.post(SUPP_API, { action: 'delete', id: id }, function (r) {
            if (r.status === 'success') {
                showToast('Supplier deleted.', 'error');
                if (fromView) $('#viewModal').hide();
                loadSuppliers();
            } else {
                showToast('Delete failed: ' + (r.message || 'Unknown error'), 'error');
            }
        }, 'json').fail(() => showToast('Server error', 'error'));
    }
}

function openReminderModal(supplierId, supplierName) {
    $('#reminder_supplier_id').val(supplierId);
    $('#reminder_supplier_name').val(supplierName);
    $('#reminderForm')[0].reset();
    $('#reminderModal').css('display', 'flex');
}

function resetAddModal() {
    $('#addSupplierForm')[0].reset();
}

// Toast notification (matches order page style)
function showToast(message, type = 'success') {
    const toast = $(`<div class="toast-notification ${type}">${message}</div>`);
    $('body').append(toast);
    setTimeout(() => {
        toast.fadeOut(300, function() { $(this).remove(); });
    }, 3000);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}