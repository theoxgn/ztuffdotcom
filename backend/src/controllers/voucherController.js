const { Voucher } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get all vouchers (admin)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    // Transform is_active to status and used_count to usage_count for frontend compatibility
    const transformedVouchers = vouchers.map(voucher => ({
      ...voucher.toJSON(),
      status: voucher.is_active ? 'active' : 'inactive',
      usage_count: voucher.used_count
    }));
    
    return successResponse(res, 200, 'Voucher berhasil dimuat', { vouchers: transformedVouchers });
  } catch (error) {
    console.error('Error in getAllVouchers:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get active vouchers (user)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getActiveVouchers = async (req, res) => {
  try {
    const now = new Date();
    
    const vouchers = await Voucher.findAll({
      where: {
        is_active: true,
        start_date: { [Op.lte]: now },
        end_date: { [Op.or]: [{ [Op.gte]: now }, { [Op.is]: null }]}
      },
      order: [['createdAt', 'DESC']]
    });
    
    return successResponse(res, 200, 'Voucher berhasil dimuat', { vouchers });
  } catch (error) {
    console.error('Error in getActiveVouchers:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get voucher by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getVoucherById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const voucher = await Voucher.findByPk(id);
    
    if (!voucher) {
      return errorResponse(res, 404, 'Voucher tidak ditemukan');
    }
    
    // Transform response for frontend compatibility
    const responseVoucher = {
      ...voucher.toJSON(),
      status: voucher.is_active ? 'active' : 'inactive',
      usage_count: voucher.used_count
    };
    
    return successResponse(res, 200, 'Voucher berhasil dimuat', { voucher: responseVoucher });
  } catch (error) {
    console.error('Error in getVoucherById:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Create voucher
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const createVoucher = async (req, res) => {
  try {
    const { 
      code, 
      discount_type, 
      discount_value, 
      min_purchase, 
      max_discount,
      start_date,
      end_date,
      usage_limit,
      description,
      status
    } = req.body;
    
    // Validate required fields
    if (!code || !discount_type || !discount_value) {
      return errorResponse(res, 400, 'Kode, tipe diskon, dan nilai diskon harus diisi');
    }
    
    // Validate discount type
    if (!['percentage', 'fixed'].includes(discount_type)) {
      return errorResponse(res, 400, 'Tipe diskon harus percentage atau fixed');
    }

    // Validate discount value
    if (parseFloat(discount_value) <= 0) {
      return errorResponse(res, 400, 'Nilai diskon harus lebih dari 0');
    }

    if (discount_type === 'percentage' && parseFloat(discount_value) > 100) {
      return errorResponse(res, 400, 'Persentase diskon tidak boleh lebih dari 100%');
    }

    // Validate min_purchase
    if (min_purchase && parseFloat(min_purchase) < 0) {
      return errorResponse(res, 400, 'Minimal pembelian tidak boleh negatif');
    }

    // Validate max_discount for percentage type
    if (discount_type === 'percentage' && max_discount && parseFloat(max_discount) <= 0) {
      return errorResponse(res, 400, 'Maksimal diskon harus lebih dari 0');
    }

    // Validate usage_limit
    if (usage_limit && parseInt(usage_limit) <= 0) {
      return errorResponse(res, 400, 'Batas penggunaan harus lebih dari 0');
    }

    // Validate code format
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      return errorResponse(res, 400, 'Kode voucher harus 3-20 karakter, hanya huruf besar dan angka');
    }

    // Validate dates
    if (start_date && end_date && new Date(start_date) >= new Date(end_date)) {
      return errorResponse(res, 400, 'Tanggal mulai harus lebih awal dari tanggal berakhir');
    }
    
    // Check if code already exists
    const existingVoucher = await Voucher.findOne({
      where: { code }
    });
    
    if (existingVoucher) {
      return errorResponse(res, 400, 'Kode voucher sudah digunakan');
    }
    
    // Create voucher
    const voucher = await Voucher.create({
      code,
      discount_type,
      discount_value,
      min_purchase: min_purchase || 0,
      max_discount: max_discount || null,
      start_date: start_date || new Date(),
      end_date: end_date || null,
      usage_limit: usage_limit || null,
      used_count: 0,
      description,
      is_active: status === 'active'
    });
    
    // Transform response for frontend compatibility
    const responseVoucher = {
      ...voucher.toJSON(),
      status: voucher.is_active ? 'active' : 'inactive',
      usage_count: voucher.used_count
    };
    
    return successResponse(res, 201, 'Voucher berhasil dibuat', { voucher: responseVoucher });
  } catch (error) {
    console.error('Error in createVoucher:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update voucher
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      code, 
      discount_type, 
      discount_value, 
      min_purchase, 
      max_discount,
      start_date,
      end_date,
      usage_limit,
      description,
      status
    } = req.body;
    
    // Get voucher
    const voucher = await Voucher.findByPk(id);
    
    if (!voucher) {
      return errorResponse(res, 404, 'Voucher tidak ditemukan');
    }
    
    // Check if code already exists
    if (code && code !== voucher.code) {
      const existingVoucher = await Voucher.findOne({
        where: { code }
      });
      
      if (existingVoucher) {
        return errorResponse(res, 400, 'Kode voucher sudah digunakan');
      }
    }
    
    // Validate discount type
    if (discount_type && !['percentage', 'fixed'].includes(discount_type)) {
      return errorResponse(res, 400, 'Tipe diskon harus percentage atau fixed');
    }
    
    // Update voucher
    await voucher.update({
      code: code || voucher.code,
      discount_type: discount_type || voucher.discount_type,
      discount_value: discount_value !== undefined ? discount_value : voucher.discount_value,
      min_purchase: min_purchase !== undefined ? min_purchase : voucher.min_purchase,
      max_discount: max_discount !== undefined ? max_discount : voucher.max_discount,
      start_date: start_date || voucher.start_date,
      end_date: end_date !== undefined ? end_date : voucher.end_date,
      usage_limit: usage_limit !== undefined ? usage_limit : voucher.usage_limit,
      description: description !== undefined ? description : voucher.description,
      is_active: status !== undefined ? (status === 'active') : voucher.is_active
    });
    
    // Transform response for frontend compatibility
    const responseVoucher = {
      ...voucher.toJSON(),
      status: voucher.is_active ? 'active' : 'inactive',
      usage_count: voucher.used_count
    };
    
    return successResponse(res, 200, 'Voucher berhasil diperbarui', { voucher: responseVoucher });
  } catch (error) {
    console.error('Error in updateVoucher:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Delete voucher
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get voucher
    const voucher = await Voucher.findByPk(id);
    
    if (!voucher) {
      return errorResponse(res, 404, 'Voucher tidak ditemukan');
    }
    
    // Delete voucher
    await voucher.destroy();
    
    return successResponse(res, 200, 'Voucher berhasil dihapus');
  } catch (error) {
    console.error('Error in deleteVoucher:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Validate voucher
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const validateVoucher = async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    
    if (!code) {
      return errorResponse(res, 400, 'Kode voucher harus diisi');
    }
    
    const now = new Date();
    
    // Get voucher
    const voucher = await Voucher.findOne({
      where: {
        code,
        is_active: true,
        start_date: { [Op.lte]: now },
        end_date: { [Op.or]: [{ [Op.gte]: now }, { [Op.is]: null }]}
      }
    });
    
    if (!voucher) {
      return errorResponse(res, 404, 'Voucher tidak valid atau sudah kadaluarsa');
    }
    
    // Check usage limit
    if (voucher.usage_limit !== null && voucher.usage_count >= voucher.usage_limit) {
      return errorResponse(res, 400, 'Voucher sudah mencapai batas penggunaan');
    }
    
    // Check minimum purchase
    if (subtotal && voucher.min_purchase > 0 && subtotal < voucher.min_purchase) {
      return errorResponse(res, 400, `Minimal pembelian untuk voucher ini adalah ${voucher.min_purchase}`);
    }
    
    // Calculate discount
    let discount = 0;
    
    if (voucher.discount_type === 'percentage') {
      discount = subtotal * (voucher.discount_value / 100);
      
      // Apply max discount if set
      if (voucher.max_discount !== null && discount > voucher.max_discount) {
        discount = voucher.max_discount;
      }
    } else {
      discount = voucher.discount_value;
      
      // Ensure discount doesn't exceed subtotal
      if (discount > subtotal) {
        discount = subtotal;
      }
    }
    
    return successResponse(res, 200, 'Voucher valid', { 
      voucher,
      discount,
      final_total: subtotal - discount
    });
  } catch (error) {
    console.error('Error in validateVoucher:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getAllVouchers,
  getActiveVouchers,
  getVoucherById,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  validateVoucher
}; 