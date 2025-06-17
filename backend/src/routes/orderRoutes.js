const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { uploadPaymentProof } = require('../middlewares/upload');

// Admin routes
router.get('/all', authenticate, isAdmin, orderController.getAllOrders);

// User routes
router.get('/', authenticate, orderController.getUserOrders);
router.get('/:id', authenticate, orderController.getOrderById);
router.post('/', authenticate, orderController.createOrder);
router.put('/:id/status', authenticate, orderController.updateOrderStatus);
router.post('/:id/payment-proof', authenticate, uploadPaymentProof.single('payment_proof'), orderController.uploadPaymentProof);

module.exports = router; 