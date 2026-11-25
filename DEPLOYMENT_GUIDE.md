# Production Deployment Guide
## Sri Meenakshi Agro & Traditional Foods ERP System

This guide outlines deploying the Order-to-Audit Management System to production environments using **Vercel** (Frontend SPA), **Render** (Node.js API), and **Neon** (Cloud PostgreSQL).

---

## 1. Cloud Architecture Overview

```text
[ Browser Clients ]
         │
         ▼
[ Vercel CDN ]  ──> React 18 Frontend SPA (https://meenakshi-erp.vercel.app)
         │
         ▼ (HTTPS / REST API)
[ Render Web Service ] ──> Express.js Backend API (https://api.meenakshi-erp.onrender.com)
         │
         ▼ (Encrypted TLS Connection)
[ Neon Cloud PostgreSQL ] ──> Managed PostgreSQL 16 (food_mfg_db)
```

---

## 2. Database Deployment: Neon PostgreSQL

1. Sign up or log in to [neon.tech](https://neon.tech).
2. Click **Create Project**:
   - **Project Name:** `sri-meenakshi-erp-prod`
   - **Database Name:** `food_mfg_db`
   - **Region:** `Asia-Pacific (Singapore)` for lowest latency to India.
3. Copy your Neon connection string:
   ```text
   postgres://alex:secret_password@ep-cool-frost-123456.ap-southeast-1.aws.neon.tech/food_mfg_db?sslmode=require
   ```
4. Run migrations from your terminal:
   ```powershell
   Get-ChildItem -Path "database/migrations/*.sql" | Sort-Object Name | ForEach-Object {
       psql "YOUR_NEON_CONNECTION_STRING" -f $_.FullName
   }
   psql "YOUR_NEON_CONNECTION_STRING" -f database/seed.sql
   ```

---

## 3. Backend Deployment: Render Web Service

1. Create a free account at [render.com](https://render.com).
2. Click **New + > Web Service** and link your Git repository.
3. Configure the service settings:
   - **Name:** `sri-meenakshi-erp-backend`
   - **Region:** `Singapore`
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Set Environment Variables in Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `CORS_ORIGIN`: `https://sri-meenakshi-erp.vercel.app` (or your production frontend domain)
   - `JWT_SECRET`: Generate a secure 64-character random string
   - `JWT_EXPIRES_IN`: `24h`
   - `DATABASE_URL`: `YOUR_NEON_CONNECTION_STRING`
   - `DB_SSL`: `true`
5. Click **Create Web Service**. Once deployed, Render provides a public URL (e.g. `https://sri-meenakshi-erp-backend.onrender.com`).
6. Test endpoint: `https://sri-meenakshi-erp-backend.onrender.com/api/health`

---

## 4. Frontend Deployment: Vercel

1. Log in to [vercel.com](https://vercel.com).
2. Click **Add New... > Project** and import the repository.
3. In the project configuration:
   - **Framework Preset:** `Vite`
   - **Root Directory:** Edit and select `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://sri-meenakshi-erp-backend.onrender.com`
5. Click **Deploy**. Vercel will build the React application and deploy it to a global edge network.
6. Verify SPA routing: Navigating directly to routes like `/analytics/executive-dashboard` works smoothly thanks to `vercel.json` rewrites.

---

## 5. Post-Deployment Verification Checklist

- [ ] Visit the frontend URL in your browser.
- [ ] Log in with `admin@meenakshifoods.in` / `Admin@123`.
- [ ] Check `/api/health` and verify `database: "CONNECTED"` and `status: "HEALTHY"`.
- [ ] Create a test sales order and verify it transitions to approved.
- [ ] Run automated remote smoke test:
  ```powershell
  # Check live health status
  curl https://sri-meenakshi-erp-backend.onrender.com/api/health
  ```
