const { Category, Product } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get all categories
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      order: [['name', 'ASC']]
    });
    
    return successResponse(res, 200, 'Kategori berhasil dimuat', { categories });
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get category by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return errorResponse(res, 404, 'Kategori tidak ditemukan');
    }
    
    if (!category.is_active) {
      return errorResponse(res, 404, 'Kategori tidak tersedia');
    }
    
    return successResponse(res, 200, 'Kategori berhasil dimuat', { category });
  } catch (error) {
    console.error('Error in getCategoryById:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Create category
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return errorResponse(res, 400, 'Nama kategori harus diisi');
    }
    
    const existingCategory = await Category.findOne({
      where: { name }
    });
    
    if (existingCategory) {
      return errorResponse(res, 400, 'Nama kategori sudah digunakan');
    }
    
    const category = await Category.create({
      name,
      description,
      is_active: true
    });
    
    return successResponse(res, 201, 'Kategori berhasil dibuat', { category });
  } catch (error) {
    console.error('Error in createCategory:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update category
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_active } = req.body;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return errorResponse(res, 404, 'Kategori tidak ditemukan');
    }
    
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({
        where: { name }
      });
      
      if (existingCategory) {
        return errorResponse(res, 400, 'Nama kategori sudah digunakan');
      }
    }
    
    await category.update({
      name: name || category.name,
      description: description !== undefined ? description : category.description,
      is_active: is_active !== undefined ? is_active : category.is_active
    });
    
    return successResponse(res, 200, 'Kategori berhasil diperbarui', { category });
  } catch (error) {
    console.error('Error in updateCategory:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Delete category
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return errorResponse(res, 404, 'Kategori tidak ditemukan');
    }
    
    // Check if category has products
    const productsCount = await Product.count({
      where: { category_id: id }
    });
    
    if (productsCount > 0) {
      return errorResponse(res, 400, 'Kategori tidak dapat dihapus karena masih memiliki produk');
    }
    
    // Soft delete
    await category.update({ is_active: false });
    
    return successResponse(res, 200, 'Kategori berhasil dihapus');
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
}; 