// ----- CONFIGURATION -----
const API_BASE_URL = 'http://127.0.0.1:8000';
let transactionsCache = [];
let chartInstance = null;
let currentUser = null; // Store logged-in user details

// Check Authentication
function getAuthToken() {
    return localStorage.getItem('bizpulse_token');
}

function handleAuthFailure() {
    localStorage.removeItem('bizpulse_token');
    window.location.href = 'login.html';
}

function logout() {
    localStorage.removeItem('bizpulse_token');
    window.location.href = 'login.html';
}

function getAuthHeaders() {
    const token = getAuthToken();
    if (!token) handleAuthFailure();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// ----- INITIALIZATION -----
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verify Authentication & Fetch Current User
    if (!getAuthToken()) {
        window.location.href = 'login.html';
        return;
    }
    await fetchCurrentUser();

    // 2. Mobile Sidebar Setup
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !menuToggle.contains(e.target)) {
            sidebar.classList.remove('open');
        }
    });

    // Populate fake AI insights (would be dynamic in real system)
    populateAIInsights();
    
    // 3. Navigation View Switcher
    setupNavigation();

    // Load Backend Data
    loadTransactions();
});

function setupNavigation() {
    const navLinks = document.querySelectorAll('#main-nav .nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.getAttribute('data-view');
            switchView(view);
            
            // Close mobile sidebar if open
            const sidebar = document.getElementById('sidebar');
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    });
}

function switchView(viewName) {
    const title = document.getElementById('main-title');
    const subtitle = document.getElementById('main-subtitle');
    const metrics = document.getElementById('dashboard-metrics');
    const addBtn = document.getElementById('add-entry-btn');
    
    const sections = {
        transactions: document.getElementById('view-transactions'),
        cashflow: document.getElementById('view-cashflow'),
        ai: document.getElementById('view-ai'),
        settings: document.getElementById('view-settings')
    };

    // Update active class in sidebar
    document.querySelectorAll('#main-nav .nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.querySelector(`.nav-link[data-view="${viewName}"]`)) {
            item.classList.add('active');
        }
    });

    // Reset visibility
    metrics.classList.remove('hidden');
    addBtn.classList.remove('hidden');
    Object.values(sections).forEach(s => {
        s.classList.remove('hidden');
        s.classList.remove('full-span'); // Reset to grid behavior if needed
    });
    document.querySelector('.dashboard-grid').classList.remove('hidden');

    // View-specific logic
    switch(viewName) {
        case 'dashboard':
            title.textContent = "Financial Overview";
            subtitle.textContent = "Here's your business health at a glance.";
            break;
            
        case 'transactions':
            title.textContent = "Transaction Ledger";
            subtitle.textContent = "Detailed history of all incoming and outgoing funds.";
            metrics.classList.add('hidden');
            sections.cashflow.classList.add('hidden');
            sections.ai.classList.add('hidden');
            sections.settings.classList.add('hidden');
            sections.transactions.classList.add('full-span');
            break;

        case 'cashflow':
            title.textContent = "Cash Flow Analytics";
            subtitle.textContent = "Visual breakdown of your revenue vs expenses over time.";
            metrics.classList.add('hidden');
            sections.transactions.classList.add('hidden');
            sections.ai.classList.add('hidden');
            sections.settings.classList.add('hidden');
            sections.cashflow.classList.add('full-span');
            break;

        case 'ai':
            title.textContent = "AI Strategic Insights";
            subtitle.textContent = "Predictive analysis and health alerts for your business.";
            metrics.classList.add('hidden');
            sections.transactions.classList.add('hidden');
            sections.cashflow.classList.add('hidden');
            sections.settings.classList.add('hidden');
            sections.ai.classList.add('full-span');
            break;

        case 'settings':
            title.textContent = "Settings & Preferences";
            subtitle.textContent = "Manage your profile and platform configuration.";
            metrics.classList.add('hidden');
            addBtn.classList.add('hidden');
            document.querySelector('.dashboard-grid').classList.add('hidden');
            sections.settings.classList.remove('hidden');
            break;
    }

    // Trigger chart resize if visible
    if (viewName === 'dashboard' || viewName === 'cashflow') {
        setTimeout(() => {
            if (chartInstance) chartInstance.resize();
        }, 100);
    }
}

