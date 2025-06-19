const { Product, Category, ProductImage, ProductVariation } = require('../models');
const { Op } = require('sequelize');
const { successResponse, errorResponse, getPagination, getPaginationData } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');

/**
 * Get all products with pagination
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, sort, min, max } = req.query;
    const { limit: limitVal, offset } = getPagination(page, limit);
    
    // Build where condition
    const whereCondition = { is_active: true };
    
    // Search by name
    if (search) {
      whereCondition.name = { [Op.iLike]: `%${search}%` };
    }
    
    // Filter by category
    if (category) {
      whereCondition.category_id = category;
    }
    
    // Filter by price range
    if (min) {
      whereCondition.price = { ...whereCondition.price, [Op.gte]: min };
    }
    
    if (max) {
      whereCondition.price = { ...whereCondition.price, [Op.lte]: max };
    }
    
    // Build order condition
    let orderCondition = [['createdAt', 'DESC']]; // Default: newest
    
    if (sort) {
      switch (sort) {
        case 'oldest':
          orderCondition = [['createdAt', 'ASC']];
          break;
        case 'price_asc':
          orderCondition = [['price', 'ASC']];
          break;
        case 'price_desc':
          orderCondition = [['price', 'DESC']];
          break;
        case 'name_asc':
          orderCondition = [['name', 'ASC']];
          break;
        case 'name_desc':
          orderCondition = [['name', 'DESC']];
          break;
        default:
          orderCondition = [['createdAt', 'DESC']];
      }
    }
    
    // Get products
    const products = await Product.findAndCountAll({
      where: whereCondition,
      order: orderCondition,
      limit: limitVal,
      offset,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image', 'is_primary'],
          limit: 1,
          where: { is_primary: true },
          required: false
        }
      ],
      distinct: true
    });
    
    // Format response
    const result = getPaginationData(products, page, limit);
    
    return successResponse(res, 200, 'Produk berhasil dimuat', {
      products: result.items,
      totalItems: result.totalItems,
      totalPages: result.totalPages,
      currentPage: result.currentPage
    });
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get product by ID
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image', 'is_primary', 'sort_order']
        },
        {
          model: ProductVariation,
          as: 'variations',
          attributes: ['id', 'size', 'color', 'price', 'stock']
        }
      ]
    });
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Check if product is active
    if (!product.is_active) {
      return errorResponse(res, 404, 'Produk tidak tersedia');
    }
    
    return successResponse(res, 200, 'Produk berhasil dimuat', {
      product,
      variations: product.variations
    });
  } catch (error) {
    console.error('Error in getProductById:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Create product
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, weight, category_id, is_featured } = req.body;
    
    // Input validation
    if (!name || !price) {
      return errorResponse(res, 400, 'Nama dan harga produk harus diisi');
    }

    if (name.length < 2 || name.length > 255) {
      return errorResponse(res, 400, 'Nama produk harus antara 2-255 karakter');
    }

    if (parseFloat(price) < 0) {
      return errorResponse(res, 400, 'Harga tidak boleh negatif');
    }

    if (stock && parseInt(stock) < 0) {
      return errorResponse(res, 400, 'Stok tidak boleh negatif');
    }

    if (weight && parseFloat(weight) < 0) {
      return errorResponse(res, 400, 'Berat tidak boleh negatif');
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      price,
      stock,
      weight,
      category_id,
      is_featured: is_featured || false,
      is_active: true
    });
    
    // Handle product image
    if (req.file) {
      const imagePath = `products/${req.file.filename}`;
      
      await ProductImage.create({
        product_id: product.id,
        image: imagePath,
        is_primary: true,
        sort_order: 0
      });
      
      // Update product with image
      await product.update({
        image: imagePath
      });
    }
    
    return successResponse(res, 201, 'Produk berhasil dibuat', { product });
  } catch (error) {
    console.error('Error in createProduct:', error);
    
    // Delete uploaded file if error
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, `../../uploads/products/${req.file.filename}`));
    }
    
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update product
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, weight, category_id, is_featured, is_active } = req.body;
    
    // Get product
    const product = await Product.findByPk(id);
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Update product
    await product.update({
      name: name || product.name,
      description: description || product.description,
      price: price || product.price,
      stock: stock || product.stock,
      weight: weight || product.weight,
      category_id: category_id || product.category_id,
      is_featured: is_featured !== undefined ? is_featured : product.is_featured,
      is_active: is_active !== undefined ? is_active : product.is_active
    });
    
    // Handle product image
    if (req.file) {
      const imagePath = `products/${req.file.filename}`;
      
      // Check if product has primary image
      const primaryImage = await ProductImage.findOne({
        where: {
          product_id: product.id,
          is_primary: true
        }
      });
      
      if (primaryImage) {
        // Delete old image file
        if (primaryImage.image) {
          const oldImagePath = path.join(__dirname, `../../uploads/${primaryImage.image}`);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        
        // Update primary image
        await primaryImage.update({
          image: imagePath
        });
      } else {
        // Create new primary image
        await ProductImage.create({
          product_id: product.id,
          image: imagePath,
          is_primary: true,
          sort_order: 0
        });
      }
      
      // Update product with image
      await product.update({
        image: imagePath
      });
    }
    
    return successResponse(res, 200, 'Produk berhasil diperbarui', { product });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    
    // Delete uploaded file if error
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, `../../uploads/products/${req.file.filename}`));
    }
    
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Delete product
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product
    const product = await Product.findByPk(id);
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Soft delete by setting is_active to false
    await product.update({
      is_active: false
    });
    
    return successResponse(res, 200, 'Produk berhasil dihapus');
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Add product image
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const addProductImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_primary } = req.body;
    
    // Get product
    const product = await Product.findByPk(id);
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Handle product image
    if (!req.file) {
      return errorResponse(res, 400, 'Gambar produk harus diunggah');
    }
    
    const imagePath = `products/${req.file.filename}`;
    
    // If is_primary is true, update all other images to not primary
    if (is_primary === 'true' || is_primary === true) {
      await ProductImage.update(
        { is_primary: false },
        { where: { product_id: product.id } }
      );
      
      // Update product with new primary image
      await product.update({
        image: imagePath
      });
    }
    
    // Get highest sort_order
    const maxSortOrder = await ProductImage.max('sort_order', {
      where: { product_id: product.id }
    });
    
    // Create new image
    const productImage = await ProductImage.create({
      product_id: product.id,
      image: imagePath,
      is_primary: is_primary === 'true' || is_primary === true,
      sort_order: (maxSortOrder || 0) + 1
    });
    
    return successResponse(res, 201, 'Gambar produk berhasil ditambahkan', { productImage });
  } catch (error) {
    console.error('Error in addProductImage:', error);
    
    // Delete uploaded file if error
    if (req.file) {
      fs.unlinkSync(path.join(__dirname, `../../uploads/products/${req.file.filename}`));
    }
    
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Delete product image
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const deleteProductImage = async (req, res) => {
  try {
    const { id, imageId } = req.params;
    
    // Get product
    const product = await Product.findByPk(id);
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Get product image
    const productImage = await ProductImage.findOne({
      where: {
        id: imageId,
        product_id: product.id
      }
    });
    
    if (!productImage) {
      return errorResponse(res, 404, 'Gambar produk tidak ditemukan');
    }
    
    // Delete image file
    if (productImage.image) {
      const imagePath = path.join(__dirname, `../../uploads/${productImage.image}`);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // If deleting primary image, set another image as primary
    if (productImage.is_primary) {
      const anotherImage = await ProductImage.findOne({
        where: {
          product_id: product.id,
          id: { [Op.ne]: imageId }
        },
        order: [['sort_order', 'ASC']]
      });
      
      if (anotherImage) {
        await anotherImage.update({ is_primary: true });
        
        // Update product with new primary image
        await product.update({
          image: anotherImage.image
        });
      } else {
        // No other images, clear product image
        await product.update({
          image: null
        });
      }
    }
    
    // Delete product image
    await productImage.destroy();
    
    return successResponse(res, 200, 'Gambar produk berhasil dihapus');
  } catch (error) {
    console.error('Error in deleteProductImage:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Add product variation
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const addProductVariation = async (req, res) => {
  try {
    const { id } = req.params;
    const { size, color, price, stock } = req.body;
    
    // Get product
    const product = await Product.findByPk(id);
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Check if variation already exists
    const existingVariation = await ProductVariation.findOne({
      where: {
        product_id: product.id,
        size,
        color
      }
    });
    
    if (existingVariation) {
      return errorResponse(res, 400, 'Variasi produk sudah ada');
    }
    
    // Create product variation
    const productVariation = await ProductVariation.create({
      product_id: product.id,
      size,
      color,
      price: price || product.price,
      stock: stock || 0,
      is_active: true
    });
    
    return successResponse(res, 201, 'Variasi produk berhasil ditambahkan', { productVariation });
  } catch (error) {
    console.error('Error in addProductVariation:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update product variation
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateProductVariation = async (req, res) => {
  try {
    const { id, variationId } = req.params;
    const { size, color, price, stock, is_active } = req.body;
    
    // Get product
    const product = await Product.findByPk(id);
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Get product variation
    const productVariation = await ProductVariation.findOne({
      where: {
        id: variationId,
        product_id: product.id
      }
    });
    
    if (!productVariation) {
      return errorResponse(res, 404, 'Variasi produk tidak ditemukan');
    }
    
    // Check if variation already exists
    if (size && color && (size !== productVariation.size || color !== productVariation.color)) {
      const existingVariation = await ProductVariation.findOne({
        where: {
          product_id: product.id,
          size,
          color,
          id: { [Op.ne]: variationId }
        }
      });
      
      if (existingVariation) {
        return errorResponse(res, 400, 'Variasi produk sudah ada');
      }
    }
    
    // Update product variation
    await productVariation.update({
      size: size || productVariation.size,
      color: color || productVariation.color,
      price: price || productVariation.price,
      stock: stock !== undefined ? stock : productVariation.stock,
      is_active: is_active !== undefined ? is_active : productVariation.is_active
    });
    
    return successResponse(res, 200, 'Variasi produk berhasil diperbarui', { productVariation });
  } catch (error) {
    console.error('Error in updateProductVariation:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Delete product variation
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const deleteProductVariation = async (req, res) => {
  try {
    const { id, variationId } = req.params;
    
    // Get product
    const product = await Product.findByPk(id);
    
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }
    
    // Get product variation
    const productVariation = await ProductVariation.findOne({
      where: {
        id: variationId,
        product_id: product.id
      }
    });
    
    if (!productVariation) {
      return errorResponse(res, 404, 'Variasi produk tidak ditemukan');
    }
    
    // Delete product variation (soft delete)
    await productVariation.update({
      is_active: false
    });
    
    return successResponse(res, 200, 'Variasi produk berhasil dihapus');
  } catch (error) {
    console.error('Error in deleteProductVariation:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get featured products
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getFeaturedProducts = async (req, res) => {
  try {
    const { limit = 8 } = req.query;
    
    // Get featured products
    const products = await Product.findAll({
      where: { 
        is_featured: true,
        is_active: true
      },
      limit: parseInt(limit),
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image', 'is_primary'],
          limit: 1,
          where: { is_primary: true },
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return successResponse(res, 200, 'Produk unggulan berhasil dimuat', {
      products
    });
  } catch (error) {
    console.error('Error in getFeaturedProducts:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addProductImage,
  deleteProductImage,
  addProductVariation,
  updateProductVariation,
  deleteProductVariation,
  getFeaturedProducts
}; 