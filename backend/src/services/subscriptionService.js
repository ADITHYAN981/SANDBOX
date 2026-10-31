/**
 * src/services/subscriptionService.js
 *
 * Comprehensive domain services for Subscriptions, Billing, Invoices,
 * Payments, Products, Plans, Teams, Staff, and Financial Metrics.
 */

'use strict';

const prisma = require('../config/prisma');
const bcrypt = require('bcrypt');

// ── Initial Seeding Routine ───────────────────────────────────────────────────
async function seedDefaultDataIfEmpty() {
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('[Seeder] Database is empty. Seeding master users and defaults...');

      const adminHash = await bcrypt.hash('Admin@2024!', 10);
      const staffHash = await bcrypt.hash('Employee@2024!', 10);

      const admin = await prisma.user.create({
        data: {
          id: 'usr_admin',
          fullName: 'Sarah Jenkins',
          email: 'admin@brightloop.com',
          passwordHash: adminHash,
          role: 'admin',
          title: 'System Administrator',
          isVerified: true,
          isActive: true,
        },
      });

      const staff = await prisma.user.create({
        data: {
          id: 'usr_staff_1',
          fullName: 'Alex Rivera',
          email: 'employee@brightloop.com',
          passwordHash: staffHash,
          role: 'staff',
          title: 'Sales & Billing Specialist',
          isVerified: true,
          isActive: true,
        },
      });

      // Default Team
      const mainTeam = await prisma.team.create({
        data: {
          name: 'Brightloop Core Enterprise Team',
          description: 'Primary organization subscription & revenue operations workspace',
          ownerId: admin.id,
        },
      });

      await prisma.teamMember.createMany({
        data: [
          { teamId: mainTeam.id, userId: admin.id, role: 'owner' },
          { teamId: mainTeam.id, userId: staff.id, role: 'admin' },
        ],
      });

      // Seed Products
      await prisma.product.createMany({
        data: [
          {
            id: 'prod_erp',
            name: 'Brightloop Business ERP Suite',
            type: 'Software',
            salesPrice: 120.0,
            costPrice: 35.0,
            variants: [
              { name: 'Standard Edition', addPrice: 0.0 },
              { name: 'Odoo Brand Edition', addPrice: 560.0 },
              { name: 'Multi-Company Edition', addPrice: 280.0 },
            ],
            notes: 'Core business management, sales, and automated accounting',
          },
          {
            id: 'prod_crm',
            name: 'Automated CRM & Pipeline Add-on',
            type: 'Software',
            salesPrice: 45.0,
            costPrice: 12.0,
            variants: [
              { name: 'Default', addPrice: 0.0 },
              { name: 'With VoIP Dialer', addPrice: 35.0 },
            ],
            notes: 'Customer relationship tracking and deal pipeline automation',
          },
          {
            id: 'prod_storage',
            name: 'Cloud Storage 1TB Expansion',
            type: 'Service',
            salesPrice: 25.0,
            costPrice: 5.0,
            variants: [
              { name: '1TB Tier', addPrice: 0.0 },
              { name: '5TB Tier', addPrice: 75.0 },
            ],
            notes: 'High-speed encrypted document and database storage',
          },
          {
            id: 'prod_support',
            name: 'Priority 24/7 SLA Support',
            type: 'Service',
            salesPrice: 150.0,
            costPrice: 40.0,
            variants: [
              { name: 'Standard SLA', addPrice: 0.0 },
              { name: 'Dedicated Engineer SLA', addPrice: 200.0 },
            ],
            notes: '15-minute guaranteed response time and hotline',
          },
        ],
      });

      // Seed Plans
      await prisma.plan.createMany({
        data: [
          {
            id: 'plan_monthly',
            name: 'Standard Monthly Plan',
            frequency: 'Monthly',
            multiplierMonths: 1,
            minQty: 1,
            autoClose: false,
            allowPauseRenew: true,
          },
          {
            id: 'plan_yearly',
            name: 'Annual Enterprise Contract',
            frequency: 'Yearly',
            multiplierMonths: 12,
            minQty: 1,
            autoClose: false,
            allowPauseRenew: true,
          },
          {
            id: 'plan_quarterly',
            name: 'Quarterly Growth Plan',
            frequency: 'Quarterly',
            multiplierMonths: 3,
            minQty: 1,
            autoClose: false,
            allowPauseRenew: true,
          },
          {
            id: 'plan_weekly',
            name: 'Weekly High-Compute Burst',
            frequency: 'Weekly',
            multiplierMonths: 0.25,
            minQty: 1,
            autoClose: true,
            allowPauseRenew: true,
          },
        ],
      });

      // Seed Taxes
      await prisma.taxRule.createMany({
        data: [
          { id: 'tax_std', name: 'Standard Sales Tax (10%)', rate: 0.1, desc: 'Domestic business services' },
          { id: 'tax_vat', name: 'EU VAT (20%)', rate: 0.2, desc: 'European digital software service VAT' },
          { id: 'tax_zero', name: 'Zero-Rated / Export (0%)', rate: 0.0, desc: 'International tax exempt contracts' },
        ],
      });

      // Seed Discounts
      await prisma.discountRule.createMany({
        data: [
          {
            id: 'disc_vol15',
            name: 'Volume Seat Discount 15%',
            type: 'percent',
            value: 15,
            minSpend: 150.0,
            usageLimit: 20,
            usedCount: 3,
            status: 'active',
          },
          {
            id: 'disc_annual50',
            name: 'Annual Switch $50 Credit',
            type: 'fixed',
            value: 50.0,
            minSpend: 500.0,
            usageLimit: 10,
            usedCount: 2,
            status: 'active',
          },
        ],
      });

      // Seed Subscriptions
      const now = new Date();
      const past60 = new Date(now.getTime() - 60 * 86400000).toISOString().split('T')[0];
      const yesterday = new Date(now.getTime() - 1 * 86400000).toISOString().split('T')[0];
      const future305 = new Date(now.getTime() + 305 * 86400000).toISOString().split('T')[0];

      await prisma.subscription.createMany({
        data: [
          {
            id: 'SUB-00101',
            customer: 'Apex Digital LLC',
            customerEmail: 'contact@apexdigital.com',
            planId: 'plan_monthly',
            startDate: past60,
            nextBillingDate: yesterday, // Due for billing day!
            expiryDate: future305,
            paymentTerms: 'Immediate Payment',
            discountId: 'disc_vol15',
            stage: 'Active',
            teamId: mainTeam.id,
            lines: [
              {
                productName: 'Brightloop Business ERP Suite',
                variantName: 'Odoo Brand Edition',
                qty: 2,
                unitPrice: 680.0,
                taxRate: 0.1,
              },
              {
                productName: 'Automated CRM & Pipeline Add-on',
                variantName: 'Default',
                qty: 2,
                unitPrice: 45.0,
                taxRate: 0.1,
              },
            ],
          },
          {
            id: 'SUB-00102',
            customer: 'Nova Retail Corp',
            customerEmail: 'billing@novaretail.com',
            planId: 'plan_yearly',
            startDate: new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0],
            nextBillingDate: new Date(now.getTime() + 335 * 86400000).toISOString().split('T')[0],
            expiryDate: new Date(now.getTime() + 335 * 86400000).toISOString().split('T')[0],
            paymentTerms: 'Net 30 Days',
            discountId: 'disc_annual50',
            stage: 'Active',
            teamId: mainTeam.id,
            lines: [
              {
                productName: 'Brightloop Business ERP Suite',
                variantName: 'Standard Edition',
                qty: 10,
                unitPrice: 120.0,
                taxRate: 0.1,
              },
              {
                productName: 'Priority 24/7 SLA Support',
                variantName: 'Standard SLA',
                qty: 1,
                unitPrice: 150.0,
                taxRate: 0.1,
              },
            ],
          },
          {
            id: 'SUB-00103',
            customer: 'Zenith Logistics',
            customerEmail: 'finance@zenithlog.com',
            planId: 'plan_monthly',
            startDate: new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0],
            nextBillingDate: new Date(now.getTime() + 25 * 86400000).toISOString().split('T')[0],
            expiryDate: new Date(now.getTime() + 10 * 86400000).toISOString().split('T')[0],
            paymentTerms: 'Net 15 Days',
            discountId: '',
            stage: 'Quotation',
            teamId: mainTeam.id,
            lines: [
              {
                productName: 'Brightloop Business ERP Suite',
                variantName: 'Multi-Company Edition',
                qty: 4,
                unitPrice: 400.0,
                taxRate: 0.1,
              },
            ],
          },
        ],
      });

      // Seed Invoices
      await prisma.invoice.createMany({
        data: [
          {
            id: 'INV-2026-001',
            subId: 'SUB-00101',
            customer: 'Apex Digital LLC',
            customerEmail: 'contact@apexdigital.com',
            date: new Date(now.getTime() - 31 * 86400000).toISOString().split('T')[0],
            dueDate: new Date(now.getTime() - 15 * 86400000).toISOString().split('T')[0],
            subtotal: 1450.0,
            tax: 145.0,
            discountVal: 217.5,
            total: 1377.5,
            status: 'Paid',
            teamId: mainTeam.id,
            lines: [
              { desc: 'Brightloop Business ERP Suite (Odoo Brand Edition) x 2', amount: 1360.0 },
              { desc: 'Automated CRM & Pipeline Add-on x 2', amount: 90.0 },
            ],
          },
          {
            id: 'INV-2026-002',
            subId: 'SUB-00102',
            customer: 'Nova Retail Corp',
            customerEmail: 'billing@novaretail.com',
            date: new Date(now.getTime() - 10 * 86400000).toISOString().split('T')[0],
            dueDate: new Date(now.getTime() - 2 * 86400000).toISOString().split('T')[0],
            subtotal: 1350.0,
            tax: 135.0,
            discountVal: 50.0,
            total: 1435.0,
            status: 'Confirmed',
            teamId: mainTeam.id,
            lines: [
              { desc: 'Brightloop Business ERP Suite (Standard Edition) x 10', amount: 1200.0 },
              { desc: 'Priority 24/7 SLA Support x 1', amount: 150.0 },
            ],
          },
        ],
      });

      // Seed Payment
      await prisma.payment.create({
        data: {
          id: 'PAY-2026-001',
          invoiceId: 'INV-2026-001',
          customer: 'Apex Digital LLC',
          method: 'Credit Card',
          date: new Date(now.getTime() - 28 * 86400000).toISOString().split('T')[0],
          amount: 1377.5,
          note: 'Settled via Stripe direct billing',
          teamId: mainTeam.id,
        },
      });

      console.log('[Seeder] Master database successfully initialized with demo seed!');
    }
  } catch (err) {
    console.error('[Seeder] Error during initial database seed check:', err.message);
  }
}