// ----- AJAX API CALLS (Frontend CRUD Integration) -----

async function fetchCurrentUser() {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${getAuthToken()}` }
        });
        
        if (response.status === 401) throw new Error("Unauthorized");
        
        currentUser = await response.json();
        
        // Update UI with User details
        document.getElementById('profile-name').textContent = currentUser.full_name || currentUser.email.split('@')[0];
        document.getElementById('profile-role').textContent = currentUser.role === 'admin' ? 'Administrator' : 'Standard User';
        
    } catch(err) {
        handleAuthFailure();
    }
}

// READ: Fetch all transactions
async function loadTransactions(isRefresh = false) {
    const statusText = document.getElementById('connection-status');
    try {
        if (isRefresh) statusText.textContent = "Refreshing...";
        
        const response = await fetch(`${API_BASE_URL}/transactions/`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401 || response.status === 403) handleAuthFailure();
        if (!response.ok) throw new Error("Backend connection failed");
        
        const data = await response.json();
        transactionsCache = data;
        
        statusText.textContent = "Securely Connected";
        statusText.classList.replace("text-gray-400", "text-green-500");
        document.getElementById('anomalies-count').textContent = "Healthy";
        document.getElementById('anomalies-count').classList.replace("text-yellow-500", "text-green-500");

        renderDashboard();
    } catch (error) {
        console.error("Error fetching transactions:", error);
        statusText.textContent = "Backend Offline. Start Uvicorn.";
        statusText.classList.replace("text-green-500", "text-red-500");
        document.getElementById('anomalies-count').textContent = "Disconnected";
        document.getElementById('anomalies-count').classList.replace("text-yellow-500", "text-red-500");
    }
}

// CREATE / UPDATE
async function saveTransactionToBackend(transactionData, id = null) {
    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_BASE_URL}/transactions/${id}` : `${API_BASE_URL}/transactions/`;
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: getAuthHeaders(),
            body: JSON.stringify(transactionData)
        });
        
        if (response.status === 401) handleAuthFailure();
        if (response.status === 403) throw new Error("You don't have permission to do this");
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Failed to save transaction");
        }
        
        closeModal();
        await loadTransactions();
        
        if(window.Swal) {
            Swal.fire({
                title: 'Success!',
                text: `Transaction successfully ${id ? 'updated' : 'added'}.`,
                icon: 'success',
                background: '#1a1d2d',
                color: '#fff',
                confirmButtonColor: '#6366f1'
            });
        }
    } catch (error) {
        console.error(error);
        if(window.Swal) {
            Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#1a1d2d', color: '#fff' });
        } else alert(`Error: ${error.message}`);
    }
}

// DELETE (Role-Based Access: Admin Only)
async function deleteTransaction(id) {
    if (currentUser && currentUser.role !== 'admin') {
        if(window.Swal) {
            Swal.fire({ title: 'Access Denied', text: "Only Administrators can delete transactions.", inline: true, icon: 'error', background: '#1a1d2d', color: '#fff' });
        } else alert("Access Denied: Only Admins can delete.");
        return;
    }

    if (window.Swal) {
        const result = await Swal.fire({
            title: 'Delete Transaction?',
            text: "This action cannot be undone.",
            icon: 'warning',
            background: '#1a1d2d',
            color: '#fff',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#374151',
            confirmButtonText: 'Yes, delete it!'
        });
        if (!result.isConfirmed) return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) handleAuthFailure();
        if (response.status === 403) throw new Error("You don't have permission to delete.");
        if (!response.ok) throw new Error("Delete failed");
        
        await loadTransactions();
    } catch (error) {
        console.error(error);
        if(window.Swal) {
            Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#1a1d2d', color: '#fff' });
        } else alert(`Delete Error: ${error.message}`);
    }
}


