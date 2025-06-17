const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const categoryRoutes = require('./categoryRoutes');
const orderRoutes = require('./orderRoutes');
const cartRoutes = require('./cartRoutes');
const voucherRoutes = require('./voucherRoutes');
const tutorialRoutes = require('./tutorialRoutes');
const paymentMethodRoutes = require('./paymentMethodRoutes');
const pointRoutes = require('./pointRoutes');

// Define API routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/vouchers', voucherRoutes);
router.use('/tutorials', tutorialRoutes);
router.use('/payment-methods', paymentMethodRoutes);
router.use('/points', pointRoutes);

// API health check
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dropshipedia API berhasil terhubung',
    version: '1.0.0'
  });
});

// 404 Route
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint tidak ditemukan'
  });
});

module.exports = router; 