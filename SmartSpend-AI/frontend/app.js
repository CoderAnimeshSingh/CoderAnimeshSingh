const API_BASE = 'http://localhost:4000';
let token = localStorage.getItem('token') || '';

const el = (id) => document.getElementById(id);
const statusEl = el('status');

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#ff9999' : '#bbd0ff';
}

function monthNow() {
  return new Date().toISOString().slice(0, 7);
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

async function register() {
  try {
    const payload = {
      name: el('name').value.trim(),
      email: el('email').value.trim(),
      password: el('password').value
    };
    const data = await api('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    token = data.token;
    localStorage.setItem('token', token);
    setStatus(`Registered as ${data.user.email}`);
    await loadCategories();
    await refreshAll();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function login() {
  try {
    const payload = {
      email: el('email').value.trim(),
      password: el('password').value
    };
    const data = await api('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    token = data.token;
    localStorage.setItem('token', token);
    setStatus(`Logged in as ${data.user.email}`);
    await loadCategories();
    await refreshAll();
  } catch (error) {
    setStatus(error.message, true);
  }
}

function logout() {
  token = '';
  localStorage.removeItem('token');
  setStatus('Logged out.');
}

async function loadCategories() {
  if (!token) return;
  const categories = await api('/api/categories', { headers: authHeaders() });
  const categorySelect = el('category');
  categorySelect.innerHTML = '';
  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category.id;
    option.textContent = `${category.name} (${category.type})`;
    option.dataset.type = category.type;
    categorySelect.appendChild(option);
  });
}

async function addTransaction() {
  try {
    if (!token) throw new Error('Please login first.');
    await api('/api/transactions', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        category_id: Number(el('category').value) || null,
        amount: Number(el('amount').value),
        type: el('type').value,
        date: el('date').value,
        note: el('note').value.trim()
      })
    });
    setStatus('Transaction added successfully.');
    await refreshAll();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function saveBudget() {
  try {
    if (!token) throw new Error('Please login first.');
    await api('/api/budgets', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        month: el('month').value,
        limit_amount: Number(el('budget').value)
      })
    });
    setStatus('Budget saved.');
    await loadDashboard();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadDashboard() {
  if (!token) return;
  const month = el('month').value || monthNow();
  const data = await api(`/api/dashboard?month=${month}`, { headers: authHeaders() });
  el('income').textContent = `₹${Number(data.income).toFixed(2)}`;
  el('expense').textContent = `₹${Number(data.expense).toFixed(2)}`;
  el('savings').textContent = `₹${Number(data.savings).toFixed(2)}`;
  el('budgetView').textContent = `₹${Number(data.budget).toFixed(2)}`;
  el('insight').textContent = `${data.insight} (Status: ${data.budgetStatus})`;
}

async function loadTransactions() {
  if (!token) return;
  const rows = await api('/api/transactions', { headers: authHeaders() });
  const body = el('transactionsBody');
  body.innerHTML = '';
  rows.forEach((tx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${tx.date}</td>
      <td>${tx.type}</td>
      <td>${tx.category || '-'}</td>
      <td>₹${Number(tx.amount).toFixed(2)}</td>
      <td>${tx.note || '-'}</td>
    `;
    body.appendChild(tr);
  });
}

async function refreshAll() {
  await loadDashboard();
  await loadTransactions();
}

function wireEvents() {
  el('registerBtn').addEventListener('click', register);
  el('loginBtn').addEventListener('click', login);
  el('logoutBtn').addEventListener('click', logout);
  el('addTransactionBtn').addEventListener('click', addTransaction);
  el('saveBudgetBtn').addEventListener('click', saveBudget);
  el('refreshDashboardBtn').addEventListener('click', refreshAll);

  const today = new Date().toISOString().slice(0, 10);
  el('date').value = today;
  el('month').value = monthNow();
}

(async function init() {
  wireEvents();
  if (token) {
    try {
      await loadCategories();
      await refreshAll();
      setStatus('Session restored.');
    } catch {
      logout();
    }
  }
})();