// ----- RENDER ENGINE -----

function renderDashboard() {
    renderTable();
    calculateMetrics();
    renderChart();
}

function renderTable() {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';
    
    if (transactionsCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-gray-500">No transactions found. Add one above!</td></tr>`;
        return;
    }

    const sortedTx = [...transactionsCache].sort((a, b) => new Date(b.date) - new Date(a.date));

    const getIcon = (cat) => {
        const icons = {
            'Software': 'ri-code-box-line', 'Marketing': 'ri-mega-phone-line',
            'Operations': 'ri-building-4-line', 'Payroll': 'ri-team-line',
            'Revenue': 'ri-arrow-right-up-line'
        };
        return icons[cat] || 'ri-file-list-3-line';
    };

    sortedTx.forEach(tx => {
        // Evaluate Role-Based UI
        const isAdmin = currentUser && currentUser.role === 'admin';
        const deleteBtnHTML = isAdmin ? `
            <button onclick="deleteTransaction(${tx.id})" class="text-red-400 hover:text-red-300 bg-red-400/10 p-1.5 rounded" title="Delete (Admin Only)">
                <i class="ri-delete-bin-line"></i>
            </button>
        ` : '';

        const amountClass = tx.is_positive ? 'text-green-400 font-semibold' : 'text-gray-300';
        const sign = tx.is_positive ? '+' : '-';
        const formattedAmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(tx.amount);
        
        const trHTML = `
            <tr class="hover:bg-white/5 transition-colors group">
                <td class="font-medium text-white">${tx.name}</td>
                <td>
                    <div class="category-tag">
                        <i class="${getIcon(tx.category)}"></i> ${tx.category}
                    </div>
                </td>
                <td class="text-gray-400 text-sm">${tx.date}</td>
                <td><span class="status-badge ${tx.status === 'Completed' ? 'status-completed' : 'status-pending'}">${tx.status}</span></td>
                <td class="${amountClass}">${sign}${formattedAmt}</td>
                <td class="text-right">
                    <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="editTransaction(${tx.id})" class="text-indigo-400 hover:text-indigo-300 bg-indigo-400/10 p-1.5 rounded" title="Edit">
                            <i class="ri-edit-line"></i>
                        </button>
                        ${deleteBtnHTML}
                    </div>
                </td>
            </tr>
        `;
        tbody.innerHTML += trHTML;
    });
}

function calculateMetrics() {
    let revenue = 0;
    let expenses = 0;

    transactionsCache.forEach(tx => {
        if (tx.is_positive) revenue += tx.amount;
        else expenses += tx.amount;
    });

    const profit = revenue - expenses;
    const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

    document.getElementById('total-revenue').textContent = formatter.format(revenue);
    document.getElementById('total-expenses').textContent = formatter.format(expenses);
    document.getElementById('net-profit').textContent = formatter.format(profit);
    
    if (profit < 0) document.getElementById('net-profit').classList.replace("text-indigo-400", "text-red-400");
    else document.getElementById('net-profit').classList.replace("text-red-400", "text-indigo-400");
}

