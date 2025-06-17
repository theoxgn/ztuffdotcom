const { Point, User } = require('../models');
const { successResponse, errorResponse, getPagination, getPaginationData } = require('../utils/helpers');
const { Op } = require('sequelize');

/**
 * Get user points
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get total points
    const totalPoints = await Point.sum('amount', {
      where: { user_id: userId }
    }) || 0;
    
    return successResponse(res, 200, 'Poin berhasil dimuat', { totalPoints });
  } catch (error) {
    console.error('Error in getUserPoints:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get user point history
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getUserPointHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, type } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);
    
    // Build where condition
    const whereCondition = { user_id: userId };
    
    // Filter by type
    if (type && ['earned', 'redeemed'].includes(type)) {
      whereCondition.type = type;
    }
    
    // Get point history
    const pointHistory = await Point.findAndCountAll({
      where: whereCondition,
      order: [['createdAt', 'DESC']],
      limit: limitVal,
      offset
    });
    
    // Format response
    const result = getPaginationData(pointHistory, page, limit);
    
    return successResponse(res, 200, 'Riwayat poin berhasil dimuat', {
      points: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.currentPage
    });
  } catch (error) {
    console.error('Error in getUserPointHistory:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Add points (admin only)
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const addPoints = async (req, res) => {
  try {
    const { user_id, amount, description } = req.body;
    
    // Validate required fields
    if (!user_id || !amount) {
      return errorResponse(res, 400, 'ID pengguna dan jumlah poin harus diisi');
    }
    
    // Check if user exists
    const user = await User.findByPk(user_id);
    
    if (!user) {
      return errorResponse(res, 404, 'Pengguna tidak ditemukan');
    }
    
    // Get current balance
    const currentBalance = await Point.sum('amount', {
      where: { user_id }
    }) || 0;
    
    // Add points
    const point = await Point.create({
      user_id,
      amount,
      type: 'earned',
      description: description || 'Poin ditambahkan oleh admin',
      balance: currentBalance + amount
    });
    
    return successResponse(res, 201, 'Poin berhasil ditambahkan', { point });
  } catch (error) {
    console.error('Error in addPoints:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Redeem points
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const redeemPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, description } = req.body;
    
    // Validate required fields
    if (!amount || amount <= 0) {
      return errorResponse(res, 400, 'Jumlah poin harus diisi dan lebih dari 0');
    }
    
    // Get current balance
    const currentBalance = await Point.sum('amount', {
      where: { user_id: userId }
    }) || 0;
    
    // Check if user has enough points
    if (currentBalance < amount) {
      return errorResponse(res, 400, 'Poin tidak mencukupi');
    }
    
    // Redeem points
    const point = await Point.create({
      user_id: userId,
      amount: -amount, // Negative amount for redemption
      type: 'redeemed',
      description: description || 'Poin ditukarkan',
      balance: currentBalance - amount
    });
    
    return successResponse(res, 201, 'Poin berhasil ditukarkan', { 
      point,
      remainingPoints: currentBalance - amount
    });
  } catch (error) {
    console.error('Error in redeemPoints:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getUserPoints,
  getUserPointHistory,
  addPoints,
  redeemPoints
}; 