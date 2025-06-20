const { Discount, Product, Category } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get all discounts (admin)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllDiscounts = async (req, res) => {
  try {
    const discounts = await Discount.findAll({
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });
    
    return successResponse(res, 200, 'Diskon berhasil dimuat', { discounts });
  } catch (error) {
    console.error('Error in getAllDiscounts:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get active discounts (user)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getActiveDiscounts = async (req, res) => {
  try {
    const now = new Date();
    
    const discounts = await Discount.findAll({
      where: {
        is_active: true,
        start_date: { [Op.lte]: now },
        [Op.or]: [
          { end_date: { [Op.gte]: now } },
          { end_date: { [Op.is]: null } }
        ]
      },
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });
    
    return successResponse(res, 200, 'Diskon aktif berhasil dimuat', { discounts });
  } catch (error) {
    console.error('Error in getActiveDiscounts:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get discount by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getDiscountById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const discount = await Discount.findByPk(id);
    
    if (!discount) {
      return errorResponse(res, 404, 'Diskon tidak ditemukan');
    }
    
    return successResponse(res, 200, 'Diskon berhasil dimuat', { discount });
  } catch (error) {
    console.error('Error in getDiscountById:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Create discount
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const createDiscount = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      type, 
      value, 
      min_purchase,
      max_discount,
      start_date,
      end_date,
      target_type,
      target_ids,
      is_active,
      priority
    } = req.body;
    
    // Validate required fields
    if (!name || !type || !value || !target_type) {
      return errorResponse(res, 400, 'Nama, tipe, nilai, dan target diskon harus diisi');
    }
    
    // Validate discount type
    if (!['percentage', 'fixed'].includes(type)) {
      return errorResponse(res, 400, 'Tipe diskon harus percentage atau fixed');
    }
    
    // Validate target type
    if (!['all', 'category', 'product'].includes(target_type)) {
      return errorResponse(res, 400, 'Target type harus all, category, atau product');
    }
    
    // Validate discount value
    if (parseFloat(value) <= 0) {
      return errorResponse(res, 400, 'Nilai diskon harus lebih dari 0');
    }
    
    if (type === 'percentage' && parseFloat(value) > 100) {
      return errorResponse(res, 400, 'Persentase diskon tidak boleh lebih dari 100%');
    }
    
    // Validate dates
    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      return errorResponse(res, 400, 'Tanggal mulai harus lebih awal dari tanggal berakhir');
    }
    
    // Parse target_ids if provided
    let parsedTargetIds = null;
    if (target_ids && target_type !== 'all') {
      try {
        parsedTargetIds = Array.isArray(target_ids) ? JSON.stringify(target_ids) : target_ids;
      } catch (e) {
        return errorResponse(res, 400, 'Format target IDs tidak valid');
      }
    }
    
    // Create discount
    const discount = await Discount.create({
      name,
      description,
      type,
      value,
      min_purchase: min_purchase || 0,
      max_discount: max_discount || null,
      start_date: start_date || new Date(),
      end_date: end_date || null,
      target_type,
      target_ids: parsedTargetIds,
      is_active: is_active !== undefined ? is_active : true,
      priority: priority || 0
    });
    
    return successResponse(res, 201, 'Diskon berhasil dibuat', { discount });
  } catch (error) {
    console.error('Error in createDiscount:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update discount
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      type, 
      value, 
      min_purchase,
      max_discount,
      start_date,
      end_date,
      target_type,
      target_ids,
      is_active,
      priority
    } = req.body;
    
    // Get discount
    const discount = await Discount.findByPk(id);
    
    if (!discount) {
      return errorResponse(res, 404, 'Diskon tidak ditemukan');
    }
    
    // Parse target_ids if provided
    let parsedTargetIds = discount.target_ids;
    if (target_ids !== undefined && target_type !== 'all') {
      try {
        parsedTargetIds = Array.isArray(target_ids) ? JSON.stringify(target_ids) : target_ids;
      } catch (e) {
        return errorResponse(res, 400, 'Format target IDs tidak valid');
      }
    }
    
    // Update discount
    await discount.update({
      name: name || discount.name,
      description: description !== undefined ? description : discount.description,
      type: type || discount.type,
      value: value !== undefined ? value : discount.value,
      min_purchase: min_purchase !== undefined ? min_purchase : discount.min_purchase,
      max_discount: max_discount !== undefined ? max_discount : discount.max_discount,
      start_date: start_date || discount.start_date,
      end_date: end_date !== undefined ? end_date : discount.end_date,
      target_type: target_type || discount.target_type,
      target_ids: parsedTargetIds,
      is_active: is_active !== undefined ? is_active : discount.is_active,
      priority: priority !== undefined ? priority : discount.priority
    });
    
    return successResponse(res, 200, 'Diskon berhasil diperbarui', { discount });
  } catch (error) {
    console.error('Error in updateDiscount:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Delete discount
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const deleteDiscount = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get discount
    const discount = await Discount.findByPk(id);
    
    if (!discount) {
      return errorResponse(res, 404, 'Diskon tidak ditemukan');
    }
    
    // Delete discount
    await discount.destroy();
    
    return successResponse(res, 200, 'Diskon berhasil dihapus');
  } catch (error) {
    console.error('Error in deleteDiscount:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get applicable discounts for a product
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getProductDiscounts = async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get product with category
    const product = await Product.findByPk(productId, {
      include: [{ model: Category, as: 'category' }]
    });
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    const now = new Date();
    
    // Get applicable discounts
    const discounts = await Discount.findAll({
      where: {
        is_active: true,
        start_date: { [Op.lte]: now },
        [Op.or]: [
          { end_date: { [Op.gte]: now } },
          { end_date: { [Op.is]: null } }
        ],
        [Op.or]: [
          { target_type: 'all' },
          { 
            target_type: 'product',
            target_ids: { [Op.like]: `%"${productId}"%` }
          },
          { 
            target_type: 'category',
            target_ids: { [Op.like]: `%"${product.category_id}"%` }
          }
        ]
      },
      order: [['priority', 'DESC'], ['value', 'DESC']]
    });
    
    return successResponse(res, 200, 'Diskon produk berhasil dimuat', { 
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        category: product.category
      },
      discounts 
    });
  } catch (error) {
    console.error('Error in getProductDiscounts:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getAllDiscounts,
  getActiveDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
  getProductDiscounts
};