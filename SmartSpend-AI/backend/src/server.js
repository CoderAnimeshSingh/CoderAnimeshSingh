require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { db, initDatabase } = require('./db');
const { createToken, requireAuth } = require('./auth');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

initDatabase();

app.get('/health', (_, res) => res.json({ status: 'ok' }));

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) {
    return res.status(400).json({ message: 'Provide name, email, and password (min 6 chars).' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ message: 'Email already registered.' });
  }

  const hash = await bcrypt.hash(password, 10);
  const result = db
    .prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)')
    .run(name, email, hash);

  const user = { id: result.lastInsertRowid, email };
  const token = createToken(user);

  const defaultCategories = [
    ['Salary', 'income'],
    ['Freelance', 'income'],
    ['Food', 'expense'],
    ['Transport', 'expense'],
    ['Shopping', 'expense'],
    ['Utilities', 'expense']
  ];

  const insertCat = db.prepare('INSERT INTO categories (user_id, name, type) VALUES (?, ?, ?)');
  const insertMany = db.transaction((cats) => {
    cats.forEach(([catName, catType]) => insertCat.run(result.lastInsertRowid, catName, catType));
  });
  insertMany(defaultCategories);

  return res.status(201).json({ token, user: { id: user.id, name, email } });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials.' });
  }

  const token = createToken(user);
  return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

app.get('/api/categories', requireAuth, (req, res) => {
  const rows = db
    .prepare('SELECT id, name, type FROM categories WHERE user_id = ? ORDER BY name ASC')
    .all(req.user.id);
  res.json(rows);
});

app.post('/api/transactions', requireAuth, (req, res) => {
  const { category_id, amount, type, note, date } = req.body;
  if (!amount || !type || !date) {
    return res.status(400).json({ message: 'amount, type and date are required.' });
  }

  const result = db
    .prepare(
      'INSERT INTO transactions (user_id, category_id, amount, type, note, date) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(req.user.id, category_id || null, amount, type, note || null, date);

  return res.status(201).json({ id: result.lastInsertRowid });
});

app.get('/api/transactions', requireAuth, (req, res) => {
  const rows = db
    .prepare(
      `SELECT t.id, t.amount, t.type, t.note, t.date, c.name as category
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = ?
       ORDER BY t.date DESC, t.id DESC`
    )
    .all(req.user.id);

  res.json(rows);
});

app.post('/api/budgets', requireAuth, (req, res) => {
  const { month, limit_amount } = req.body;
  if (!month || !limit_amount) {
    return res.status(400).json({ message: 'month and limit_amount are required.' });
  }

  db.prepare(
    `INSERT INTO budgets (user_id, month, limit_amount) VALUES (?, ?, ?)
     ON CONFLICT(user_id, month) DO UPDATE SET limit_amount = excluded.limit_amount`
  ).run(req.user.id, month, limit_amount);

  res.json({ message: 'Budget saved.' });
});

app.get('/api/dashboard', requireAuth, (req, res) => {
  const month = req.query.month || new Date().toISOString().slice(0, 7);

  const income = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = ? AND type = 'income' AND substr(date, 1, 7) = ?`
    )
    .get(req.user.id, month).total;

  const expense = db
    .prepare(
      `SELECT COALESCE(SUM(amount), 0) AS total
       FROM transactions
       WHERE user_id = ? AND type = 'expense' AND substr(date, 1, 7) = ?`
    )
    .get(req.user.id, month).total;

  const budgetRow = db
    .prepare('SELECT limit_amount FROM budgets WHERE user_id = ? AND month = ?')
    .get(req.user.id, month);

  const budget = budgetRow ? budgetRow.limit_amount : 0;
  const savings = income - expense;
  const budgetStatus = budget > 0 ? (expense > budget ? 'OVER_LIMIT' : 'WITHIN_LIMIT') : 'NOT_SET';
  const overspendBy = budget > 0 && expense > budget ? expense - budget : 0;

  const insight =
    budgetStatus === 'OVER_LIMIT'
      ? `You exceeded your budget by ₹${overspendBy.toFixed(2)}. Reduce discretionary spending next month.`
      : budgetStatus === 'WITHIN_LIMIT'
      ? 'Great discipline! You are within budget. Consider investing your remaining surplus.'
      : 'Set a monthly budget to unlock smart spending insights.';

  res.json({ month, income, expense, savings, budget, budgetStatus, overspendBy, insight });
});

app.listen(PORT, () => {
  console.log(`SmartSpend AI backend running on http://localhost:${PORT}`);
});
