const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middlewares/auth');

// Public routes
router.get('/products/:productId/reviews', reviewController.getProductReviews);

// Protected routes (require authentication)
router.post('/products/:productId/reviews', auth.authenticate, reviewController.createReview);
router.put('/reviews/:reviewId', auth.authenticate, reviewController.updateReview);
router.delete('/reviews/:reviewId', auth.authenticate, reviewController.deleteReview);
router.get('/user/reviews', auth.authenticate, reviewController.getUserReviews);

// Admin routes
router.get('/admin/reviews', auth.authenticate, auth.authorize(['admin']), reviewController.getAllReviews);
router.put('/admin/reviews/:reviewId/status', auth.authenticate, auth.authorize(['admin']), reviewController.updateReviewStatus);

module.exports = router;