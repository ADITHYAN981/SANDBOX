/**
 * src/routes/index.js
 *
 * Central route registry for all API modules.
 */

'use strict';

const { Router } = require('express');
const healthRouter = require('./health');
const authRouter = require('./auth');
const subCtrl = require('../controllers/subscriptionController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = Router();

// ── Health ────────────────────────────────────────────────────────────────────
router.use('/health', healthRouter);

// ── Authentication ────────────────────────────────────────────────────────────
router.use('/auth', authRouter);

// ── Dashboard Metrics ─────────────────────────────────────────────────────────
router.get('/dashboard/stats', subCtrl.getDashboard);

// ── Subscriptions ─────────────────────────────────────────────────────────────
router.get('/subscriptions', subCtrl.getSubscriptions);
router.post('/subscriptions', subCtrl.createSubscription);
router.put('/subscriptions/:id', subCtrl.updateSubscription);
router.delete('/subscriptions/:id', subCtrl.deleteSubscription);

// ── Invoices ──────────────────────────────────────────────────────────────────
router.get('/invoices', subCtrl.getInvoices);
router.post('/invoices', subCtrl.createInvoice);
router.put('/invoices/:id', subCtrl.updateInvoice);
router.post('/invoices/run-billing-day', subCtrl.runBillingDay);

// ── Payments ──────────────────────────────────────────────────────────────────
router.get('/payments', subCtrl.getPayments);
router.post('/payments', subCtrl.recordPayment);

// ── Products & Plans ──────────────────────────────────────────────────────────
router.get('/products', subCtrl.getProducts);
router.post('/products', subCtrl.createProduct);
router.get('/plans', subCtrl.getPlans);
router.post('/plans', subCtrl.createPlan);

// ── Discounts & Taxes ─────────────────────────────────────────────────────────
router.get('/discounts', subCtrl.getDiscounts);
router.post('/discounts', subCtrl.createDiscount);
router.get('/taxes', subCtrl.getTaxes);
router.post('/taxes', subCtrl.createTax);

// ── Teams & Staff ─────────────────────────────────────────────────────────────
router.get('/teams', subCtrl.getTeams);
router.post('/teams', subCtrl.createTeam);
router.get('/staff', subCtrl.getStaff);
router.post('/staff', subCtrl.createStaff);

module.exports = router;
