# Database Setup & Migration Guide
## Sri Meenakshi Agro & Traditional Foods ERP System

This document outlines the PostgreSQL schema architecture, migration sequencing (Phases 1–14), and dual-mode resilient execution.

---

## 1. Dual-Mode Architecture

The ERP backend uses an enterprise **Dual-Mode Data Layer**:
1. **Live PostgreSQL Mode:** When a PostgreSQL instance is reachable, all transactions are executed with ACID guarantees (`pg` connection pool with automatic rollback on error).
2. **Resilient In-Memory Mode:** If PostgreSQL is offline or unreachable, models automatically switch to an in-memory repository with pre-seeded master data. This ensures uninterrupted development, demonstration, testing, and continuous deployment verification without database downtime.

To check the active database connection at any time:
```http
GET /api/health/db
```

---

## 2. PostgreSQL Installation & Database Creation

### Step 2.1: Install PostgreSQL
- **Windows:** Download and install PostgreSQL 14+ from [postgresql.org](https://www.postgresql.org/download/windows/). Ensure pgAdmin and Command Line Tools are selected.
- **Ubuntu/Debian:** `sudo apt install postgresql postgresql-contrib`
- **macOS:** `brew install postgresql@14 && brew services start postgresql@14`

### Step 2.2: Create Database
Open `psql` or pgAdmin Query Tool:

```sql
-- Create database
CREATE DATABASE food_mfg_db;

-- Connect to database
\c food_mfg_db;
```

---

## 3. Migration Sequencing (001 to 013)

All migrations are located in `database/migrations/` and must be applied in sequential order:

```text
001_phase2_users.sql         -> Users table, roles check constraints, bcrypt password storage
002_phase3_master_data.sql   -> Products, customers, suppliers, RM, PM, BOM recipes
003_phase4_sales_orders.sql  -> Sales orders, line items, status history, approval logs
004_phase5_procurement.sql   -> PR, Quotations, PO, GRN, Vendor Invoices, 3-Way Matching
005_phase6_inventory.sql     -> Warehouses, stock ledger, batches, stock adjustments, valuations
006_phase7_production.sql    -> Production plans, orders, material issues, returns, downtime, FG receipts
007_phase8_quality.sql       -> Inspection checklists, sample tests, batch release, CAPA actions
008_phase9_costing.sql       -> Batch costing, RM costs, overhead allocation, variances
009_phase10_gst_billing.sql  -> Company GST profile, tax invoices, credit/debit notes, GSTR-1
010_phase11_dispatch.sql     -> Dispatch orders, packing lists, vehicle DC, POD tracking
011_phase12_payments.sql     -> Customer receipts, supplier payouts, ledger, bank reconciliation
012_phase13_audit.sql        -> Audit plans, checklists, findings, observations, CAPA integration
013_phase14_analytics.sql    -> Saved reports, scheduled reports, execution log history
```

### Applying Migrations Automatically

On Windows PowerShell:
```powershell
Get-ChildItem -Path "database/migrations/*.sql" | Sort-Object Name | ForEach-Object {
    Write-Host "Applying $($_.Name)..." -ForegroundColor Cyan
    psql -h localhost -U postgres -d food_mfg_db -f $_.FullName
}
```

Or apply the complete single-file schema and seed:
```powershell
psql -h localhost -U postgres -d food_mfg_db -f database/schema.sql
psql -h localhost -U postgres -d food_mfg_db -f database/seed.sql
```

---

## 4. Key Table Schemas & Constraints

### 4.1 Master Data & BOM Relationships
- `products`: Finished food goods (HSN, GST rate 5%, shelf life, unit price).
- `boms` & `bom_items`: Master recipes defining raw materials and packaging proportions per 100 KG batch.
- `stock_ledger`: Append-only immutable inventory ledger recording all INWARD, OUTWARD, and ADJUSTMENT movements.

### 4.2 Segregation of Duties & Check Constraints
- `sales_orders`: Status transitions: `DRAFT` -> `SUBMITTED` -> `APPROVED` | `REJECTED` -> `FULFILLED` -> `CANCELLED`.
- `production_orders`: Requires BOM snapshot. Material issue strictly blocks negative inventory balances.
- `quality_inspections`: FSSAI parameter checks. Batches must be marked `PASSED` before dispatch order generation is permitted.
- `gst_invoices`: Strict Indian GST calculation: Intra-state (`CGST` + `SGST`) vs Inter-state (`IGST`).

---

## 5. Database Maintenance & Indexing

To ensure high performance during heavy batch processing:
```sql
-- Useful Performance Indexes
CREATE INDEX IF NOT EXISTS idx_stock_ledger_item_batch ON stock_ledger(item_id, batch_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_customer ON sales_orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_date ON invoices(customer_id, invoice_date);
CREATE INDEX IF NOT EXISTS idx_audit_plans_status ON audit_plans(status);
```