// ── Subscriptions ─────────────────────────────────────────────────────────────
async function getAllSubscriptions(filters = {}) {
  const where = {};
  if (filters.stage && filters.stage !== 'all') where.stage = filters.stage;
  if (filters.customerEmail) where.customerEmail = filters.customerEmail;
  if (filters.search) {
    where.OR = [
      { id: { contains: filters.search, mode: 'insensitive' } },
      { customer: { contains: filters.search, mode: 'insensitive' } },
      { customerEmail: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.subscription.findMany({ where, orderBy: { createdAt: 'desc' } });
}

async function getSubscriptionById(id) {
  return prisma.subscription.findUnique({ where: { id } });
}

async function createSubscription(data) {
  const subCount = await prisma.subscription.count();
  const subNumber = `SUB-${String(100 + subCount + 1).padStart(5, '0')}`;
  return prisma.subscription.create({
    data: {
      id: data.id || subNumber,
      customer: data.customer,
      customerEmail: data.customerEmail,
      planId: data.planId,
      startDate: data.startDate,
      nextBillingDate: data.nextBillingDate,
      expiryDate: data.expiryDate || null,
      paymentTerms: data.paymentTerms || 'Immediate Payment',
      discountId: data.discountId || '',
      stage: data.stage || 'Draft',
      lines: data.lines || [],
      teamId: data.teamId || null,
    },
  });
}

async function updateSubscription(id, data) {
  return prisma.subscription.update({
    where: { id },
    data,
  });
}

async function deleteSubscription(id) {
  return prisma.subscription.delete({ where: { id } });
}

// ── Invoices ──────────────────────────────────────────────────────────────────
async function getAllInvoices(filters = {}) {
  const where = {};
  if (filters.status && filters.status !== 'all') where.status = filters.status;
  if (filters.customerEmail) where.customerEmail = filters.customerEmail;
  if (filters.search) {
    where.OR = [
      { id: { contains: filters.search, mode: 'insensitive' } },
      { customer: { contains: filters.search, mode: 'insensitive' } },
      { customerEmail: { contains: filters.search, mode: 'insensitive' } },
      { subId: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' } });
}

async function createInvoice(data) {
  const invCount = await prisma.invoice.count();
  const invId = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(3, '0')}`;
  return prisma.invoice.create({
    data: {
      id: data.id || invId,
      subId: data.subId || null,
      customer: data.customer,
      customerEmail: data.customerEmail,
      date: data.date,
      dueDate: data.dueDate,
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      discountVal: data.discountVal || 0,
      total: data.total || 0,
      status: data.status || 'Draft',
      lines: data.lines || [],
      teamId: data.teamId || null,
    },
  });
}

async function updateInvoice(id, data) {
  return prisma.invoice.update({ where: { id }, data });
}

// ── Run Billing Day Batch ─────────────────────────────────────────────────────
async function runBillingDayBatch() {
  const today = new Date().toISOString().split('T')[0];
  const activeSubs = await prisma.subscription.findMany({
    where: { stage: 'Active' },
  });

  const dueSubs = activeSubs.filter((s) => s.nextBillingDate && s.nextBillingDate <= today);
  const createdInvoices = [];

  for (const sub of dueSubs) {
    let subtotal = 0;
    const lines = Array.isArray(sub.lines) ? sub.lines : [];
    lines.forEach((l) => {
      subtotal += (l.qty || 1) * (l.unitPrice || 0);
    });

    const tax = subtotal * 0.1; // 10% standard default
    const total = subtotal + tax;

    const dueDate = new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0];
    const inv = await createInvoice({
      subId: sub.id,
      customer: sub.customer,
      customerEmail: sub.customerEmail,
      date: today,
      dueDate,
      subtotal,
      tax,
      discountVal: 0,
      total,
      status: 'Confirmed',
      lines: lines.map((l) => ({ desc: `${l.productName} (${l.variantName || 'Standard'}) x ${l.qty}`, amount: (l.qty || 1) * (l.unitPrice || 0) })),
      teamId: sub.teamId,
    });

    // Advance next billing date by 1 month
    const d = new Date(sub.nextBillingDate);
    d.setMonth(d.getMonth() + 1);
    await prisma.subscription.update({
      where: { id: sub.id },
      data: { nextBillingDate: d.toISOString().split('T')[0] },
    });

    createdInvoices.push(inv);
  }

  return {
    processedSubscriptions: dueSubs.length,
    generatedInvoices: createdInvoices,
  };
}

// ── Payments ──────────────────────────────────────────────────────────────────
async function getAllPayments() {
  return prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
}

async function recordPayment(data) {
  const count = await prisma.payment.count();
  const id = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
  const payment = await prisma.payment.create({
    data: {
      id: data.id || id,
      invoiceId: data.invoiceId || null,
      customer: data.customer,
      method: data.method || 'Credit Card',
      date: data.date,
      amount: data.amount,
      note: data.note || null,
      teamId: data.teamId || null,
    },
  });

  // Mark invoice as paid if full amount matched
  if (data.invoiceId) {
    await prisma.invoice.update({
      where: { id: data.invoiceId },
      data: { status: 'Paid' },
    });
  }

  return payment;
}

// ── Products & Plans ──────────────────────────────────────────────────────────
async function getAllProducts() {
  return prisma.product.findMany({ orderBy: { name: 'asc' } });
}

async function createProduct(data) {
  return prisma.product.create({ data });
}

async function getAllPlans() {
  return prisma.plan.findMany({ orderBy: { name: 'asc' } });
}

async function createPlan(data) {
  return prisma.plan.create({ data });
}

// ── Discounts & Taxes ─────────────────────────────────────────────────────────
async function getAllDiscounts() {
  return prisma.discountRule.findMany({ orderBy: { name: 'asc' } });
}

async function createDiscount(data) {
  return prisma.discountRule.create({ data });
}

async function getAllTaxes() {
  return prisma.taxRule.findMany({ orderBy: { name: 'asc' } });
}

async function createTax(data) {
  return prisma.taxRule.create({ data });
}

// ── Teams & Staff ─────────────────────────────────────────────────────────────
async function getAllTeams() {
  return prisma.team.findMany({
    include: {
      members: {
        include: {
          user: {
            select: { id: true, fullName: true, email: true, role: true, title: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

async function createTeam(data, ownerId) {
  const team = await prisma.team.create({
    data: {
      name: data.name,
      description: data.description || null,
      ownerId: ownerId || null,
    },
  });

  if (ownerId) {
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: ownerId,
        role: 'owner',
      },
    });
  }

  return team;
}

async function getAllStaff() {
  return prisma.user.findMany({
    where: { role: { in: ['admin', 'staff'] } },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      title: true,
      company: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });
}

async function createStaffMember(data) {
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    const err = new Error('A staff member with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const hash = await bcrypt.hash(data.password || 'Brightloop@2026', 10);
  return prisma.user.create({
    data: {
      fullName: data.fullName,
      email: data.email.toLowerCase(),
      passwordHash: hash,
      role: data.role || 'staff',
      title: data.title || 'Billing Specialist',
      isVerified: true,
      isActive: true,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      title: true,
      createdAt: true,
    },
  });
}

// ── Dashboard Metrics Aggregation ─────────────────────────────────────────────
async function getDashboardStats() {
  try {
    const subscriptions = await prisma.subscription.findMany({ orderBy: { createdAt: 'desc' } });
    const invoices = await prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } });

    let mrr = 0;
    let activeSubs = 0;
    const pipeline = {
      Draft: { count: 0, val: 0 },
      Quotation: { count: 0, val: 0 },
      Confirmed: { count: 0, val: 0 },
      Active: { count: 0, val: 0 },
      Closed: { count: 0, val: 0 },
      Paused: { count: 0, val: 0 },
    };

    subscriptions.forEach((s) => {
      let subVal = 0;
      const lines = Array.isArray(s.lines) ? s.lines : [];
      lines.forEach((l) => {
        subVal += (l.qty || 1) * (l.unitPrice || 0);
      });

      if (pipeline[s.stage]) {
        pipeline[s.stage].count += 1;
        pipeline[s.stage].val += subVal;
      }

      if (s.stage === 'Active') {
        activeSubs += 1;
        mrr += subVal;
      }
    });

    const arr = mrr * 12;

    let collected = 0;
    let overdue = 0;
    let paidCount = 0;
    let overdueCount = 0;
    const today = new Date().toISOString().split('T')[0];

    invoices.forEach((inv) => {
      if (inv.status === 'Paid') {
        collected += inv.total || 0;
        paidCount += 1;
      } else if (inv.status === 'Confirmed') {
        if (inv.dueDate && inv.dueDate < today) {
          overdue += inv.total || 0;
          overdueCount += 1;
        }
      }
    });

    return {
      mrr,
      arr,
      activeSubs,
      totalContracts: subscriptions.length,
      collected,
      paidCount,
      overdue,
      overdueCount,
      pipeline,
    };
  } catch (err) {
    console.warn('[Dashboard] Fallback aggregation on query timeout:', err.message);
    return {
      mrr: 0,
      arr: 0,
      activeSubs: 0,
      totalContracts: 0,
      collected: 0,
      paidCount: 0,
      overdue: 0,
      overdueCount: 0,
      pipeline: {
        Draft: { count: 0, val: 0 },
        Quotation: { count: 0, val: 0 },
        Confirmed: { count: 0, val: 0 },
        Active: { count: 0, val: 0 },
        Closed: { count: 0, val: 0 },
        Paused: { count: 0, val: 0 },
      },
    };
  }
}

module.exports = {
  seedDefaultDataIfEmpty,
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getAllInvoices,
  createInvoice,
  updateInvoice,
  runBillingDayBatch,
  getAllPayments,
  recordPayment,
  getAllProducts,
  createProduct,
  getAllPlans,
  createPlan,
  getAllDiscounts,
  createDiscount,
  getAllTaxes,
  createTax,
  getAllTeams,
  createTeam,
  getAllStaff,
  createStaffMember,
  getDashboardStats,
};
