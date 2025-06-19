const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { successResponse, errorResponse } = require('../utils/helpers');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { uploadProductImage, uploadCategoryImage } = require('../middlewares/upload');

// Admin dashboard data
router.get('/dashboard', authenticate, isAdmin, adminController.getDashboardData);

// Admin categories endpoints
router.get('/categories', authenticate, isAdmin, adminController.getAllCategories);
router.post('/categories', authenticate, isAdmin, uploadCategoryImage.single('image'), adminController.createCategory);
router.put('/categories/:id', authenticate, isAdmin, uploadCategoryImage.single('image'), adminController.updateCategory);
router.delete('/categories/:id', authenticate, isAdmin, adminController.deleteCategory);

// Admin orders endpoints
router.get('/orders', authenticate, isAdmin, adminController.getAllOrders);
router.get('/orders/:id', authenticate, isAdmin, adminController.getOrderDetail);
router.put('/orders/:id/status', authenticate, isAdmin, adminController.updateOrderStatus);
router.post('/orders/:id/notes', authenticate, isAdmin, adminController.addOrderNote);

// Admin vouchers endpoints
const voucherController = require('../controllers/voucherController');
router.get('/vouchers', authenticate, isAdmin, voucherController.getAllVouchers);
router.get('/vouchers/:id', authenticate, isAdmin, voucherController.getVoucherById);
router.post('/vouchers', authenticate, isAdmin, voucherController.createVoucher);
router.put('/vouchers/:id', authenticate, isAdmin, voucherController.updateVoucher);
router.delete('/vouchers/:id', authenticate, isAdmin, voucherController.deleteVoucher);

// Admin tutorials endpoints
router.get('/tutorials', authenticate, isAdmin, adminController.getAllTutorials);

// Admin users endpoints
router.get('/users', authenticate, isAdmin, adminController.getAllUsers);

// Admin products endpoints
router.get('/products', authenticate, isAdmin, adminController.getAllProducts);
router.get('/products/:id', authenticate, isAdmin, adminController.getProductDetail);
router.post('/products', authenticate, isAdmin, uploadProductImage.single('image'), adminController.createProduct);
router.put('/products/:id', authenticate, isAdmin, uploadProductImage.single('image'), adminController.updateProduct);
router.delete('/products/:id', authenticate, isAdmin, adminController.deleteProduct);

module.exports = router; 