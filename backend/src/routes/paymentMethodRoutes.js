const express = require('express');
const router = express.Router();
const paymentMethodController = require('../controllers/paymentMethodController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Public routes
router.get('/', paymentMethodController.getAllPaymentMethods);
router.get('/:id', paymentMethodController.getPaymentMethodById);

// Admin routes
router.post('/', authenticate, isAdmin, paymentMethodController.createPaymentMethod);
router.put('/:id', authenticate, isAdmin, paymentMethodController.updatePaymentMethod);
router.delete('/:id', authenticate, isAdmin, paymentMethodController.deletePaymentMethod);

module.exports = router; 