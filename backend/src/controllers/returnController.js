const { ReturnRequest, ReturnPolicy, QualityCheck, DamagedInventory, Order, OrderItem, Product, ProductVariation, User, Category } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse, getPagination, getPaginationData } = require('../utils/helpers');
const sequelize = require('../config/database');

/**
 * Check return eligibility for an order item
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const checkReturnEligibility = async (req, res) => {
  try {
    const { orderId, orderItemId } = req.params;
    const userId = req.user.id;

    // Get order item with order and product details
    const orderItem = await OrderItem.findOne({
      where: { id: orderItemId },
      include: [
        {
          model: Order,
          as: 'order',
          where: { id: orderId, user_id: userId },
          attributes: ['id', 'status', 'delivered_date', 'return_window_expires', 'is_returnable']
        },
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: Category,
              as: 'category'
            }
          ]
        },
        {
          model: ProductVariation,
          as: 'variation'
        }
      ]
    });

    if (!orderItem) {
      return errorResponse(res, 404, 'Item pesanan tidak ditemukan');
    }

    const order = orderItem.order;
    const product = orderItem.product;

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return errorResponse(res, 400, 'Pesanan belum dikirim, tidak dapat dikembalikan');
    }

    // Check if order is returnable
    if (!order.is_returnable) {
      return errorResponse(res, 400, 'Pesanan ini tidak dapat dikembalikan');
    }

    // Get applicable return policy
    const returnPolicy = await getApplicableReturnPolicy(product.id, product.category_id);

    if (!returnPolicy || !returnPolicy.is_returnable) {
      return errorResponse(res, 400, 'Produk ini tidak dapat dikembalikan');
    }

    // Check return window
    const now = new Date();
    if (order.return_window_expires && now > new Date(order.return_window_expires)) {
      return errorResponse(res, 400, 'Waktu pengembalian sudah habis');
    }

    // Check if already has active return request
    const existingReturn = await ReturnRequest.findOne({
      where: {
        order_item_id: orderItemId,
        status: {
          [Op.notIn]: ['completed', 'cancelled', 'rejected']
        }
      }
    });

    if (existingReturn) {
      return errorResponse(res, 400, 'Item ini sudah memiliki permintaan pengembalian yang aktif');
    }

    return successResponse(res, 200, 'Item dapat dikembalikan', {
      eligible: true,
      return_policy: returnPolicy,
      order_item: orderItem,
      return_window_expires: order.return_window_expires
    });

  } catch (error) {
    console.error('Error in checkReturnEligibility:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Create return request
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const createReturnRequest = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { orderId, orderItemId } = req.params;
    const {
      reason_code,
      reason_description,
      return_type = 'refund',
      refund_method = 'original_payment',
      customer_notes,
      photos = []
    } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!reason_code) {
      return errorResponse(res, 400, 'Alasan pengembalian harus diisi');
    }

    // Check eligibility first
    const eligibilityCheck = await checkEligibilityInternal(orderId, orderItemId, userId);
    if (!eligibilityCheck.eligible) {
      return errorResponse(res, 400, eligibilityCheck.reason);
    }

    const { orderItem, returnPolicy } = eligibilityCheck;

    // Validate reason code
    if (returnPolicy.allowed_return_reasons && 
        !returnPolicy.allowed_return_reasons.includes(reason_code)) {
      return errorResponse(res, 400, 'Alasan pengembalian tidak diizinkan untuk produk ini');
    }

    if (returnPolicy.excluded_return_reasons && 
        returnPolicy.excluded_return_reasons.includes(reason_code)) {
      return errorResponse(res, 400, 'Alasan pengembalian tidak diizinkan untuk produk ini');
    }

    // Generate return number
    const returnNumber = `RET-${Date.now()}-${userId.substring(0, 8)}`;

    // Calculate requested amount
    const requestedAmount = orderItem.total;

    // Calculate restocking fee
    let restockingFee = 0;
    if (returnPolicy.restocking_fee_percentage > 0) {
      restockingFee = requestedAmount * (returnPolicy.restocking_fee_percentage / 100);
    }

    // Set return deadline
    const returnDeadline = new Date();
    returnDeadline.setDate(returnDeadline.getDate() + 14); // 14 days to return item

    // Create return request
    const returnRequest = await ReturnRequest.create({
      order_id: orderId,
      order_item_id: orderItemId,
      user_id: userId,
      return_number: returnNumber,
      reason_code,
      reason_description,
      return_type,
      requested_amount: requestedAmount,
      restocking_fee: restockingFee,
      photos,
      refund_method,
      customer_notes,
      return_deadline: returnDeadline,
      status: returnPolicy.requires_approval ? 'pending' : 'approved'
    }, { transaction: t });

    // Update order has_active_returns flag
    await Order.update(
      { has_active_returns: true },
      { where: { id: orderId }, transaction: t }
    );

    await t.commit();

    // Send notification (implement based on your notification system)
    await sendReturnStatusNotification(returnRequest, 'created');

    return successResponse(res, 201, 'Permintaan pengembalian berhasil dibuat', {
      return_request: returnRequest
    });

  } catch (error) {
    await t.rollback();
    console.error('Error in createReturnRequest:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get user's return requests
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getUserReturns = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);

    const whereCondition = { user_id: userId };
    if (status) {
      whereCondition.status = status;
    }

    const returns = await ReturnRequest.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: limitVal,
      offset,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'status']
        },
        {
          model: OrderItem,
          as: 'orderItem',
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
        }
      ]
    });

    const result = getPaginationData(returns, page, limit);

    return successResponse(res, 200, 'Permintaan pengembalian berhasil dimuat', {
      returns: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.currentPage
    });

  } catch (error) {
    console.error('Error in getUserReturns:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get return request by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const whereCondition = { id };
    if (!isAdmin) {
      whereCondition.user_id = userId;
    }

    const returnRequest = await ReturnRequest.findOne({
      where: whereCondition,
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'status', 'delivered_date']
        },
        {
          model: OrderItem,
          as: 'orderItem',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image', 'price']
            },
            {
              model: ProductVariation,
              as: 'variation',
              attributes: ['id', 'size', 'color', 'price']
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: QualityCheck,
          as: 'qualityCheck',
          required: false
        }
      ]
    });

    if (!returnRequest) {
      return errorResponse(res, 404, 'Permintaan pengembalian tidak ditemukan');
    }

    return successResponse(res, 200, 'Permintaan pengembalian berhasil dimuat', {
      return_request: returnRequest
    });

  } catch (error) {
    console.error('Error in getReturnById:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Cancel return request (user only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const cancelReturnRequest = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const userId = req.user.id;

    const returnRequest = await ReturnRequest.findOne({
      where: { id, user_id: userId }
    });

    if (!returnRequest) {
      return errorResponse(res, 404, 'Permintaan pengembalian tidak ditemukan');
    }

    // Check if can be cancelled
    if (!['pending', 'approved'].includes(returnRequest.status)) {
      return errorResponse(res, 400, 'Permintaan pengembalian tidak dapat dibatalkan pada status ini');
    }

    // Update status
    await returnRequest.update({
      status: 'cancelled'
    }, { transaction: t });

    // Check if order has other active returns
    const activeReturns = await ReturnRequest.count({
      where: {
        order_id: returnRequest.order_id,
        status: {
          [Op.notIn]: ['completed', 'cancelled', 'rejected']
        },
        id: { [Op.ne]: id }
      }
    });

    // Update order flag if no more active returns
    if (activeReturns === 0) {
      await Order.update(
        { has_active_returns: false },
        { where: { id: returnRequest.order_id }, transaction: t }
      );
    }

    await t.commit();

    return successResponse(res, 200, 'Permintaan pengembalian berhasil dibatalkan');

  } catch (error) {
    await t.rollback();
    console.error('Error in cancelReturnRequest:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get all return requests (admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllReturns = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);

    const whereCondition = {};
    if (status) {
      whereCondition.status = status;
    }

    if (search) {
      whereCondition[Op.or] = [
        { return_number: { [Op.iLike]: `%${search}%` } },
        { '$user.name$': { [Op.iLike]: `%${search}%` } },
        { '$order.order_number$': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const returns = await ReturnRequest.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: limitVal,
      offset,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number']
        },
        {
          model: OrderItem,
          as: 'orderItem',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image']
            }
          ]
        }
      ],
      distinct: true
    });

    const result = getPaginationData(returns, page, limit);

    return successResponse(res, 200, 'Permintaan pengembalian berhasil dimuat', {
      returns: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.currentPage
    });

  } catch (error) {
    console.error('Error in getAllReturns:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get return request by ID (admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getReturnByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const returnRequest = await ReturnRequest.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'status', 'delivered_date', 'total']
        },
        {
          model: OrderItem,
          as: 'orderItem',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image', 'price']
            },
            {
              model: ProductVariation,
              as: 'variation',
              attributes: ['id', 'size', 'color', 'price'],
              required: false
            }
          ]
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: User,
          as: 'processor',
          attributes: ['id', 'name'],
          required: false
        },
        {
          model: QualityCheck,
          as: 'qualityCheck',
          required: false
        }
      ]
    });

    if (!returnRequest) {
      return errorResponse(res, 404, 'Permintaan pengembalian tidak ditemukan');
    }

    return successResponse(res, 200, 'Detail pengembalian berhasil dimuat', returnRequest);

  } catch (error) {
    console.error('Error in getReturnByIdAdmin:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Process return request (admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const processReturnRequest = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { action, admin_notes, approved_amount } = req.body;
    const adminId = req.user.id;

    console.log('Processing return request:', { id, action, admin_notes, approved_amount, adminId });

    if (!['approve', 'reject'].includes(action)) {
      return errorResponse(res, 400, 'Aksi tidak valid');
    }

    const returnRequest = await ReturnRequest.findByPk(id, {
      include: [
        {
          model: OrderItem,
          as: 'orderItem',
          include: [
            {
              model: Product,
              as: 'product'
            }
          ]
        }
      ]
    });

    if (!returnRequest) {
      return errorResponse(res, 404, 'Permintaan pengembalian tidak ditemukan');
    }

    if (returnRequest.status !== 'pending') {
      return errorResponse(res, 400, 'Permintaan pengembalian sudah diproses');
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      admin_notes,
      processed_by: adminId,
      processed_at: new Date()
    };

    if (action === 'approve' && approved_amount !== undefined) {
      updateData.approved_amount = approved_amount;
    }

    await returnRequest.update(updateData, { transaction: t });

    // If approved, create quality check record if required
    if (action === 'approve') {
      try {
        const returnPolicy = await getApplicableReturnPolicyById(returnRequest.order_item_id);
        
        if (returnPolicy && returnPolicy.quality_check_required) {
          const qcNumber = `QC-${Date.now()}-${id.substring(0, 8)}`;
          
          await QualityCheck.create({
            return_request_id: id,
            product_id: returnRequest.orderItem?.product_id,
            variation_id: returnRequest.orderItem?.variation_id,
            qc_number: qcNumber,
            quantity_expected: returnRequest.orderItem?.quantity || 1,
            quantity_received: 0
          }, { transaction: t });
        }
      } catch (qcError) {
        console.error('Error creating quality check:', qcError);
        // Continue without failing the main process
      }
    }

    await t.commit();

    // Send notification
    await sendReturnStatusNotification(returnRequest, action);

    return successResponse(res, 200, `Permintaan pengembalian berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`);

  } catch (error) {
    await t.rollback();
    console.error('Error in processReturnRequest:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

// Helper functions
const getApplicableReturnPolicy = async (productId, categoryId) => {
  // First check for product-specific policy
  let policy = await ReturnPolicy.findOne({
    where: { product_id: productId, is_active: true },
    order: [['priority', 'DESC']]
  });

  // If no product policy, check category policy
  if (!policy && categoryId) {
    policy = await ReturnPolicy.findOne({
      where: { category_id: categoryId, is_active: true },
      order: [['priority', 'DESC']]
    });
  }

  // If no specific policy, get default policy
  if (!policy) {
    policy = await ReturnPolicy.findOne({
      where: { 
        product_id: null, 
        category_id: null, 
        is_active: true 
      },
      order: [['priority', 'DESC']]
    });
  }

  return policy;
};

const getApplicableReturnPolicyById = async (orderItemId) => {
  try {
    const orderItem = await OrderItem.findOne({
      where: { id: orderItemId },
      include: [
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    if (!orderItem) {
      return null;
    }

    const product = orderItem.product;
    return await getApplicableReturnPolicy(product.id, product.category_id);

  } catch (error) {
    console.error('Error in getApplicableReturnPolicyById:', error);
    return null;
  }
};

const checkEligibilityInternal = async (orderId, orderItemId, userId) => {
  try {
    const orderItem = await OrderItem.findOne({
      where: { id: orderItemId },
      include: [
        {
          model: Order,
          as: 'order',
          where: { id: orderId, user_id: userId }
        },
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    if (!orderItem) {
      return { eligible: false, reason: 'Item pesanan tidak ditemukan' };
    }

    const order = orderItem.order;
    const product = orderItem.product;

    if (order.status !== 'delivered') {
      return { eligible: false, reason: 'Pesanan belum dikirim' };
    }

    if (!order.is_returnable) {
      return { eligible: false, reason: 'Pesanan tidak dapat dikembalikan' };
    }

    const returnPolicy = await getApplicableReturnPolicy(product.id, product.category_id);

    if (!returnPolicy || !returnPolicy.is_returnable) {
      return { eligible: false, reason: 'Produk tidak dapat dikembalikan' };
    }

    const now = new Date();
    if (order.return_window_expires && now > new Date(order.return_window_expires)) {
      return { eligible: false, reason: 'Waktu pengembalian sudah habis' };
    }

    const existingReturn = await ReturnRequest.findOne({
      where: {
        order_item_id: orderItemId,
        status: { [Op.notIn]: ['completed', 'cancelled', 'rejected'] }
      }
    });

    if (existingReturn) {
      return { eligible: false, reason: 'Item sudah memiliki permintaan pengembalian aktif' };
    }

    return { eligible: true, orderItem, returnPolicy };

  } catch (error) {
    console.error('Error in checkEligibilityInternal:', error);
    return { eligible: false, reason: 'Terjadi kesalahan sistem' };
  }
};

/**
 * Mark return as item received (admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const markItemReceived = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { admin_notes, received_date, shipping_tracking } = req.body;
    const adminId = req.user.id;

    const returnRequest = await ReturnRequest.findByPk(id);

    if (!returnRequest) {
      return errorResponse(res, 404, 'Permintaan pengembalian tidak ditemukan');
    }

    if (returnRequest.status !== 'approved') {
      return errorResponse(res, 400, 'Status return harus approved untuk mark as received');
    }

    await returnRequest.update({
      status: 'item_received',
      admin_notes: admin_notes || returnRequest.admin_notes,
      received_date: received_date || new Date(),
      shipping_tracking,
      processed_by: adminId,
      processed_at: new Date()
    }, { transaction: t });

    await t.commit();

    // Send notification to customer
    await sendReturnStatusNotification(returnRequest, 'item_received');

    return successResponse(res, 200, 'Return berhasil dimark sebagai item received');

  } catch (error) {
    await t.rollback();
    console.error('Error in markItemReceived:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Process quality check (admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const processQualityCheck = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const {
      condition,
      sellable_quantity,
      damaged_quantity,
      missing_quantity,
      disposition,
      qc_notes,
      photos = []
    } = req.body;
    const adminId = req.user.id;

    const returnRequest = await ReturnRequest.findByPk(id, {
      include: [
        {
          model: QualityCheck,
          as: 'qualityCheck'
        }
      ]
    });

    if (!returnRequest) {
      return errorResponse(res, 404, 'Permintaan pengembalian tidak ditemukan');
    }

    if (returnRequest.status !== 'item_received') {
      return errorResponse(res, 400, 'Status return harus item_received untuk quality check');
    }

    // Update quality check
    if (returnRequest.qualityCheck) {
      await returnRequest.qualityCheck.update({
        condition,
        sellable_quantity,
        damaged_quantity,
        missing_quantity,
        disposition,
        qc_notes,
        photos,
        status: 'completed',
        inspector_id: adminId,
        completed_at: new Date()
      }, { transaction: t });
    }

    // Update return status
    await returnRequest.update({
      status: 'quality_check',
      processed_by: adminId,
      processed_at: new Date()
    }, { transaction: t });

    // Create damaged inventory record if needed
    if (damaged_quantity > 0) {
      const orderItem = await OrderItem.findByPk(returnRequest.order_item_id);
      await DamagedInventory.create({
        return_request_id: id,
        product_id: orderItem.product_id,
        variation_id: orderItem.variation_id,
        quantity: damaged_quantity,
        damage_type: 'return_damage',
        severity: condition === 'damaged' ? 'high' : 'medium',
        disposition: disposition || 'inspect',
        created_by: adminId
      }, { transaction: t });
    }

    await t.commit();

    return successResponse(res, 200, 'Quality check berhasil diproses');

  } catch (error) {
    await t.rollback();
    console.error('Error in processQualityCheck:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Process refund (admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const processRefund = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { refund_amount, refund_method, refund_notes } = req.body;
    const adminId = req.user.id;

    const returnRequest = await ReturnRequest.findByPk(id, {
      include: [
        {
          model: Order,
          as: 'order'
        }
      ]
    });

    if (!returnRequest) {
      return errorResponse(res, 404, 'Permintaan pengembalian tidak ditemukan');
    }

    if (returnRequest.status !== 'quality_check') {
      return errorResponse(res, 400, 'Status return harus quality_check untuk process refund');
    }

    // Update return status to processing
    await returnRequest.update({
      status: 'processing',
      refund_amount,
      refund_method,
      refund_notes,
      refund_status: 'processing',
      processed_by: adminId,
      processed_at: new Date()
    }, { transaction: t });

    // Call payment gateway for refund
    const refundResult = await processPaymentRefund(returnRequest, refund_amount);

    if (refundResult.success) {
      await returnRequest.update({
        status: 'completed',
        refund_status: 'completed',
        refund_reference: refundResult.refund_id,
        completed_at: new Date()
      }, { transaction: t });
    } else {
      await returnRequest.update({
        refund_status: 'failed',
        refund_notes: refundResult.error
      }, { transaction: t });
    }

    await t.commit();

    // Send notification to customer
    await sendReturnStatusNotification(returnRequest, 'refund_processed');

    return successResponse(res, 200, 'Refund berhasil diproses', {
      refund_status: refundResult.success ? 'completed' : 'failed',
      refund_reference: refundResult.refund_id
    });

  } catch (error) {
    await t.rollback();
    console.error('Error in processRefund:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Send return status notification
 * @param {object} returnRequest - Return request object
 * @param {string} status - New status
 */
