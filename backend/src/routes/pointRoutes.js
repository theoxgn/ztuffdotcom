const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// User routes
router.get('/', authenticate, pointController.getUserPoints);
router.get('/history', authenticate, pointController.getUserPointHistory);
router.post('/redeem', authenticate, pointController.redeemPoints);

// Admin routes
router.post('/add', authenticate, isAdmin, pointController.addPoints);

module.exports = router; 