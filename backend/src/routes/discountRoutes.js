const express = require('express');
const router = express.Router();
const discountController = require('../controllers/discountController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Public routes
router.get('/active', discountController.getActiveDiscounts);
router.get('/product/:productId', discountController.getProductDiscounts);

// Admin routes
router.get('/', authenticate, isAdmin, discountController.getAllDiscounts);
router.get('/:id', authenticate, isAdmin, discountController.getDiscountById);
router.post('/', authenticate, isAdmin, discountController.createDiscount);
router.put('/:id', authenticate, isAdmin, discountController.updateDiscount);
router.delete('/:id', authenticate, isAdmin, discountController.deleteDiscount);

module.exports = router;