const sendReturnStatusNotification = async (returnRequest, status) => {
  try {
    // Import notification service
    const { sendEmail } = require('../services/notificationService');
    
    const user = await User.findByPk(returnRequest.user_id);
    
    if (!user) return;

    const statusMessages = {
      'approved': 'Return request Anda telah disetujui. Silakan kirim barang kembali.',
      'rejected': 'Return request Anda ditolak.',
      'item_received': 'Barang return Anda telah kami terima dan sedang dalam proses pemeriksaan.',
      'quality_check': 'Barang Anda sedang dalam proses quality check.',
      'processing': 'Refund Anda sedang diproses.',
      'completed': 'Return dan refund Anda telah selesai diproses.',
      'created': 'Return request Anda telah berhasil dibuat dan akan segera diproses.'
    };

    const message = statusMessages[status] || 'Status return Anda telah diupdate.';

    // Send email notification
    if (user.email) {
      await sendEmail({
        to: user.email,
        subject: `Update Status Return - ${returnRequest.return_number}`,
        html: `
          <h3>Update Status Return</h3>
          <p>Halo ${user.name},</p>
          <p>${message}</p>
          <p>Nomor Return: ${returnRequest.return_number}</p>
          <p>Status: ${status}</p>
          <br>
          <p>Terima kasih,<br>Tim Customer Service</p>
        `
      });
    }

  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * Process payment refund with Midtrans
 * @param {object} returnRequest - Return request object
 * @param {number} amount - Refund amount
 * @returns {object} Refund result
 */
const processPaymentRefund = async (returnRequest, amount) => {
  try {
    const midtransClient = require('midtrans-client');
    
    const core = new midtransClient.CoreApi({
      isProduction: process.env.NODE_ENV === 'production',
      serverKey: process.env.MIDTRANS_SERVER_KEY,
      clientKey: process.env.MIDTRANS_CLIENT_KEY
    });

    const parameter = {
      refund_key: `refund-${returnRequest.return_number}-${Date.now()}`,
      amount: amount,
      reason: 'Return request approved'
    };

    const refundResponse = await core.refund(returnRequest.order.transaction_id, parameter);

    return {
      success: refundResponse.status_code === '200',
      refund_id: refundResponse.refund_key,
      error: refundResponse.status_message
    };

  } catch (error) {
    console.error('Error processing refund:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  checkReturnEligibility,
  createReturnRequest,
  getUserReturns,
  getReturnById,
  cancelReturnRequest,
  getAllReturns,
  getReturnByIdAdmin,
  processReturnRequest,
  markItemReceived,
  processQualityCheck,
  processRefund
};