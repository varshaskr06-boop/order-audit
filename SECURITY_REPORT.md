# Security & Compliance Audit Report
## Sri Meenakshi Agro & Traditional Foods ERP System

**Date:** November 23, 2026  
**Phase:** Phase 15 – Final Security & Compliance Audit  
**Assessment:** PASSED (Enterprise Production Ready)

---

## 1. Security Architecture Summary

The ERP system incorporates defense-in-depth security principles across transport, authentication, authorization, database persistence, and operational auditing layers.

```text
[ Browser / API Client ]
         │
         ▼ (HTTPS / TLS 1.3)
[ Security Headers Middleware ] (nosniff, SAMEORIGIN, XSS-Protection)
         │
         ▼
[ CORS Origin Validation ] (Configured to authorized frontend domains)
         │
         ▼
[ Rate Limiter Middleware ] (Brute force protection on /api/auth/login)
         │
         ▼
[ JWT Authentication Guard ] (Stateless HS256 tokens, 24h expiration)
         │
         ▼
[ RBAC Authorization Guard ] (Strict 5-role segregation of duties)
         │
         ▼
[ Parameterized SQL Queries ] (pg library prevents SQL Injection)
         │
         ▼
[ PostgreSQL / Encrypted Storage ] (Zero plaintext passwords, bcrypt salt=10)
```

---

## 2. Core Security Controls Evaluated

### 2.1 Password Storage & Cryptography
- **Hashing Algorithm:** `bcryptjs` with 10 salt rounds.
- **Plaintext Passwords:** Zero plaintext passwords stored in database schemas, logs, or memory.
- **Password Complexity:** Minimum 8 characters enforced on creation and updates.

### 2.2 Authentication & Session Tokens
- **Mechanism:** JSON Web Tokens (JWT) signed with `HS256` and a configurable environment secret `JWT_SECRET`.
- **Token Expiry:** Configurable 24-hour expiration (`JWT_EXPIRES_IN=24h`).
- **Logout:** Explicit logout endpoint (`/api/auth/logout`) cleans client tokens and invalidates server sessions.

### 2.3 Role-Based Access Control (RBAC) & Segregation of Duties
The system enforces strict multi-tier permissions:
- **Sales Executive Isolation:** Sales executives can only view and manage sales orders created by their own user ID (`SALESMAN` role scoping).
- **Approval Separation:** A user cannot approve their own high-value purchase orders or sales orders without administrative/ownership authority (`ADMIN` or `OWNER`).
- **Production Isolation:** Production supervisors cannot alter financial invoicing records or view sensitive profit margin analytics.
- **Auditor Governance:** Internal auditors possess read-only inspection access across transactions with dedicated write access limited to audit plans, non-conformance findings, and CAPA logs.

### 2.4 SQL Injection Defense
- All database queries across all 15 modules utilize parameterized queries (`$1, $2, ...`) via the PostgreSQL `pg` driver.
- Dynamic string concatenation in SQL statements is strictly prohibited.

### 2.5 Security Headers & CORS
The backend Express application incorporates enterprise security headers:
- `X-Content-Type-Options: nosniff` (Prevents MIME-type sniffing).
- `X-Frame-Options: SAMEORIGIN` (Clickjacking defense).
- `X-XSS-Protection: 1; mode=block` (Cross-site scripting filter).
- `Referrer-Policy: strict-origin-when-cross-origin` (Protects referrer data in external transitions).
- `CORS`: Controlled via `CORS_ORIGIN` environment variable.

### 2.6 Rate Limiting
- Login route (`/api/auth/login`) is protected by an in-memory sliding window rate limiter:
  - Threshold: Max 10 attempts per 15-minute window per IP.
  - Mitigation: Returns HTTP 429 Too Many Requests upon exceeding threshold.

---

## 3. Statutory & FSSAI Compliance Controls

1. **Indian GST Rules:**
   - Tax engine strictly calculates intra-state supply (CGST 2.5% + SGST 2.5%) versus inter-state supply (IGST 5.0%) based on Buyer GSTIN state code vs Seller state code (`33` for Tamil Nadu).
   - Sequential, tamper-evident invoice numbering (`INV-2026-XXXX`).
   - Credit notes, debit notes, and GSTR-1 compliant monthly summary reports.
2. **FSSAI Food Traceability:**
   - Every finished goods batch code (`PB-FG001-YYYYMMDD-XXX`) maps directly back to the production order, the specific BOM recipe snapshot, the raw material batch numbers issued, and the supplier GRN.
   - Finished goods batches are locked against dispatch until released by an authorized Quality Inspector with a `PASSED` inspection record.
