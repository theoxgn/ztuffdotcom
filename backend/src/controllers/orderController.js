const { Order, OrderItem, Product, ProductVariation, User, PaymentMethod, Voucher } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse, getPagination, getPaginationData } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');

/**
 * Get all orders (admin)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);
    
    // Build where condition
    const whereCondition = {};
    
    // Filter by status
    if (status) {
      whereCondition.status = status;
    }
    
    // Search by order number or customer name
    if (search) {
      whereCondition[Op.or] = [
        { order_number: { [Op.iLike]: `%${search}%` } },
        { '$user.name$': { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Get orders
    const orders = await Order.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: limitVal,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'name']
        }
      ],
      distinct: true
    });
    
    // Format response
    const result = getPaginationData(orders, page, limit);
    
    return successResponse(res, 200, 'Pesanan berhasil dimuat', {
      orders: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.currentPage
    });
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get user orders
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);
    
    // Build where condition
    const whereCondition = { user_id: userId };
    
    // Filter by status
    if (status) {
      whereCondition.status = status;
    }
    
    // Get orders
    const orders = await Order.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: limitVal,
      offset,
      include: [
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'name']
        }
      ],
      distinct: true
    });
    
    // Format response
    const result = getPaginationData(orders, page, limit);
    
    return successResponse(res, 200, 'Pesanan berhasil dimuat', {
      orders: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.currentPage
    });
  } catch (error) {
    console.error('Error in getUserOrders:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get order by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    // Build where condition
    const whereCondition = { id };
    
    // If not admin, filter by user_id
    if (!isAdmin) {
      whereCondition.user_id = userId;
    }
    
    // Get order
    const order = await Order.findOne({
      where: whereCondition,
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image']
            },
            {
              model: ProductVariation,
              as: 'variation',
              attributes: ['id', 'size', 'color']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'address', 'city', 'province', 'postal_code']
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'name', 'account_number', 'account_name']
        },
        {
          model: Voucher,
          as: 'voucher',
          attributes: ['id', 'code', 'description', 'discount_type', 'discount_value']
        }
      ]
    });
    
    if (!order) {
      return errorResponse(res, 404, 'Pesanan tidak ditemukan');
    }
    
    return successResponse(res, 200, 'Pesanan berhasil dimuat', { order });
  } catch (error) {
    console.error('Error in getOrderById:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Create order
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const createOrder = async (req, res) => {
  // Start a transaction
  const t = await sequelize.transaction();
  
  try {
    const userId = req.user.id;
    const { 
      items, 
      shipping_address, 
      shipping_city, 
      shipping_province, 
      shipping_postal_code,
      shipping_cost,
      payment_method_id,
      voucher_id,
      notes
    } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return errorResponse(res, 400, 'Item pesanan harus diisi');
    }
    
    if (!shipping_address) {
      return errorResponse(res, 400, 'Alamat pengiriman harus diisi');
    }
    
    if (!shipping_city) {
      return errorResponse(res, 400, 'Kota pengiriman harus diisi');
    }
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${userId}`;
    
    // Calculate total
    let subtotal = 0;
    let total_weight = 0;
    
    // Validate items and calculate subtotal
    const orderItems = [];
    for (const item of items) {
      const { product_id, variation_id, quantity } = item;
      
      // Validate product with row-level lock to prevent race condition
      const product = await Product.findOne({
        where: { id: product_id, is_active: true },
        transaction: t,
        lock: t.LOCK.UPDATE
      });
      
      if (!product) {
        await t.rollback();
        return errorResponse(res, 400, `Produk dengan ID ${product_id} tidak ditemukan`);
      }
      
      // Validate variation if provided
      let price = product.price;
      let variation = null;
      
      if (variation_id) {
        variation = await ProductVariation.findOne({
          where: { id: variation_id, product_id, is_active: true },
          transaction: t,
          lock: t.LOCK.UPDATE
        });
        
        if (!variation) {
          await t.rollback();
          return errorResponse(res, 400, `Variasi produk dengan ID ${variation_id} tidak ditemukan`);
        }
        
        // Use variation price if available
        price = variation.price || product.price;
        
        // Check stock
        if (variation.stock < quantity) {
          await t.rollback();
          return errorResponse(res, 400, `Stok tidak mencukupi untuk produk ${product.name}`);
        }
      } else {
        // Check stock
        if (product.stock < quantity) {
          await t.rollback();
          return errorResponse(res, 400, `Stok tidak mencukupi untuk produk ${product.name}`);
        }
      }
      
      // Calculate item total
      const itemTotal = price * quantity;
      subtotal += itemTotal;
      
      // Calculate weight
      total_weight += (product.weight || 0) * quantity;
      
      // Add to order items
      orderItems.push({
        product_id,
        variation_id,
        quantity,
        price,
        total: itemTotal
      });
    }
    
    // Calculate total
    const total = subtotal + (shipping_cost || 0);
    
    // Create order
    const order = await Order.create({
      order_number: orderNumber,
      user_id: userId,
      shipping_address,
      shipping_city,
      shipping_province,
      shipping_postal_code,
      shipping_cost,
      subtotal,
      total,
      total_weight,
      payment_method_id,
      voucher_id,
      notes,
      status: 'pending'
    }, { transaction: t });
    
    // Create order items
    for (const item of orderItems) {
      await OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        variation_id: item.variation_id,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      }, { transaction: t });
      
      // Update stock
      if (item.variation_id) {
        const variation = await ProductVariation.findByPk(item.variation_id, { transaction: t });
        await variation.update({
          stock: variation.stock - item.quantity
        }, { transaction: t });
      } else {
        const product = await Product.findByPk(item.product_id, { transaction: t });
        await product.update({
          stock: product.stock - item.quantity
        }, { transaction: t });
      }
    }
    
    // Commit transaction
    await t.commit();
    
    return successResponse(res, 201, 'Pesanan berhasil dibuat', { order });
  } catch (error) {
    // Rollback transaction on error
    await t.rollback();
    console.error('Error in createOrder:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update order status
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const isAdmin = req.user.role === 'admin';
    
    // Validate status
    const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, 400, 'Status pesanan tidak valid');
    }
    
    // Get order
    const order = await Order.findByPk(id);
    
    if (!order) {
      return errorResponse(res, 404, 'Pesanan tidak ditemukan');
    }
    
    // Check permissions
    if (!isAdmin && status !== 'cancelled') {
      return errorResponse(res, 403, 'Anda tidak memiliki izin untuk mengubah status pesanan');
    }
    
    // If cancelling, check if order can be cancelled
    if (status === 'cancelled') {
      if (['shipped', 'delivered'].includes(order.status)) {
        return errorResponse(res, 400, 'Pesanan yang sudah dikirim tidak dapat dibatalkan');
      }
      
      // If admin or user is cancelling their own order
      if (isAdmin || order.user_id === req.user.id) {
        // Restore stock
        const orderItems = await OrderItem.findAll({
          where: { order_id: order.id }
        });
        
        for (const item of orderItems) {
          if (item.variation_id) {
            const variation = await ProductVariation.findByPk(item.variation_id);
            await variation.update({
              stock: variation.stock + item.quantity
            });
          } else {
            const product = await Product.findByPk(item.product_id);
            await product.update({
              stock: product.stock + item.quantity
            });
          }
        }
      } else {
        return errorResponse(res, 403, 'Anda tidak memiliki izin untuk membatalkan pesanan ini');
      }
    }
    
    // Prepare update data
    const updateData = { status: status };
    
    // If status is changing to delivered, set delivery-related fields
    if (status === 'delivered' && order.status !== 'delivered') {
      const now = new Date();
      updateData.delivered_date = now;
      // Set return window to 30 days from delivery
      updateData.return_window_expires = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
      updateData.is_returnable = true;
    }
    
    // Update order status
    await order.update(updateData);
    
    return successResponse(res, 200, 'Status pesanan berhasil diperbarui', { order });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Upload payment proof
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const uploadPaymentProof = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    // Get order
    const order = await Order.findOne({
      where: { id, user_id: userId }
    });
    
    if (!order) {
      return errorResponse(res, 404, 'Pesanan tidak ditemukan');
    }
    
    // Check if order status is pending
    if (order.status !== 'pending') {
      return errorResponse(res, 400, 'Bukti pembayaran hanya dapat diunggah untuk pesanan dengan status pending');
    }
    
    // Handle payment proof
    if (!req.file) {
      return errorResponse(res, 400, 'Bukti pembayaran harus diunggah');
    }
    
    const paymentProofPath = `payments/${req.file.filename}`;
    
    // Delete old payment proof if exists
    if (order.payment_proof) {
      const oldPaymentProofPath = path.join(__dirname, `../../uploads/${order.payment_proof}`);
      if (fs.existsSync(oldPaymentProofPath)) {
        fs.unlinkSync(oldPaymentProofPath);
      }
    }
    
          // Update order
      await order.update({
        payment_proof: paymentProofPath,
        payment_date: new Date(),
        status: 'processing'
      });
    
    return successResponse(res, 200, 'Bukti pembayaran berhasil diunggah', { order });
  } catch (error) {
    console.error('Error in uploadPaymentProof:', error);
    
    // Delete uploaded file if error
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, `../../uploads/payments/${req.file.filename}`));
    }
    
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getAllOrders,
  getUserOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  uploadPaymentProof
}; 