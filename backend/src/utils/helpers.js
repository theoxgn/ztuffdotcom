const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} - Random string
 */
const generateRandomString = (length = 8) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
};

/**
 * Generate order number
 * @returns {string} - Order number
 */
const generateOrderNumber = () => {
  const prefix = 'ORD';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${timestamp}${random}`;
};

/**
 * Generate JWT token
 * @param {object} user - User object
 * @returns {string} - JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Format price to IDR
 * @param {number} price - Price
 * @returns {string} - Formatted price
 */
const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
};

/**
 * Paginate results
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} - Pagination object
 */
const getPagination = (page, limit) => {
  const currentPage = parseInt(page, 10) || 1;
  const itemsPerPage = parseInt(limit, 10) || 10;
  
  const offset = (currentPage - 1) * itemsPerPage;
  
  return { limit: itemsPerPage, offset };
};

/**
 * Format pagination response
 * @param {object} data - Data object
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Pagination response
 */
const getPaginationData = (data, page, limit) => {
  const currentPage = parseInt(page, 10) || 1;
  const itemsPerPage = parseInt(limit, 10) || 10;
  
  const { count: totalItems, rows: items } = data;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  return {
    totalItems,
    items,
    totalPages,
    currentPage
  };
};

/**
 * Format success response
 * @param {object} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {object} data - Response data
 * @returns {object} - Formatted response
 */
const successResponse = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Format error response
 * @param {object} res - Response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {object} errors - Error details
 * @returns {object} - Formatted response
 */
const errorResponse = (res, statusCode = 500, message = 'Server Error', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

module.exports = {
  generateRandomString,
  generateOrderNumber,
  generateToken,
  formatPrice,
  getPagination,
  getPaginationData,
  successResponse,
  errorResponse
}; 