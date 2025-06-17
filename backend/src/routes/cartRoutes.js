const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middlewares/auth');

// All cart routes require authentication
router.use(authenticate);

// Cart routes
router.get('/', cartController.getUserCart);
router.post('/', cartController.addToCart);
router.put('/:id', cartController.updateCartItem);
router.delete('/:id', cartController.deleteCartItem);
router.delete('/', cartController.clearCart);

module.exports = router; 