const { PaymentMethod } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get all payment methods
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = await PaymentMethod.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    
    return successResponse(res, 200, 'Metode pembayaran berhasil dimuat', { paymentMethods });
  } catch (error) {
    console.error('Error in getAllPaymentMethods:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get payment method by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getPaymentMethodById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const paymentMethod = await PaymentMethod.findOne({
      where: { id, is_active: true }
    });
    
    if (!paymentMethod) {
      return errorResponse(res, 404, 'Metode pembayaran tidak ditemukan');
    }
    
    return successResponse(res, 200, 'Metode pembayaran berhasil dimuat', { paymentMethod });
  } catch (error) {
    console.error('Error in getPaymentMethodById:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Create payment method
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const createPaymentMethod = async (req, res) => {
  try {
    const { name, description, account_number, account_name, bank_name } = req.body;
    
    // Validate required fields
    if (!name) {
      return errorResponse(res, 400, 'Nama metode pembayaran harus diisi');
    }
    
    // Create payment method
    const paymentMethod = await PaymentMethod.create({
      name,
      description,
      account_number,
      account_name,
      bank_name,
      is_active: true
    });
    
    return successResponse(res, 201, 'Metode pembayaran berhasil dibuat', { paymentMethod });
  } catch (error) {
    console.error('Error in createPaymentMethod:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update payment method
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, account_number, account_name, bank_name, is_active } = req.body;
    
    // Get payment method
    const paymentMethod = await PaymentMethod.findByPk(id);
    
    if (!paymentMethod) {
      return errorResponse(res, 404, 'Metode pembayaran tidak ditemukan');
    }
    
    // Update payment method
    await paymentMethod.update({
      name: name || paymentMethod.name,
      description: description !== undefined ? description : paymentMethod.description,
      account_number: account_number !== undefined ? account_number : paymentMethod.account_number,
      account_name: account_name !== undefined ? account_name : paymentMethod.account_name,
      bank_name: bank_name !== undefined ? bank_name : paymentMethod.bank_name,
      is_active: is_active !== undefined ? is_active : paymentMethod.is_active
    });
    
    return successResponse(res, 200, 'Metode pembayaran berhasil diperbarui', { paymentMethod });
  } catch (error) {
    console.error('Error in updatePaymentMethod:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Delete payment method
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get payment method
    const paymentMethod = await PaymentMethod.findByPk(id);
    
    if (!paymentMethod) {
      return errorResponse(res, 404, 'Metode pembayaran tidak ditemukan');
    }
    
    // Delete payment method (soft delete)
    await paymentMethod.update({
      is_active: false
    });
    
    return successResponse(res, 200, 'Metode pembayaran berhasil dihapus');
  } catch (error) {
    console.error('Error in deletePaymentMethod:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getAllPaymentMethods,
  getPaymentMethodById,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod
}; 