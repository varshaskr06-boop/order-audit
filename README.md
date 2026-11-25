# Sri Meenakshi Agro & Traditional Foods Pvt Ltd
## Enterprise Order-to-Audit Management System (Food Manufacturing ERP)

An enterprise-grade, full-stack Order-to-Audit Management System engineered for a commercial food manufacturing enterprise in Madurai, Tamil Nadu (producing fresh stone-ground Idli & Dosa Batter, traditional Murukku, Madras Mixture, Appalam, and Ghee Mysore Pak).

Built with **React 18, Vite, Node.js, Express.js, PostgreSQL 14+, JWT authentication, and bcrypt**, covering the complete 15-phase manufacturing, compliance, and financial lifecycle.

---

## 🏆 Complete 15-Phase Implementation Status

| Phase | Module Name | Core Capabilities | Status |
|:---:|---|---|:---:|
| **1** | System Foundation & Environment | Dual-mode PostgreSQL/in-memory, health APIs, architecture | ✅ 100% Complete |
| **2** | Authentication & RBAC | JWT, bcrypt (10 rounds), 5 roles, route guards, session management | ✅ 100% Complete |
| **3** | Master Data Management | Products, B2B Customers, Agro Suppliers, RM, PM, BOM recipes | ✅ 100% Complete |
| **4** | Sales Order Management | Order entry, GST preview, submit/approval workflow, print DC | ✅ 100% Complete |
| **5** | Procurement Management | Requisitions (PR), Quotations, POs, Approvals, GRN, 3-Way Match | ✅ 100% Complete |
| **6** | Inventory Management | Stock ledger, batches, warehouse locations, valuation, reorder levels | ✅ 100% Complete |
| **7** | Production Management | Production plans, orders, material issues, returns, FG receipts | ✅ 100% Complete |
| **8** | Quality Control & FSSAI | Incoming/in-process/FG inspections, batch release, CAPA actions | ✅ 100% Complete |
| **9** | Product Costing | Actual batch costing (RM + Labor + Overhead), cost variances | ✅ 100% Complete |
| **10** | GST Billing & Invoicing | Sequential tax invoices, CGST/SGST/IGST split, credit notes, GSTR-1 | ✅ 100% Complete |
| **11** | Dispatch & Logistics | Dispatch orders, vehicle tracking, delivery challans, POD capture | ✅ 100% Complete |
| **12** | Payment Management | Customer receipts, supplier payouts, ledger, bank reconciliation | ✅ 100% Complete |
| **13** | Audit Management | Internal audit planning, department checklists, findings, CAPA | ✅ 100% Complete |
| **14** | Reports & Analytics | Executive dashboard, 10 KPI modules, interactive SVG charts, scheduler | ✅ 100% Complete |
| **15** | Final Integration & Deployment | 25-step E2E flow, security hardening, backups, Vercel/Render configs | ✅ 100% Complete |

---

## 📚 Complete Project Documentation Suite

The root directory contains 10 dedicated documentation markdown files:

1. 📖 **[README.md](file:///c:/Users/asaab/Desktop/NIT/README.md)** – Comprehensive ERP Overview & Master System Guide
2. ⚙️ **[INSTALLATION.md](file:///c:/Users/asaab/Desktop/NIT/INSTALLATION.md)** – Step-by-Step Setup Guide for Windows, Linux & macOS
3. 🗄️ **[DATABASE_SETUP.md](file:///c:/Users/asaab/Desktop/NIT/DATABASE_SETUP.md)** – PostgreSQL Architecture, Migrations 001–013 & Dual-Mode Fallback
4. 🔌 **[API_DOCUMENTATION.md](file:///c:/Users/asaab/Desktop/NIT/API_DOCUMENTATION.md)** – Complete REST API Reference across all 15 modules
5. 👤 **[USER_GUIDE.md](file:///c:/Users/asaab/Desktop/NIT/USER_GUIDE.md)** – Role-by-Role Operational Workflows (Sales, Production, QC, Accounts)
6. 🛡️ **[ADMIN_GUIDE.md](file:///c:/Users/asaab/Desktop/NIT/ADMIN_GUIDE.md)** – Administrative Governance, User RBAC & Report Scheduling
7. 🚀 **[DEPLOYMENT_GUIDE.md](file:///c:/Users/asaab/Desktop/NIT/DEPLOYMENT_GUIDE.md)** – Production Deployment (Vercel, Render, Neon PostgreSQL)
8. 💾 **[BACKUP_RESTORE_GUIDE.md](file:///c:/Users/asaab/Desktop/NIT/BACKUP_RESTORE_GUIDE.md)** – Automated Backups, Snapshot Dumps & SHA-256 Recovery
9. 🧪 **[TESTING_REPORT.md](file:///c:/Users/asaab/Desktop/NIT/TESTING_REPORT.md)** – 271 Automated Tests Verification (100% Pass)
10. 🔒 **[SECURITY_REPORT.md](file:///c:/Users/asaab/Desktop/NIT/SECURITY_REPORT.md)** – Security Hardening, Rate Limiting & Statutory Audit

---

## ⚡ Quick Start (Windows / PowerShell)

### 1. Install Dependencies
```powershell
# From project root
cd backend && npm install && cd ../frontend && npm install && cd ..
```

### 2. Configure Environment Files
```powershell
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Start Application
**Terminal 1 (Backend API - Port 5000):**
```powershell
node backend/server.js
```

**Terminal 2 (Frontend Client - Port 5173):**
```powershell
npm --prefix frontend run dev
```

Open `http://localhost:5173` in your browser.

---

## 👥 Default Demo Credentials

| Role | Email | Password | Access Highlights |
|---|---|---|---|
| **System Admin** | `admin@meenakshifoods.in` | `Admin@123` | User Governance, Master Data, System Settings |
| **Business Owner** | `owner@meenakshifoods.in` | `Owner@123` | Executive Dashboard, High-Value Approvals |
| **Production Supervisor**| `production@meenakshifoods.in`| `Production@123`| Requisitions, Batch Issues, FG Receipts |
| **Sales Executive** | `sales@meenakshifoods.in` | `Sales@123` | Sales Orders, Pricing Calculator, Customers |
| **Auditor / Accountant** | `auditor@meenakshifoods.in` | `Auditor@123` | GST Invoicing, Payments, Audit Plans & CAPA |

---

## 🧪 Automated Testing & Verification

Run the complete 271-test validation suite:

```powershell
# 1. Full 25-Step Business Flow + Security Negative Tests
node backend/test-e2e-workflow.js

# 2. Phase 14 Analytics & Reports Test Suite (59 tests)
node backend/test-analytics.js

# 3. Phase 13 Audit Management Test Suite (39 tests)
node backend/test-audit.js

# 4. Phase 12 Payment Management Test Suite (33 tests)
node backend/test-payments.js

# 5. Phase 11 Dispatch & Logistics Test Suite (27 tests)
node backend/test-dispatch.js

# 6. Phase 10 GST Invoicing Test Suite (24 tests)
node backend/test-invoicing.js

# 7. Phase 9 Costing Management Test Suite (25 tests)
node backend/test-costing.js

# 8. Phase 8 Quality Control & FSSAI Test Suite (24 tests)
node backend/test-quality.js
```

**All 271 test cases pass with a 100% success rate.**

---

## 📦 Database Backup & Restore

```powershell
# Execute automated backup (Live pg_dump or JSON snapshot + SHA-256)
node database/scripts/backup.js

# Execute automated restoration with checksum verification
node database/scripts/restore.js
```
