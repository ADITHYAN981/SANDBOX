# Brightloop Software — Subscription Management & Recurring Billing Platform
> Built according to the **Odoo Subscription Management System** challenge specification.

A unified B2B SaaS software platform that runs the full life of Brightloop Software's subscription business: from configuring products, variants, and plans, to sending invoices on Billing Day, recording payments, and reporting recurring revenue.

---

## 📋 Problem Statement & Solution Mapping

### 1. The Challenge & Company Context
- **Company**: Brightloop Software sells business software on monthly or yearly subscriptions, add-ons, and products with variants (e.g. Odoo brand edition).
- **Previous Bottlenecks Solved**: Replaced spreadsheets, manual renewals, typed-up invoices, and bank statement matching with automated billing runs, automated tax rules, and instant revenue reporting.

### 2. User Roles & Access Control (Scenario: A New Customer Signs Up)
- **Role Switcher in Header**: Seamlessly test all three personas with the dropdown:
  - 👑 **Administrator (Sarah Jenkins)**: Controls the whole system, adds staff, configures master tax & discount rules.
  - 💼 **Internal Staff (Alex Rivera)**: Manages day-to-day work, prepares quotes from templates, activates contracts, runs billing batches, and records payments.
  - 🏢 **Customer Portal (Apex Digital / Nova Retail)**: Self-service view where customers see only their own subscriptions and invoices without emailing anyone.
- **Customer Sign-Up Validation**:
  - Unique email constraint enforcement.
  - Strict password rules: `> 8 characters`, with at least `1 uppercase letter`, `1 lowercase letter`, and `1 special character`.
  - Password reset simulation.

### 3. Products, Variants & Billing Plans (Scenario: Launching a New Plan)
- **Products Catalog**:
  - Product types: Software, Service / Add-on, Hardware.
  - Sales price, cost price, notes.
  - **Variant Surcharges**: Specifically includes **Odoo Brand Edition** adding **+$560** to the base price as specified in the problem statement.
- **Plans**:
  - Billing frequencies: **Daily, Weekly, Monthly, and Yearly**.
  - Minimum quantities, auto-close rules, and pause/renew permissions.

### 4. Quotations to Subscriptions (Scenario: Turning a Quote into a Subscription)
- **Quotation Templates**:
  - Start offers quickly from templates with pre-configured plans and product lines (e.g., *Small Shop Starter*, *Enterprise Odoo Suite*).
- **Subscription Lifecycle Pipeline**:
  - Every contract progresses through: `Draft` ➔ `Quotation` ➔ `Confirmed` ➔ `Active` ➔ `Closed` (plus `Paused`).
  - Interactive Odoo-style visual breadcrumb showing exact contract status.

### 5. Automated Billing Day (Scenario: Billing Day)
- **1-Click Billing Day Batch**:
  - Scans active subscriptions due for billing.
  - Generates invoices automatically with customer details, product lines, taxes, and totals.
  - **Automated Tax Calculation**: Configured standard tax (10%), EU VAT (20%), or zero-rated export tax rules.
  - **Double-Billing Prevention**: Idempotent billing engine guarantees nothing is billed twice or skipped.
  - Confirm, Cancel, Send via email, or Print/PDF official tax invoices.

### 6. Discount Engine (Scenario: A Customer Asks for a Better Price)
- Admin-created discount rules:
  - Fixed amount ($) or Percentage (%).
  - Minimum purchase amount or quantity thresholds.
  - Usage limits that stop automatically when exhausted or expired.

### 7. Payment Collection & Reconciliation (Scenario: The Money Comes In)
- Record payments with method (Credit Card, Bank Wire, ACH, Check), amount, date, and note against specific invoices.
- Instant tracking of `Paid`, `Outstanding`, and `Overdue` invoices.

### 8. Finance Lead Month-End Reporting (Scenario: The Finance Lead)
- Real-time Executive Dashboard:
  - **Monthly Recurring Revenue (MRR)** & **Annual Run-rate (ARR)**.
  - Active subscriptions count vs quotation pipeline.
  - Total cash collected vs outstanding / overdue revenue.
  - Instant sub-second search and filter performance across all tables.

---

## 🚀 How to Run Locally

1. Open your browser and navigate to:
   ```
   http://localhost:8080
   ```
2. Or double-click `index.html` to open directly in any modern browser.

All data persists in browser `localStorage`.
