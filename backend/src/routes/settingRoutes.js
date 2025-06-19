const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authenticate, isAdmin } = require('../middlewares/auth');

router.get('/', settingController.getSettings);

router.get('/shipping-origin', settingController.getShippingOrigin);

router.get('/:key', settingController.getSetting);

router.put('/:key', authenticate, isAdmin, settingController.updateSetting);

router.put('/', authenticate, isAdmin, settingController.updateMultipleSettings);

module.exports = router;