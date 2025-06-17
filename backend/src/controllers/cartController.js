const { Cart, Product, ProductVariation } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get user cart
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get cart items
    const cartItems = await Cart.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'image', 'weight'],
          where: { is_active: true }
        },
        {
          model: ProductVariation,
          as: 'variation',
          attributes: ['id', 'size', 'color', 'price', 'stock'],
          required: false
        }
      ]
    });
    
    // Calculate total
    let subtotal = 0;
    let totalWeight = 0;
    
    cartItems.forEach(item => {
      const price = item.variation ? (item.variation.price || item.product.price) : item.product.price;
      subtotal += price * item.quantity;
      totalWeight += (item.product.weight || 0) * item.quantity;
    });
    
    return successResponse(res, 200, 'Keranjang berhasil dimuat', { 
      cartItems, 
      subtotal,
      totalWeight,
      totalItems: cartItems.length
    });
  } catch (error) {
    console.error('Error in getUserCart:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Add item to cart
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { product_id, variation_id, quantity } = req.body;
    
    if (!product_id) {
      return errorResponse(res, 400, 'ID produk harus diisi');
    }
    
    if (!quantity || quantity < 1) {
      return errorResponse(res, 400, 'Jumlah harus minimal 1');
    }
    
    // Check if product exists
    const product = await Product.findOne({
      where: { id: product_id, is_active: true }
    });
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Check variation if provided
    if (variation_id) {
      const variation = await ProductVariation.findOne({
        where: { id: variation_id, product_id, is_active: true }
      });
      
      if (!variation) {
        return errorResponse(res, 404, 'Variasi produk tidak ditemukan');
      }
      
      // Check stock
      if (variation.stock < quantity) {
        return errorResponse(res, 400, 'Stok tidak mencukupi');
      }
    } else {
      // Check stock
      if (product.stock < quantity) {
        return errorResponse(res, 400, 'Stok tidak mencukupi');
      }
    }
    
    // Check if item already in cart
    const existingCartItem = await Cart.findOne({
      where: {
        user_id: userId,
        product_id,
        variation_id: variation_id || null
      }
    });
    
    if (existingCartItem) {
      // Update quantity
      await existingCartItem.update({
        quantity: existingCartItem.quantity + quantity
      });
      
      return successResponse(res, 200, 'Jumlah produk di keranjang berhasil diperbarui', { cartItem: existingCartItem });
    }
    
    // Add new item to cart
    const cartItem = await Cart.create({
      user_id: userId,
      product_id,
      variation_id,
      quantity
    });
    
    return successResponse(res, 201, 'Produk berhasil ditambahkan ke keranjang', { cartItem });
  } catch (error) {
    console.error('Error in addToCart:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update cart item
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return errorResponse(res, 400, 'Jumlah harus minimal 1');
    }
    
    // Get cart item
    const cartItem = await Cart.findOne({
      where: { id, user_id: userId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'stock']
        },
        {
          model: ProductVariation,
          as: 'variation',
          attributes: ['id', 'stock'],
          required: false
        }
      ]
    });
    
    if (!cartItem) {
      return errorResponse(res, 404, 'Item keranjang tidak ditemukan');
    }
    
    // Check stock
    if (cartItem.variation) {
      if (cartItem.variation.stock < quantity) {
        return errorResponse(res, 400, 'Stok tidak mencukupi');
      }
    } else {
      if (cartItem.product.stock < quantity) {
        return errorResponse(res, 400, 'Stok tidak mencukupi');
      }
    }
    
    // Update cart item
    await cartItem.update({ quantity });
    
    return successResponse(res, 200, 'Item keranjang berhasil diperbarui', { cartItem });
  } catch (error) {
    console.error('Error in updateCartItem:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Delete cart item
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const deleteCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Get cart item
    const cartItem = await Cart.findOne({
      where: { id, user_id: userId }
    });
    
    if (!cartItem) {
      return errorResponse(res, 404, 'Item keranjang tidak ditemukan');
    }
    
    // Delete cart item
    await cartItem.destroy();
    
    return successResponse(res, 200, 'Item keranjang berhasil dihapus');
  } catch (error) {
    console.error('Error in deleteCartItem:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Clear cart
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Delete all cart items
    await Cart.destroy({
      where: { user_id: userId }
    });
    
    return successResponse(res, 200, 'Keranjang berhasil dikosongkan');
  } catch (error) {
    console.error('Error in clearCart:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getUserCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  clearCart
}; 