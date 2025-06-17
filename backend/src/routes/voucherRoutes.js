const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Public routes
router.get('/active', voucherController.getActiveVouchers);
router.post('/validate', voucherController.validateVoucher);

// Admin routes
router.get('/', authenticate, isAdmin, voucherController.getAllVouchers);
router.get('/:id', authenticate, isAdmin, voucherController.getVoucherById);
router.post('/', authenticate, isAdmin, voucherController.createVoucher);
router.put('/:id', authenticate, isAdmin, voucherController.updateVoucher);
router.delete('/:id', authenticate, isAdmin, voucherController.deleteVoucher);

module.exports = router; 