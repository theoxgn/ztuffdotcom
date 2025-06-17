const { Tutorial } = require('../models');
const { successResponse, errorResponse, getPagination, getPaginationData } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');

/**
 * Get all tutorials with pagination
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllTutorials = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);
    
    // Get tutorials
    const tutorials = await Tutorial.findAndCountAll({
      where: { is_active: true },
      order: [['sort_order', 'ASC'], ['createdAt', 'DESC']],
      limit: limitVal,
      offset
    });
    
    // Format response
    const result = getPaginationData(tutorials, page, limit);
    
    return successResponse(res, 200, 'Tutorial berhasil dimuat', {
      tutorials: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.currentPage
    });
  } catch (error) {
    console.error('Error in getAllTutorials:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get tutorial by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getTutorialById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get tutorial
    const tutorial = await Tutorial.findOne({
      where: { id, is_active: true }
    });
    
    if (!tutorial) {
      return errorResponse(res, 404, 'Tutorial tidak ditemukan');
    }
    
    return successResponse(res, 200, 'Tutorial berhasil dimuat', { tutorial });
  } catch (error) {
    console.error('Error in getTutorialById:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Create tutorial
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const createTutorial = async (req, res) => {
  try {
    const { title, content, video_url, sort_order } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return errorResponse(res, 400, 'Judul dan konten harus diisi');
    }
    
    // Create tutorial
    const tutorial = await Tutorial.create({
      title,
      content,
      video_url,
      sort_order: sort_order || 0,
      is_active: true
    });
    
    // Handle tutorial image
    if (req.file) {
      const imagePath = `tutorials/${req.file.filename}`;
      
      // Update tutorial with image
      await tutorial.update({
        image: imagePath
      });
    }
    
    return successResponse(res, 201, 'Tutorial berhasil dibuat', { tutorial });
  } catch (error) {
    console.error('Error in createTutorial:', error);
    
    // Delete uploaded file if error
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, `../../uploads/tutorials/${req.file.filename}`));
    }
    
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update tutorial
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateTutorial = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, video_url, sort_order, is_active } = req.body;
    
    // Get tutorial
    const tutorial = await Tutorial.findByPk(id);
    
    if (!tutorial) {
      return errorResponse(res, 404, 'Tutorial tidak ditemukan');
    }
    
    // Update tutorial
    await tutorial.update({
      title: title || tutorial.title,
      content: content || tutorial.content,
      video_url: video_url !== undefined ? video_url : tutorial.video_url,
      sort_order: sort_order !== undefined ? sort_order : tutorial.sort_order,
      is_active: is_active !== undefined ? is_active : tutorial.is_active
    });
    
    // Handle tutorial image
    if (req.file) {
      const imagePath = `tutorials/${req.file.filename}`;
      
      // Delete old image file
      if (tutorial.image) {
        const oldImagePath = path.join(__dirname, `../../uploads/${tutorial.image}`);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      // Update tutorial with new image
      await tutorial.update({
        image: imagePath
      });
    }
    
    return successResponse(res, 200, 'Tutorial berhasil diperbarui', { tutorial });
  } catch (error) {
    console.error('Error in updateTutorial:', error);
    
    // Delete uploaded file if error
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, `../../uploads/tutorials/${req.file.filename}`));
    }
    
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Delete tutorial
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const deleteTutorial = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get tutorial
    const tutorial = await Tutorial.findByPk(id);
    
    if (!tutorial) {
      return errorResponse(res, 404, 'Tutorial tidak ditemukan');
    }
    
    // Delete tutorial (soft delete)
    await tutorial.update({
      is_active: false
    });
    
    return successResponse(res, 200, 'Tutorial berhasil dihapus');
  } catch (error) {
    console.error('Error in deleteTutorial:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getAllTutorials,
  getTutorialById,
  createTutorial,
  updateTutorial,
  deleteTutorial
}; 