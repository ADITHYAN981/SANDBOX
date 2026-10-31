# Brightloop Software — Enterprise Subscription & Billing Platform

Full-Stack Node.js, Express, Prisma ORM, and Render PostgreSQL application with an interactive dashboard, subscription lifecycle management, and recurring billing automation.

---

## Architecture Overview

```
odoo/
├── index.html                      # Single-Page Application (SPA) UI
├── style.css                       # Enterprise design system
├── script.js                       # Frontend client + ApiClient (auto-detects origin)
├── render.yaml                     # 1-Click Render Blueprint configuration
└── backend/
    ├── server.js                   # Node.js entry point & graceful shutdown
    ├── prisma/
    │   ├── schema.prisma           # Relational schema (Users, Teams, Subs, Invoices, etc.)
    │   └── migrations/             # Version-controlled SQL migration scripts
    └── src/
        ├── app.js                  # Express app (serves API & static frontend)
        ├── config/                 # Env loader with fail-fast validation & Prisma singleton
        ├── middleware/             # JWT auth, role authorization, Zod validation, error handling
        ├── routes/                 # REST endpoints (/api/auth, /api/subscriptions, etc.)
        ├── controllers/            # Request handlers
        └── services/               # Database operations & business logic
```

---

## Features Implemented

1. **Authentication & Authorization**:
   - `POST /api/auth/register`: Create user account with bcrypt salted hash.
   - `POST /api/auth/login`: Authenticate and issue signed JWT tokens.
   - `GET /api/auth/me`: Validate and persist active session on page reload.
   - Role-Based Access Control (RBAC): `admin`, `staff`, and `customer`.

2. **Team & Staff Management**:
   - `GET /api/teams` & `POST /api/teams`: Multi-member team workspace support.
   - `GET /api/staff` & `POST /api/staff`: Administrator-controlled staff permissions.

3. **Subscription Lifecycle Engine**:
   - `GET /api/subscriptions`: Filterable by stage (`Draft`, `Quotation`, `Confirmed`, `Active`, `Paused`, `Closed`).
   - `POST /api/subscriptions`: Create offers from scratch or quotation templates.
   - `PUT /api/subscriptions/:id`: Advance state machine through the lifecycle pipeline.

4. **Automated Billing Day**:
   - `POST /api/invoices/run-billing-day`: Scans all active contracts, calculates taxes and discounts, generates recurring invoices, and advances contract next billing date.

5. **Financial Analytics & Payments**:
   - `GET /api/dashboard/stats`: Real-time MRR, ARR, cash collected, and overdue metrics.
   - `POST /api/payments`: Settle invoices and record bank reconciliation logs.

---

## Quick Start (Local Development)

### 1. Install & Build Backend
```bash
cd backend
npm install
npm run prisma:generate
```

### 2. Start the Server
```bash
npm run dev
```

### 3. Open the Application
Navigate to **http://localhost:5000** in your web browser. Express will automatically serve the frontend UI and proxy all `/api/*` endpoints to the database.

---

## Deploying to Render

### Option A: Automatic Blueprint Deployment (Recommended)
1. Push this repository to GitHub or GitLab.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** → **Blueprint**.
3. Select your repository. Render will automatically detect `render.yaml` and configure the web service and environment variables for you.
4. When prompted, link your existing `sanboxpostgres` database URL to `DATABASE_URL`.

### Option B: Manual Web Service Setup
1. In the Render Dashboard, click **New +** → **Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Name**: `brightloop-subscription-manager`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Region**: `Oregon` (same region as your database for lowest latency)
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `npm start`
4. Add Environment Variables:
   - `DATABASE_URL`: Your Render internal database connection string (`postgresql://...`)
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: A secure 64+ character secret
   - `CORS_ORIGIN`: `*`
   - `PORT`: `10000`

---

## Health Check & Verification

Once deployed, ping your health check:
```bash
curl https://your-service-name.onrender.com/api/health
```

Expected response:
```json
{
  "success": true,
  "status": "ok",
  "message": "Brightloop backend is running.",
  "database": "connected",
  "environment": "production"
}
```
