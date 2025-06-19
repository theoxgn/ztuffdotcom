const express = require('express');
const router = express.Router();
const shippingController = require('../controllers/shippingController');

router.get('/search', shippingController.searchDestination);

router.get('/provinces', shippingController.getProvinces);

router.get('/cities', shippingController.getCities);

router.post('/cost', shippingController.calculateShippingCost);

router.get('/couriers', shippingController.getSupportedCouriers);

module.exports = router;