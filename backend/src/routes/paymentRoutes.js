const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate } = require('../middlewares/auth');

router.post('/snap/create-token', authenticate, (req, res) => paymentController.createSnapToken(req, res));

router.post('/snap/save-order', authenticate, (req, res) => paymentController.saveOrder(req, res));

router.get('/info/:orderId', authenticate, (req, res) => paymentController.getPaymentInfo(req, res));

router.post('/notification', (req, res) => paymentController.handleNotification(req, res));

module.exports = router;