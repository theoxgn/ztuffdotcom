const { User, Product, Order, Category, Voucher, Tutorial, sequelize } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');

/**
 * Get admin dashboard data
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getDashboardData = async (req, res) => {
  try {
    const userCount = await User.count();
    const productCount = await Product.count();
    const newOrderCount = await Order.count({ where: { status: 'pending' } });
    const totalRevenue = await Order.sum('total', { where: { status: 'paid' } }) || 0;
    const categoryCount = await Category.count();
    
    return successResponse(res, 200, 'Data dashboard berhasil dimuat', {
      userCount,
      productCount,
      newOrderCount,
      totalRevenue,
      categoryCount
    });
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get all categories for admin
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllCategories = async (req, res) => {
  try {
    // Dapatkan semua kategori
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    // Dapatkan jumlah produk untuk setiap kategori
    const categoryIds = categories.map(category => category.id);
    const productCounts = await Product.findAll({
      attributes: [
        'category_id',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        category_id: categoryIds
      },
      group: ['category_id']
    });
    
    // Buat map untuk jumlah produk
    const productCountMap = {};
    productCounts.forEach(result => {
      productCountMap[result.category_id] = result.getDataValue('count');
    });
    
    // Tambahkan jumlah produk ke setiap kategori
    const categoriesWithCount = categories.map(category => {
      const categoryData = category.toJSON();
      categoryData.product_count = productCountMap[category.id] || 0;
      return categoryData;
    });
    
    return successResponse(res, 200, 'Kategori berhasil dimuat', { categories: categoriesWithCount });
  } catch (error) {
    console.error('Error in admin getAllCategories:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get all orders for admin
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      attributes: [
        'id', 
        'order_number', 
        'total', 
        'shipping_cost', 
        'status',
        'createdAt', 
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return successResponse(res, 200, 'Pesanan berhasil dimuat', { orders });
  } catch (error) {
    console.error('Error in admin getAllOrders:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get all vouchers for admin
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.findAll({
      attributes: [
        'id',
        'code',
        'discount_type',
        'discount_value',
        'min_purchase',
        'max_discount',
        'start_date',
        'end_date',
        'is_active',
        'usage_limit',
        'used_count',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return successResponse(res, 200, 'Voucher berhasil dimuat', { vouchers });
  } catch (error) {
    console.error('Error in admin getAllVouchers:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get all tutorials for admin
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllTutorials = async (req, res) => {
  try {
    const tutorials = await Tutorial.findAll({
      attributes: [
        'id',
        'title',
        'content',
        'image',
        'is_active',
        'createdAt',
        'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return successResponse(res, 200, 'Tutorial berhasil dimuat', { tutorials });
  } catch (error) {
    console.error('Error in admin getAllTutorials:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get all users for admin
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    
    return successResponse(res, 200, 'Pengguna berhasil dimuat', { users });
  } catch (error) {
    console.error('Error in admin getAllUsers:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get all products for admin
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    return successResponse(res, 200, 'Produk berhasil dimuat', { products });
  } catch (error) {
    console.error('Error in admin getAllProducts:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getDashboardData,
  getAllCategories,
  getAllOrders,
  getAllVouchers,
  getAllTutorials,
  getAllUsers,
  getAllProducts
}; 