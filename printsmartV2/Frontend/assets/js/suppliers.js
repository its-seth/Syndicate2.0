// assets/js/suppliers.js — All API paths updated to Backend/api/suppliers.php

const SUPP_API   = '../../Backend/api/suppliers.php';
const REPORT_URL = '../../Backend/reports/suppliers.php';

$(document).ready(function () {

    $('#addSupplierBtn').click(function () { $('#addModal').show(); });

    $('#addSupplierForm').submit(function (e) {
        e.preventDefault();
        $.post(SUPP_API, { action: 'add', data: $(this).serialize() }, function (response) {
            if (response.status === 'success') {
                showToast('Supplier added successfully!', 'success');
                $('#addModal').hide();
                $('#addSupplierForm')[0].reset();
                loadSuppliers();
            } else { showToast('Error: ' + (response.message || 'Unknown error'), 'error'); }
        }, 'json').fail(() => showToast('Server error', 'error'));
    });

    $('#editSupplierForm').submit(function (e) {
        e.preventDefault();
        $.post(SUPP_API, { action: 'edit', data: $(this).serialize() }, function (response) {
            if (response.status === 'success') {
                showToast('Supplier updated successfully!', 'success');
                $('#editModal').hide();
                loadSuppliers();
            } else { showToast('Error: ' + (response.message || 'Unknown error'), 'error'); }
        }, 'json').fail(() => showToast('Server error', 'error'));
    });

    $('#reminderForm').submit(function (e) {
        e.preventDefault();
        $.post(SUPP_API, { action: 'add_reminder', data: $(this).serialize() }, function (response) {
            if (response.status === 'success') {
                showToast('Reminder set successfully!', 'success');
                $('#reminderModal').hide();
                $('#reminderForm')[0].reset();
            } else { showToast('Error adding reminder', 'error'); }
        }, 'json').fail(() => showToast('Server error', 'error'));
    });

    $('#generateReportBtn').click(function () { window.open(REPORT_URL, '_blank'); });

    $(document).on('click', '.close-modal, .modal', function (e) {
        if ($(e.target).hasClass('modal') || $(e.target).hasClass('close-modal')) {
            $('.modal').hide();
        }
    });

    let searchTimer;
    $('#searchInput').on('input', function () {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => loadSuppliers($(this).val().trim()), 300);
    });

    loadSuppliers();
});

function loadSuppliers(search = '') {
    $.post(SUPP_API, { action: 'list', search: search }, function (data) {
        let html = '';
        if (!data.length) {
            html = '<tr><td colspan="6" style="text-align:center;">No suppliers found.</td></tr>';
        } else {
            data.forEach(function (s) {
                html += `
                    <tr>
                        <td>#SUP-${s.SID.slice(-4).toUpperCase()}</td>
                        <td>${escHtml(s.SName)}</td>
                        <td>${escHtml(s.supply_type)}</td>
                        <td>${escHtml(s.SContact_No)}</td>
                        <td>${escHtml(s.SEmail)}</td>
                        <td class="action-buttons">
                            <button class="btn-view" onclick="loadSupplierDetails('${s.SID}')">View</button>
                            <button class="btn-edit" onclick="loadSupplierForEdit('${s.SID}')">Edit</button>
                            <button class="btn-delete" onclick="deleteSupplier('${s.SID}')">Delete</button>
                        </td>
                    </tr>`;
            });
        }
        $('#supplierTableBody').html(html);
    }, 'json').fail(() => $('#supplierTableBody').html('<tr><td colspan="6">Failed to load. Is the server running?</td></tr>'));
}

function loadSupplierDetails(id) {
    $.post(SUPP_API, { action: 'view', id: id }, function (s) {
        if (s.error) { showToast(s.error, 'error'); return; }
        const dueDate = s.SDueDate || 'N/A';
        const today   = new Date(); const due = new Date(dueDate);
        const overdue = due < today ? '<span style="color:red;"> (OVERDUE)</span>' : '';
        $('#viewModalBody').html(`
            <p><strong>Name:</strong> ${escHtml(s.SName)}</p>
            <p><strong>Email:</strong> ${escHtml(s.SEmail)}</p>
            <p><strong>Contact:</strong> ${escHtml(s.SContact_No)}</p>
            <p><strong>Address:</strong> ${escHtml(s.SAddress)}</p>
            <p><strong>Supplies:</strong> ${escHtml(s.supply_type)}</p>
            <p><strong>Details:</strong> ${escHtml(s.supply_details)}</p>
            <p><strong>Total Amount:</strong> LKR ${parseFloat(s.Stotal).toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${dueDate}${overdue}</p>
            <hr>
            <div id="remindersContainer"></div>
            <button class="btn-primary" style="margin-top:12px;" onclick="openReminderModal('${s.SID}','${escHtml(s.SName)}')">Set Reminder</button>
            <button class="btn-delete" style="margin-top:12px;margin-left:8px;" onclick="deleteSupplier('${s.SID}',true)">Delete Supplier</button>
        `);
        loadReminders(s.SID);
        $('#viewModal').show();
    }, 'json');
}

function loadReminders(supplierId) {
    $.post(SUPP_API, { action: 'get_reminders', id: supplierId }, function (reminders) {
        let html = reminders.length ? '<h4>Reminders:</h4>' : '<p>No reminders set.</p>';
        reminders.forEach(r => {
            html += `<div class="reminder-item"><strong>${escHtml(r.reminder_name)}</strong> — ${r.reminder_date} ${r.reminder_time || ''}</div>`;
        });
        $('#remindersContainer').html(html);
    }, 'json');
}

function loadSupplierForEdit(id) {
    $.post(SUPP_API, { action: 'get_supplier', id: id }, function (s) {
        if (s.error) { showToast(s.error, 'error'); return; }
        const f = $('#editSupplierForm');
        f.find('[name="SID"]').val(s.SID);
        f.find('[name="SName"]').val(s.SName);
        f.find('[name="SEmail"]').val(s.SEmail);
        f.find('[name="SContact_No"]').val(s.SContact_No);
        f.find('[name="SAddress"]').val(s.SAddress);
        f.find('[name="supply_type"]').val(s.supply_type);
        f.find('[name="supply_details"]').val(s.supply_details);
        f.find('[name="Stotal"]').val(s.Stotal);
        f.find('[name="SDueDate"]').val(s.SDueDate);
        $('#editModal').show();
    }, 'json');
}

function deleteSupplier(id, fromView = false) {
    if (confirm('Delete this supplier? This cannot be undone.')) {
        $.post(SUPP_API, { action: 'delete', id: id }, function (r) {
            if (r.status === 'success') {
                showToast('Supplier deleted.', 'error');
                if (fromView) $('#viewModal').hide();
                loadSuppliers();
            } else { showToast('Delete failed', 'error'); }
        }, 'json');
    }
}

function openReminderModal(sid, sname) {
    $('#reminder_supplier_id').val(sid);
    $('#reminder_supplier_name').val(sname);
    $('#reminderModal').show();
}

function showToast(message, type = 'success') {
    const toast = $(`<div class="toast ${type}">${message}</div>`);
    $('#toastContainer').append(toast);
    setTimeout(() => toast.fadeOut(400, function () { $(this).remove(); }), 3000);
}

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>]/g, m => m === '&' ? '&amp;' : m === '<' ? '&lt;' : '&gt;');
}
