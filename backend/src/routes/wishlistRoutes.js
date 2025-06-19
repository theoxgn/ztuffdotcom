const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  clearWishlist
} = require('../controllers/wishlistController');

// GET /api/wishlist - Get user's wishlist
router.get('/', authenticate, getUserWishlist);

// POST /api/wishlist - Add product to wishlist
router.post('/', authenticate, addToWishlist);

// DELETE /api/wishlist/:product_id - Remove product from wishlist
router.delete('/:product_id', authenticate, removeFromWishlist);

// GET /api/wishlist/check/:product_id - Check if product is in wishlist
router.get('/check/:product_id', authenticate, checkWishlistStatus);

// DELETE /api/wishlist - Clear all wishlist items
router.delete('/', authenticate, clearWishlist);

module.exports = router;