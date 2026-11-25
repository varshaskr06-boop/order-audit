# System Administrator Guide
## Sri Meenakshi Agro & Traditional Foods ERP System

This guide covers administrative governance, security controls, user management, and report scheduler maintenance.

---

## 1. User Management & RBAC Governance

The ERP enforces strict Role-Based Access Control (RBAC) across 5 core roles:
- `ADMIN`: Full system configuration, user governance, audit configuration.
- `OWNER`: Business ownership, executive approvals, financial reports.
- `PRODUCTION`: Shopfloor scheduling, recipe execution, material issues.
- `SALESMAN`: Customer sales, quote previews, order tracking.
- `ACCOUNTANT`: GST compliance, costing calculations, payments, audit plans.

### 1.1 Creating New Staff Users
1. Log in with an `ADMIN` account (`admin@meenakshifoods.in`).
2. Navigate to **Administration > User Management**.
3. Click **Add New User**:
   - **Full Name:** Staff member name.
   - **Email:** Corporate email address (must be unique).
   - **Role:** Select one of the 5 roles.
   - **Password:** Minimum 8 characters, hashed using bcrypt (10 salt rounds).
4. Click **Create User**.

### 1.2 Account Activation / Deactivation
To revoke access without breaking transactional audit history:
1. Locate the user in the User Management registry.
2. Toggle the **Status** button from `ACTIVE` to `INACTIVE`.
3. Inactive users are immediately rejected by `/api/auth/login` and cannot generate JWTs.

---

## 2. Master Data Configuration & Recipes

### 2.1 Standard Recipe Formulations (BOM)
- Navigate to **Master Data > Bill of Materials**.
- Each BOM ties a Finished Good SKU to specific raw materials and packaging materials.
- Proportions are locked to 100 KG/unit output to ensure yield calculations remain standard.
- Any change to recipe proportions automatically prompts for a new BOM version (e.g., `v1.0` -> `v1.1`), preserving historical production order integrity.

---

## 3. Scheduled Report Management (Phase 14)

The ERP features an automated reporting engine for stakeholders:
1. Navigate to **Analytics > Scheduled Reports**.
2. Click **Create Scheduled Report**:
   - **Report Type:** Executive Dashboard, Sales Velocity, Production Yield, GST Invoicing Summary, or Payment Aging.
   - **Frequency:** `DAILY`, `WEEKLY`, or `MONTHLY`.
   - **Target Recipients:** Comma-separated email addresses.
   - **Format:** `PDF`, `EXCEL`, or `JSON`.
3. Check the **Execution History** tab to view execution status, runtime duration, and generated export archives.

---

## 4. Security & Audit Trail Governance

### 4.1 Login Security & Rate Limiting
- The backend features an in-memory rate limiter on `/api/auth/login` allowing a maximum of 10 login attempts per 15-minute window per IP to prevent brute-force attacks.
- Failed attempts are logged with HTTP 429 once the threshold is crossed.

### 4.2 Immutable Audit Logs
- Every state transition across Sales, Procurement, Production, Quality, and Payments generates an immutable entry in the audit history table with `user_id`, `user_name`, `action`, `previous_state`, `new_state`, and timestamp.
- Administrators can view audit trails directly on the details page of any transaction.
