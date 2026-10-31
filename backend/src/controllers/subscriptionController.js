/**
 * src/controllers/subscriptionController.js
 */

'use strict';

const subscriptionService = require('../services/subscriptionService');

async function getSubscriptions(req, res, next) {
  try {
    const subs = await subscriptionService.getAllSubscriptions(req.query);
    res.status(200).json({ success: true, data: subs });
  } catch (err) { next(err); }
}

async function createSubscription(req, res, next) {
  try {
    const sub = await subscriptionService.createSubscription(req.body);
    res.status(201).json({ success: true, data: sub });
  } catch (err) { next(err); }
}

async function updateSubscription(req, res, next) {
  try {
    const sub = await subscriptionService.updateSubscription(req.params.id, req.body);
    res.status(200).json({ success: true, data: sub });
  } catch (err) { next(err); }
}

async function deleteSubscription(req, res, next) {
  try {
    await subscriptionService.deleteSubscription(req.params.id);
    res.status(200).json({ success: true, message: 'Subscription deleted.' });
  } catch (err) { next(err); }
}

async function getInvoices(req, res, next) {
  try {
    const invoices = await subscriptionService.getAllInvoices(req.query);
    res.status(200).json({ success: true, data: invoices });
  } catch (err) { next(err); }
}

async function createInvoice(req, res, next) {
  try {
    const inv = await subscriptionService.createInvoice(req.body);
    res.status(201).json({ success: true, data: inv });
  } catch (err) { next(err); }
}

async function updateInvoice(req, res, next) {
  try {
    const inv = await subscriptionService.updateInvoice(req.params.id, req.body);
    res.status(200).json({ success: true, data: inv });
  } catch (err) { next(err); }
}

async function runBillingDay(req, res, next) {
  try {
    const result = await subscriptionService.runBillingDayBatch();
    res.status(200).json({ success: true, message: 'Billing day batch executed.', ...result });
  } catch (err) { next(err); }
}

async function getPayments(req, res, next) {
  try {
    const payments = await subscriptionService.getAllPayments();
    res.status(200).json({ success: true, data: payments });
  } catch (err) { next(err); }
}

async function recordPayment(req, res, next) {
  try {
    const payment = await subscriptionService.recordPayment(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (err) { next(err); }
}

async function getProducts(req, res, next) {
  try {
    const products = await subscriptionService.getAllProducts();
    res.status(200).json({ success: true, data: products });
  } catch (err) { next(err); }
}

async function createProduct(req, res, next) {
  try {
    const product = await subscriptionService.createProduct(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) { next(err); }
}

async function getPlans(req, res, next) {
  try {
    const plans = await subscriptionService.getAllPlans();
    res.status(200).json({ success: true, data: plans });
  } catch (err) { next(err); }
}

async function createPlan(req, res, next) {
  try {
    const plan = await subscriptionService.createPlan(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) { next(err); }
}

async function getDiscounts(req, res, next) {
  try {
    const discounts = await subscriptionService.getAllDiscounts();
    res.status(200).json({ success: true, data: discounts });
  } catch (err) { next(err); }
}

async function createDiscount(req, res, next) {
  try {
    const discount = await subscriptionService.createDiscount(req.body);
    res.status(201).json({ success: true, data: discount });
  } catch (err) { next(err); }
}

async function getTaxes(req, res, next) {
  try {
    const taxes = await subscriptionService.getAllTaxes();
    res.status(200).json({ success: true, data: taxes });
  } catch (err) { next(err); }
}

async function createTax(req, res, next) {
  try {
    const tax = await subscriptionService.createTax(req.body);
    res.status(201).json({ success: true, data: tax });
  } catch (err) { next(err); }
}

async function getTeams(req, res, next) {
  try {
    const teams = await subscriptionService.getAllTeams();
    res.status(200).json({ success: true, data: teams });
  } catch (err) { next(err); }
}

async function createTeam(req, res, next) {
  try {
    const team = await subscriptionService.createTeam(req.body, req.user?.id);
    res.status(201).json({ success: true, data: team });
  } catch (err) { next(err); }
}

async function getStaff(req, res, next) {
  try {
    const staff = await subscriptionService.getAllStaff();
    res.status(200).json({ success: true, data: staff });
  } catch (err) { next(err); }
}

async function createStaff(req, res, next) {
  try {
    const staff = await subscriptionService.createStaffMember(req.body);
    res.status(201).json({ success: true, data: staff });
  } catch (err) { next(err); }
}

async function getDashboard(req, res, next) {
  try {
    const stats = await subscriptionService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) { next(err); }
}

module.exports = {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getInvoices,
  createInvoice,
  updateInvoice,
  runBillingDay,
  getPayments,
  recordPayment,
  getProducts,
  createProduct,
  getPlans,
  createPlan,
  getDiscounts,
  createDiscount,
  getTaxes,
  createTax,
  getTeams,
  createTeam,
  getStaff,
  createStaff,
  getDashboard,
};
