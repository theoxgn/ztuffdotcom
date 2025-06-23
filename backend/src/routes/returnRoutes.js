const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/auth');
const {
  checkReturnEligibility,
  createReturnRequest,
  getUserReturns,
  getReturnById,
  cancelReturnRequest
} = require('../controllers/returnController');

// Customer return routes
router.get('/my-returns', authenticate, getUserReturns);
router.get('/eligibility/:orderId/:orderItemId', authenticate, checkReturnEligibility);
router.post('/request/:orderId/:orderItemId', authenticate, createReturnRequest);
router.get('/:id', authenticate, getReturnById);
router.put('/:id/cancel', authenticate, cancelReturnRequest);

module.exports = router;