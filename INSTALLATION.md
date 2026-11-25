# Installation & Setup Guide
## Sri Meenakshi Agro & Traditional Foods ERP System

This guide provides instructions for setting up and running the Order-to-Audit Management System on Windows, macOS, or Linux.

---

## 1. System Requirements

- **Operating System:** Windows 10/11, macOS 12+, or Ubuntu/Debian Linux
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **Package Manager:** `npm` v9+ (included with Node.js)
- **Database:** PostgreSQL v14+ (Optional: the system features a built-in in-memory fallback for offline or development environments)
- **Memory:** Minimum 4 GB RAM (8 GB recommended)
- **Disk Space:** 500 MB free space

---

## 2. Repository Structure

```text
NIT/
├── backend/            # Express.js REST API
├── frontend/           # React 18 + Vite SPA client
├── database/           # SQL Migrations (001-013) & Backup Utilities
├── package.json        # Unified workspace scripts
└── .env.example        # Environment variable templates
```

---

## 3. Step-by-Step Installation

### Step 3.1: Install Node.js Dependencies

Open PowerShell or terminal in the project root (`NIT`):

```powershell
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to project root
cd ..
```

### Step 3.2: Environment Configuration

Create the backend environment file from the provided template:

```powershell
cp backend/.env.example backend/.env
```

Review and adjust `backend/.env` if connecting to a live PostgreSQL instance:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secure_random_jwt_secret_key_meenakshi_foods_2026
JWT_EXPIRES_IN=24h
CORS_ORIGIN=http://localhost:5173

# PostgreSQL Settings (Optional: leave as is for automatic in-memory mode)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=food_mfg_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_SSL=false
```

For the frontend, create `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 4. Running the Application

### Option A: Running Backend & Frontend in Parallel (Two Terminals)

**Terminal 1 (Backend API):**
```powershell
cd backend
npm run dev
# Or: node server.js
```
The backend will launch on `http://localhost:5000`. You will see:
```text
================================================================
🚀 SRI MEENAKSHI AGRO & TRADITIONAL FOODS ERP BACKEND
================================================================
📡 Server listening on port : 5000
🌐 Base URL                 : http://localhost:5000
🩺 Health Check Endpoint    : http://localhost:5000/api/health
```

**Terminal 2 (Frontend Client):**
```powershell
cd frontend
npm run dev
```
The frontend Vite server will start on `http://localhost:5173`. Open this URL in your web browser.

---

## 5. Default Demonstration User Accounts

The system comes pre-seeded with 5 role-based accounts:

| Role | Email | Password | Primary Duties |
|---|---|---|---|
| **System Administrator** | `admin@meenakshifoods.in` | `Admin@123` | Master data, users, approvals, system configuration |
| **Business Owner** | `owner@meenakshifoods.in` | `Owner@123` | High-value PO & SO approvals, executive analytics |
| **Production Supervisor**| `production@meenakshifoods.in`| `Production@123`| Requisitions, batch manufacturing, material issues |
| **Sales Executive** | `sales@meenakshifoods.in` | `Sales@123` | Customer orders, price checking, order tracking |
| **Internal Auditor / CA** | `auditor@meenakshifoods.in` | `Auditor@123` | Invoicing, payment reconciliation, CAPA audits |

---

## 6. Verification and Health Checks

Check backend status:
```powershell
curl http://localhost:5000/api/health
curl http://localhost:5000/api/health/db
```

Run the end-to-end integration test suite:
```powershell
node backend/test-e2e-workflow.js
```
Expected output:
```text
================================================================
E2E TEST SUMMARY: 40 PASSED | 0 FAILED | 40 TOTAL
================================================================
```

---

## 7. Troubleshooting

1. **Port 5000 already in use:**
   - Change `PORT=5001` in `backend/.env` and update `VITE_API_BASE_URL=http://localhost:5001` in `frontend/.env`.
2. **PostgreSQL Connection Refused:**
   - The ERP features automatic fallback to resilient in-memory storage. All APIs, workflows, and tests continue running seamlessly without breaking.
3. **CORS Error in Browser:**
   - Ensure `CORS_ORIGIN` in `backend/.env` matches the URL of your frontend (default `http://localhost:5173`).
