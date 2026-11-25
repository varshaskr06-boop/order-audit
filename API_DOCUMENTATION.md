# API Documentation & Endpoint Reference
## Sri Meenakshi Agro & Traditional Foods ERP System

Complete reference for all 15 operational REST API modules.

**Base URL:** `http://localhost:5000/api`  
**Authentication:** Bearer JWT in `Authorization` header (`Bearer <token>`)

---

## 1. Authentication & Governance (`/api/auth`, `/api/users`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user, returns JWT and user profile |
| `POST` | `/api/auth/logout` | All Roles | Revoke active session token |
| `GET` | `/api/auth/me` | All Roles | Fetch current authenticated user claims |
| `GET` | `/api/users` | ADMIN, OWNER | List all users with pagination and role filters |
| `POST` | `/api/users` | ADMIN, OWNER | Create new staff user with bcrypt password |
| `PUT` | `/api/users/:id` | ADMIN, OWNER | Update user details or role |
| `PATCH`| `/api/users/:id/status`| ADMIN, OWNER | Activate or deactivate user account |

---

## 2. Master Data Management (`/api/master`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/master/products` | All Roles | List finished goods with HSN and GST rates |
| `POST` | `/api/master/products` | ADMIN, OWNER | Create new food product SKU |
| `GET` | `/api/master/customers` | All Roles | List B2B distributors and retail accounts |
| `POST` | `/api/master/customers` | ADMIN, OWNER, SALESMAN | Create customer profile with GSTIN |
| `GET` | `/api/master/suppliers` | All Roles | List agro commodity millers and packaging vendors |
| `POST` | `/api/master/suppliers` | ADMIN, OWNER | Register approved supplier |
| `GET` | `/api/master/raw-materials` | All Roles | List grains, pulses, spices, oil, and ghee |
| `POST` | `/api/master/raw-materials` | ADMIN, OWNER | Create raw material master |
| `GET` | `/api/master/packaging-materials` | All Roles | List pouches, cartons, and packaging SKUs |
| `POST` | `/api/master/packaging-materials` | ADMIN, OWNER | Create packaging material master |
| `GET` | `/api/master/boms` | All Roles | List Bill of Materials and recipe formulations |
| `POST` | `/api/master/boms` | ADMIN, OWNER | Create standard BOM recipe with ingredient ratios |

---

## 3. Sales Order Management (`/api/sales/orders`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/sales/orders` | All Roles (Scopered) | List sales orders (Salesmen scoped to own orders) |
| `POST` | `/api/sales/orders` | SALESMAN, ADMIN, OWNER | Create new sales order (DRAFT or SUBMITTED) |
| `GET` | `/api/sales/orders/:id` | All Roles | Retrieve order details and audit timeline |
| `POST` | `/api/sales/orders/:id/submit` | SALESMAN, ADMIN, OWNER | Submit draft order for management approval |
| `POST` | `/api/sales/orders/:id/approve` | ADMIN, OWNER | Formally approve sales order for fulfillment |
| `POST` | `/api/sales/orders/:id/reject` | ADMIN, OWNER | Reject sales order with mandatory reason |
| `POST` | `/api/sales/orders/calculate` | All Roles | Calculate live line item totals and GST breakdown |

---

## 4. Procurement Management (`/api/purchase`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/purchase/requisitions` | All Roles | List internal purchase requisitions |
| `POST` | `/api/purchase/requisitions` | PRODUCTION, ADMIN, OWNER| Create material replenishment requisition |
| `GET` | `/api/purchase/orders` | All Roles | List purchase orders with status filter |
| `POST` | `/api/purchase/orders` | ADMIN, OWNER | Generate vendor PO linked to PR |
| `POST` | `/api/purchase/orders/:id/submit` | ADMIN, OWNER | Submit PO for executive signing |
| `POST` | `/api/purchase/orders/:id/approve` | OWNER, ADMIN | Authorize purchase order |
| `POST` | `/api/purchase/grns` | ADMIN, PRODUCTION | Record Goods Receipt Note (GRN) |
| `POST` | `/api/purchase/grns/:id/post` | ADMIN, OWNER | Post GRN to update inventory ledger |
| `POST` | `/api/purchase/three-way-match` | ACCOUNTANT, OWNER | Perform 3-Way Match (PO ↔ GRN ↔ Invoice) |

---

## 5. Inventory Management (`/api/inventory`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/inventory/raw-materials` | All Roles | Current raw material stock levels |
| `GET` | `/api/inventory/finished-goods` | All Roles | Finished food goods inventory by batch |
| `GET` | `/api/inventory/stock-ledger` | All Roles | Complete immutable audit ledger of stock movements |
| `POST` | `/api/inventory/adjustments` | ADMIN, OWNER | Record physical audit stock reconciliation |