function renderChart() {
    const ctx = document.getElementById('cashFlowChart').getContext('2d');
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labelsMap = {};
    
    transactionsCache.forEach(tx => {
        const d = new Date(tx.date);
        const yyyyMm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if(!labelsMap[yyyyMm]) labelsMap[yyyyMm] = { rev: 0, exp: 0 };
        if(tx.is_positive) labelsMap[yyyyMm].rev += tx.amount;
        else labelsMap[yyyyMm].exp += tx.amount;
    });
    
    const sortedKeys = Object.keys(labelsMap).sort();
    const labels = sortedKeys.map(k => {
        const [y, m] = k.split('-');
        return `${monthNames[parseInt(m)-1]} ${y.slice(2)}`;
    });
    const revenues = sortedKeys.map(k => labelsMap[k].rev);
    const expenses = sortedKeys.map(k => labelsMap[k].exp);

    if (labels.length === 0) { labels.push("No Data"); revenues.push(0); expenses.push(0); }
    if (chartInstance) chartInstance.destroy();

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = "'Outfit', sans-serif";

    const revGradient = ctx.createLinearGradient(0, 0, 0, 400);
    revGradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)'); 
    revGradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

    const expGradient = ctx.createLinearGradient(0, 0, 0, 400);
    expGradient.addColorStop(0, 'rgba(239, 68, 68, 0.5)'); 
    expGradient.addColorStop(1, 'rgba(239, 68, 68, 0.0)');


    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                { label: 'Revenue', data: revenues, borderColor: '#6366f1', backgroundColor: revGradient, borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#1a1d2d' },
                { label: 'Expenses', data: expenses, borderColor: '#ef4444', backgroundColor: expGradient, borderWidth: 3, borderDash: [5, 5], tension: 0.4, fill: true, pointBackgroundColor: '#1a1d2d' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
            plugins: { tooltip: { backgroundColor: 'rgba(26, 29, 45, 0.9)', titleColor: '#f8fafc', bodyColor: '#f8fafc', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 12 } },
            scales: { x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } }, y: { grid: { color: 'rgba(255, 255, 255, 0.05)' } } }
        }
    });
}

function populateAIInsights() {
    const insightsContainer = document.getElementById('insights-container');
    const insights = [
        { type: 'positive', icon: 'ri-line-chart-fill', color: 'var(--success)', title: 'Cash Flow Projection', desc: 'Surplus expected next month.' },
        { type: 'warning', icon: 'ri-stack-line', color: 'var(--warning)', title: 'Budget Alert', desc: 'Monitor your marketing runway.' }
    ];
    insightsContainer.innerHTML = insights.map(i => `
        <div class="insight-item ${i.type}"><i class="${i.icon} insight-icon" style="color: ${i.color}"></i><div class="insight-content"><h4>${i.title}</h4><p>${i.desc}</p></div></div>
    `).join('');
}

// ----- UI MODAL & FORM VALIDATION -----

function openModal() {
    clearErrors();
    document.getElementById('crudModal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('crudModal').classList.add('hidden');
    document.getElementById('transactionForm').reset();
    document.getElementById('txId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Transaction';
    document.getElementById('submitBtn').textContent = 'Save Entry';
}

function editTransaction(id) {
    const tx = transactionsCache.find(t => t.id === id);
    if (!tx) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Transaction';
    document.getElementById('submitBtn').textContent = 'Update Entry';
    
    document.getElementById('txId').value = tx.id;
    document.getElementById('txName').value = tx.name;
    document.getElementById('txAmount').value = tx.amount;
    document.getElementById('txDate').value = tx.date;
    document.getElementById('txCategory').value = tx.category;
    document.getElementById('txStatus').value = tx.status;
    document.getElementById('txIsPositive').checked = tx.is_positive;
    
    openModal();
}

function clearErrors() {
    ['nameError', 'amountError', 'dateError'].forEach(id => {
        document.getElementById(id).classList.add('hidden');
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    clearErrors();
    
    let isValid = true;
    
    const name = document.getElementById('txName').value.trim();
    if (!name) { document.getElementById('nameError').classList.remove('hidden'); isValid = false; }
    
    const amountVal = parseFloat(document.getElementById('txAmount').value);
    if (isNaN(amountVal) || amountVal <= 0) { document.getElementById('amountError').classList.remove('hidden'); isValid = false; }
    
    const date = document.getElementById('txDate').value;
    if (!date) { document.getElementById('dateError').classList.remove('hidden'); isValid = false; }
    
    if (!isValid) return;

    const payload = {
        name: name, amount: amountVal, date: date, category: document.getElementById('txCategory').value,
        is_positive: document.getElementById('txIsPositive').checked, status: document.getElementById('txStatus').value
    };
    
    const id = document.getElementById('txId').value;
    document.getElementById('submitBtn').textContent = 'Saving...';
    saveTransactionToBackend(payload, id ? id : null);
}
