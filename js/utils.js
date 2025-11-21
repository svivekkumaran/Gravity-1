// ============================================
// UTILITY FUNCTIONS
// ============================================

// Format currency
function formatCurrency(amount) {
    return '₹' + parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-IN', options);
}

// Format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-IN', dateOptions) + ' ' +
        date.toLocaleTimeString('en-IN', timeOptions);
}

// Format date for input fields
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

// Calculate GST
function calculateGST(amount, gstRate, isIGST = false) {
    const gstAmount = (amount * gstRate) / 100;

    if (isIGST) {
        return {
            igst: gstAmount,
            cgst: 0,
            sgst: 0,
            total: gstAmount
        };
    } else {
        return {
            igst: 0,
            cgst: gstAmount / 2,
            sgst: gstAmount / 2,
            total: gstAmount
        };
    }
}

// Validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone
function isValidPhone(phone) {
    const re = /^[6-9]\d{9}$/;
    return re.test(phone.replace(/\D/g, ''));
}

// Validate GSTIN
function isValidGSTIN(gstin) {
    const re = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    return re.test(gstin);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

let toastContainer = null;

function initToastContainer() {
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
}

function showToast(message, type = 'info', duration = 3000) {
    initToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    }[type] || 'ℹ';

    toast.innerHTML = `
    <span style="font-size: 1.2rem; font-weight: bold;">${icon}</span>
    <span>${message}</span>
  `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, duration);
}

// ============================================
// MODAL UTILITIES
// ============================================

function createModal(title, content, buttons = []) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'modal';

    modal.innerHTML = `
    <div class="modal-header">
      <h3 class="modal-title">${title}</h3>
      <button class="modal-close" onclick="closeModal(this)">&times;</button>
    </div>
    <div class="modal-body">
      ${content}
    </div>
    ${buttons.length > 0 ? `
      <div class="modal-footer flex gap-2" style="margin-top: var(--spacing-md); justify-content: flex-end;">
        ${buttons.map(btn => `
          <button class="btn ${btn.class || 'btn-primary'}" onclick="${btn.onclick}">
            ${btn.text}
          </button>
        `).join('')}
      </div>
    ` : ''}
  `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    setTimeout(() => overlay.classList.add('active'), 10);

    return overlay;
}

function closeModal(element) {
    const overlay = element.closest('.modal-overlay');
    overlay.classList.remove('active');
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 300);
}

// ============================================
// CONFIRMATION DIALOG
// ============================================

// Store callback globally to avoid scope issues
let confirmDialogCallback = null;

function confirmDialog(message, onConfirm) {
    confirmDialogCallback = onConfirm;

    const overlay = createModal(
        'Confirm Action',
        `<p>${message}</p>`,
        [
            {
                text: 'Cancel',
                class: 'btn-outline',
                onclick: 'closeModal(this)'
            },
            {
                text: 'Confirm',
                class: 'btn-danger',
                onclick: 'executeConfirmCallback(this)'
            }
        ]
    );
}

function executeConfirmCallback(element) {
    closeModal(element);
    if (confirmDialogCallback) {
        confirmDialogCallback();
        confirmDialogCallback = null;
    }
}

// ============================================
// TABLE UTILITIES
// ============================================

function createTableRow(data, columns) {
    const tr = document.createElement('tr');

    columns.forEach(col => {
        const td = document.createElement('td');

        if (col.render) {
            td.innerHTML = col.render(data);
        } else {
            td.textContent = data[col.field] || '-';
        }

        tr.appendChild(td);
    });

    return tr;
}

function populateTable(tableBody, data, columns) {
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="${columns.length}" class="text-center text-muted" style="padding: 2rem;">
          No data available
        </td>
      </tr>
    `;
        return;
    }

    data.forEach(item => {
        tableBody.appendChild(createTableRow(item, columns));
    });
}

// ============================================
// EXPORT TO CSV
// ============================================

function exportToCSV(data, filename) {
    if (data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Escape quotes and wrap in quotes if contains comma
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showToast('Data exported successfully', 'success');
}

// ============================================
// DEBOUNCE FUNCTION
// ============================================

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function saveToLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function getFromLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

// ============================================
// NUMBER FORMATTING
// ============================================

function formatNumber(num, decimals = 2) {
    return parseFloat(num).toFixed(decimals);
}

function parseNumber(str) {
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
}

// ============================================
// PASSWORD HASHING (Simple SHA-256)
// ============================================

async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Synchronous simple hash for compatibility (not cryptographically secure, but better than plain text)
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}
