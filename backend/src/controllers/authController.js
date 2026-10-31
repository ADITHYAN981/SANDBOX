/**
 * src/controllers/authController.js
 */

'use strict';

const authService = require('../services/authService');
const prisma = require('../config/prisma');

async function register(req, res, next) {
  try {
    const { fullName, email, password, company, role } = req.body;
    const result = await authService.registerUser({ fullName, email, password, company, role });
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });
    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res) {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
}

module.exports = {
  register,
  login,
  getProfile,
  logout,
};
