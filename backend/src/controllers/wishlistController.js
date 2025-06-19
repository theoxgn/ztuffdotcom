const { Wishlist, Product, ProductImage, Category } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get user's wishlist
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getUserWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const wishlistItems = await Wishlist.findAll({
      where: { user_id: userId },
      include: [{
        model: Product,
        as: 'product',
        where: { is_active: true },
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'image', 'is_primary'],
            limit: 1,
            where: { is_primary: true },
            required: false
          }
        ]
      }],
      order: [['created_at', 'DESC']]
    });
    
    return successResponse(res, 200, 'Wishlist berhasil dimuat', { 
      wishlist: wishlistItems,
      total: wishlistItems.length 
    });
  } catch (error) {
    console.error('Error in getUserWishlist:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Add product to wishlist
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.body;
    
    if (!product_id) {
      return errorResponse(res, 400, 'Product ID harus diisi');
    }
    
    // Check if product exists and is active
    const product = await Product.findOne({
      where: { id: product_id, is_active: true }
    });
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Check if already in wishlist
    const existingWishlistItem = await Wishlist.findOne({
      where: { user_id: userId, product_id }
    });
    
    if (existingWishlistItem) {
      return errorResponse(res, 400, 'Produk sudah ada di wishlist');
    }
    
    // Add to wishlist
    const wishlistItem = await Wishlist.create({
      user_id: userId,
      product_id
    });
    
    // Get the created wishlist item with product details
    const wishlistWithProduct = await Wishlist.findByPk(wishlistItem.id, {
      include: [{
        model: Product,
        as: 'product',
        include: [
          {
            model: Category,
            as: 'category',
            attributes: ['id', 'name']
          },
          {
            model: ProductImage,
            as: 'images',
            attributes: ['id', 'image', 'is_primary'],
            limit: 1,
            where: { is_primary: true },
            required: false
          }
        ]
      }]
    });
    
    return successResponse(res, 201, 'Produk berhasil ditambahkan ke wishlist', { 
      wishlistItem: wishlistWithProduct 
    });
  } catch (error) {
    console.error('Error in addToWishlist:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Remove product from wishlist
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.params;
    
    if (!product_id) {
      return errorResponse(res, 400, 'Product ID harus diisi');
    }
    
    // Find wishlist item
    const wishlistItem = await Wishlist.findOne({
      where: { user_id: userId, product_id }
    });
    
    if (!wishlistItem) {
      return errorResponse(res, 404, 'Produk tidak ditemukan di wishlist');
    }
    
    // Remove from wishlist
    await wishlistItem.destroy();
    
    return successResponse(res, 200, 'Produk berhasil dihapus dari wishlist');
  } catch (error) {
    console.error('Error in removeFromWishlist:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Check if product is in user's wishlist
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const checkWishlistStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id } = req.params;
    
    if (!product_id) {
      return errorResponse(res, 400, 'Product ID harus diisi');
    }
    
    const wishlistItem = await Wishlist.findOne({
      where: { user_id: userId, product_id }
    });
    
    return successResponse(res, 200, 'Status wishlist berhasil dimuat', { 
      isInWishlist: !!wishlistItem 
    });
  } catch (error) {
    console.error('Error in checkWishlistStatus:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Clear user's wishlist
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const clearWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await Wishlist.destroy({
      where: { user_id: userId }
    });
    
    return successResponse(res, 200, 'Wishlist berhasil dikosongkan');
  } catch (error) {
    console.error('Error in clearWishlist:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getUserWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlistStatus,
  clearWishlist
};