---

## 6. Production & Shopfloor (`/api/production`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/production/orders` | All Roles | List manufacturing production orders |
| `POST` | `/api/production/orders` | PRODUCTION, ADMIN, OWNER| Create production order with recipe snapshot |
| `PATCH`| `/api/production/orders/:id/status`| ADMIN, OWNER, PROD | Update status (APPROVED, IN_PROGRESS, COMPLETED)|
| `POST` | `/api/production/orders/:id/issues`| PRODUCTION, ADMIN | Issue raw materials from stock to shopfloor |
| `POST` | `/api/production/orders/:id/returns`| PRODUCTION, ADMIN | Return unused raw materials to warehouse |
| `POST` | `/api/production/orders/:id/fg-receipts`| PRODUCTION, ADMIN | Record finished goods receipt and generate batch |

---

## 7. Quality Control & FSSAI (`/api/quality`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/quality/inspections` | All Roles | List quality control inspection records |
| `POST` | `/api/quality/inspections` | ADMIN, PRODUCTION, OWNER | Record sensory & lab tests (Moisture, Acidity, etc.) |
| `GET` | `/api/quality/batches/:batch/release-status`| All Roles | Verify if finished batch is approved for dispatch |
| `POST` | `/api/quality/capa` | ADMIN, OWNER, AUDITOR | Log Corrective & Preventive Action (CAPA) |

---

## 8. Product Costing (`/api/costing`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/costing/batches/calculate` | ACCOUNTANT, OWNER, ADMIN | Compute actual batch unit cost (RM + Labor + Overhead) |
| `GET` | `/api/costing/batches/:batch` | ACCOUNTANT, OWNER, ADMIN | Get cost variance breakdown against standard BOM |

---

## 9. GST Invoicing & Billing (`/api/invoicing`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/invoicing/invoices` | ACCOUNTANT, OWNER, ADMIN | List issued sequential GST tax invoices |
| `POST` | `/api/invoicing/invoices` | ACCOUNTANT, OWNER, ADMIN | Generate tax invoice with CGST/SGST/IGST split |
| `POST` | `/api/invoicing/calculate-tax` | All Roles | Pure tax calculation engine preview |
| `GET` | `/api/invoicing/gstr-1` | ACCOUNTANT, OWNER | Export GSTR-1 compliant B2B summary |

---

## 10. Dispatch & Logistics (`/api/dispatch`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/dispatch/orders` | All Roles | List dispatch shipments |
| `POST` | `/api/dispatch/orders` | ADMIN, OWNER, PROD | Create dispatch order (requires QC release) |
| `POST` | `/api/dispatch/pod` | ADMIN, OWNER, PROD | Record Proof of Delivery (mark DELIVERED) |

---

## 11. Payments & Reconciliation (`/api/payments`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/payments/customer-payments`| ACCOUNTANT, OWNER, ADMIN| Record customer collection receipt |
| `POST` | `/api/payments/supplier-payments`| ACCOUNTANT, OWNER, ADMIN| Record vendor payment payout |
| `POST` | `/api/payments/reconcile` | ACCOUNTANT, OWNER | Reconcile bank statement line with payment |

---

## 12. Audit Management (`/api/audit`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/audit/plans` | AUDITOR, OWNER, ADMIN | List internal audit plans |
| `POST` | `/api/audit/plans` | AUDITOR, OWNER, ADMIN | Create new internal audit plan |
| `POST` | `/api/audit/findings` | AUDITOR, OWNER, ADMIN | Record audit non-conformance finding |

---

## 13. Reports & Analytics (`/api/analytics`)

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/api/analytics/executive-dashboard` | ADMIN, OWNER, ACCOUNTANT| Top-level KPI overview (Gross Revenue, Orders, Margins)|
| `GET` | `/api/analytics/sales` | ADMIN, OWNER, ACCOUNTANT, SALES| Sales metrics, customer concentration |
| `GET` | `/api/analytics/production` | ADMIN, OWNER, PROD | Production yields, batch efficiencies |
| `GET` | `/api/analytics/saved-reports` | All Roles | List configured custom reports |
| `POST` | `/api/analytics/scheduled-reports` | ADMIN, OWNER | Schedule automated report generation |
| `GET` | `/api/analytics/execution-history` | ADMIN, OWNER, ACCOUNTANT| Audit trail of report exports |
