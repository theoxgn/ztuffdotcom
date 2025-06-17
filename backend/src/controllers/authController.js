const { User } = require('../models');
const { generateToken, successResponse, errorResponse } = require('../utils/helpers');
const bcrypt = require('bcrypt');

/**
 * Register a new user
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const register = async (req, res) => {
  try {
    const { name, email, password, store_name, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 400, 'Email sudah terdaftar');
    }

    // Create new user
    const user = await User.create({
      name,
      email,
      password, // Password will be hashed by the User model hook
      store_name,
      phone,
      role: 'user',
      is_active: true
    });

    // Generate token
    const token = generateToken(user);

    // Return success response
    return successResponse(res, 201, 'Registrasi berhasil', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        store_name: user.store_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error in register:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Login user
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 401, 'Email atau password salah');
    }

    // Check if user is active
    if (!user.is_active) {
      return errorResponse(res, 403, 'Akun Anda telah dinonaktifkan');
    }

    // Check password
    const isPasswordValid = await user.checkPassword(password);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Email atau password salah');
    }

    // Generate token
    const token = generateToken(user);

    // Return success response
    return successResponse(res, 200, 'Login berhasil', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        store_name: user.store_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Error in login:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get current user profile
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getProfile = async (req, res) => {
  try {
    const user = req.user;

    // Return success response
    return successResponse(res, 200, 'Profil berhasil dimuat', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        store_name: user.store_name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        province: user.province,
        postal_code: user.postal_code,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update user profile
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { name, store_name, phone, address, city, province, postal_code } = req.body;

    // Update user
    await user.update({
      name,
      store_name,
      phone,
      address,
      city,
      province,
      postal_code
    });

    // Return success response
    return successResponse(res, 200, 'Profil berhasil diperbarui', {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        store_name: user.store_name,
        phone: user.phone,
        address: user.address,
        city: user.city,
        province: user.province,
        postal_code: user.postal_code,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Change user password
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const changePassword = async (req, res) => {
  try {
    const user = req.user;
    const { current_password, new_password } = req.body;

    // Check current password
    const isPasswordValid = await user.checkPassword(current_password);
    if (!isPasswordValid) {
      return errorResponse(res, 401, 'Password saat ini salah');
    }

    // Update password
    user.password = new_password;
    await user.save();

    // Return success response
    return successResponse(res, 200, 'Password berhasil diubah');
  } catch (error) {
    console.error('Error in changePassword:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword
}; 