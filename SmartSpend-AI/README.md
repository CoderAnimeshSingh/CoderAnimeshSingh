# SmartSpend AI (Major Project)

SmartSpend AI is a complete final-semester BCA major project kit that includes:

1. A working **full-stack web application** for personal finance management.
2. A structured **research/dissertation report template**.
3. **Viva preparation** questions and model answers.
4. A **presentation script** for project defense.

---

## 1) Project Summary

**Problem solved:** Students and working professionals often track expenses manually and fail to follow budgets.

**Proposed solution:** SmartSpend AI offers transaction tracking, monthly dashboard analytics, budget alerts, and insight generation.

**Core modules:**
- Authentication (register/login)
- Category management
- Transaction management
- Budget setup
- Dashboard analytics (income/expense/savings)
- Insight engine

---

## 2) Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript (responsive UI)
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Auth:** JWT + bcrypt hashing

---

## 3) Run Instructions

### Backend

```bash
cd backend
npm install
npm start
```

Server runs at `http://localhost:4000`.

### Frontend

Open `frontend/index.html` in your browser.

> For production/demo, host frontend on Netlify/Vercel and backend on Render/Railway.

---

## 4) API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/categories`
- `POST /api/transactions`
- `GET /api/transactions`
- `POST /api/budgets`
- `GET /api/dashboard?month=YYYY-MM`

---

## 5) Viva Demo Flow (Recommended)

1. Register a user.
2. Add income and expense transactions.
3. Set monthly budget.
4. Show dashboard totals and insight text.
5. Open history and explain data flow.
6. Explain commercial feasibility (freemium SaaS model).

---

## 6) Documentation Pack

- `docs/PROJECT_REPORT_TEMPLATE.md` — chapter-wise dissertation file content.
- `docs/VIVA_QA.md` — high-probability viva questions with concise model answers.
- `docs/PRESENTATION_SCRIPT.md` — 10-minute presentation flow.

