const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { successResponse, errorResponse } = require('../utils/helpers');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Admin dashboard data
router.get('/dashboard', authenticate, isAdmin, adminController.getDashboardData);

// Admin categories endpoints
router.get('/categories', authenticate, isAdmin, adminController.getAllCategories);

// Admin orders endpoints
router.get('/orders', authenticate, isAdmin, adminController.getAllOrders);

// Admin vouchers endpoints
router.get('/vouchers', authenticate, isAdmin, adminController.getAllVouchers);

// Admin tutorials endpoints
router.get('/tutorials', authenticate, isAdmin, adminController.getAllTutorials);

// Admin users endpoints
router.get('/users', authenticate, isAdmin, adminController.getAllUsers);

// Admin products endpoints
router.get('/products', authenticate, isAdmin, adminController.getAllProducts);

module.exports = router; 