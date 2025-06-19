const { User, Product, Order, OrderItem, Category, Voucher, Tutorial, PaymentMethod, sequelize } = require('../models');
const { successResponse, errorResponse } = require('../utils/helpers');
const categoryController = require('./categoryController');

/**
 * Get admin dashboard data
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getDashboardData = async (req, res) => {
  try {
    // Basic counts
    const userCount = await User.count();
    const productCount = await Product.count();
    const newOrderCount = await Order.count({ where: { status: 'pending' } });
    const totalRevenue = await Order.sum('total', { where: { status: 'delivered' } }) || 0;
    const categoryCount = await Category.count();

    // Recent orders (last 10)
    const recentOrders = await Order.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: 10,
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 
        'order_number', 
        'total', 
        'status',
        'createdAt', 
        'updatedAt'
      ]
    });

    // Order status distribution
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status']
    });

    const statusDistribution = {};
    ordersByStatus.forEach(order => {
      statusDistribution[order.status] = parseInt(order.getDataValue('count'));
    });

    // Monthly sales data (last 7 months)
    const monthlyRevenue = await sequelize.query(`
      SELECT 
        TO_CHAR("createdAt", 'YYYY-MM') as month,
        SUM(total) as revenue,
        COUNT(*) as order_count
      FROM "Orders" 
      WHERE status = 'delivered' 
        AND "createdAt" >= NOW() - INTERVAL '7 months'
      GROUP BY TO_CHAR("createdAt", 'YYYY-MM')
      ORDER BY month DESC
    `, { type: sequelize.QueryTypes.SELECT });

    // Top selling products
    const topProducts = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.image,
        c.name as category_name,
        COALESCE(SUM(oi.quantity), 0) as sold_count,
        COALESCE(SUM(oi.quantity * oi.price), 0) as revenue
      FROM "Products" p
      LEFT JOIN "OrderItems" oi ON p.id = oi.product_id
      LEFT JOIN "Orders" o ON oi.order_id = o.id
      LEFT JOIN "Categories" c ON p.category_id = c.id
      WHERE o.status = 'delivered' OR o.status IS NULL
      GROUP BY p.id, p.name, p.price, p.image, c.name
      ORDER BY sold_count DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    // Sales by category
    const salesByCategory = await sequelize.query(`
      SELECT 
        c.name,
        COALESCE(SUM(oi.quantity * oi.price), 0) as sales
      FROM "Categories" c
      LEFT JOIN "Products" p ON c.id = p.category_id
      LEFT JOIN "OrderItems" oi ON p.id = oi.product_id
      LEFT JOIN "Orders" o ON oi.order_id = o.id
      WHERE o.status = 'delivered' OR o.status IS NULL
      GROUP BY c.id, c.name
      ORDER BY sales DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    return successResponse(res, 200, 'Data dashboard berhasil dimuat', {
      userCount,
      productCount,
      newOrderCount,
      totalRevenue,
      categoryCount,
      recentOrders,
      ordersByStatus: statusDistribution,
      monthlySales: monthlyRevenue.map(m => parseFloat(m.revenue) || 0),
      topProducts,
      salesByCategory
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

/**
 * Get single order details
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'createdAt']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'image']
            }
          ]
        },
        {
          model: PaymentMethod,
          as: 'paymentMethod',
          attributes: ['id', 'name', 'description']
        }
      ]
    });

    if (!order) {
      return errorResponse(res, 404, 'Pesanan tidak ditemukan');
    }

    return successResponse(res, 200, 'Detail pesanan berhasil dimuat', { order });
  } catch (error) {
    console.error('Error in getOrderDetail:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Update order status
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return errorResponse(res, 404, 'Pesanan tidak ditemukan');
    }

    await order.update({ 
      status,
      updatedAt: new Date()
    });

    return successResponse(res, 200, 'Status pesanan berhasil diperbarui', { order });
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Add note to order
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const addOrderNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const order = await Order.findByPk(id);
    if (!order) {
      return errorResponse(res, 404, 'Pesanan tidak ditemukan');
    }

    // For now, we'll just return success
    // In a real implementation, you'd save this to an order_notes table
    return successResponse(res, 200, 'Catatan berhasil ditambahkan');
  } catch (error) {
    console.error('Error in addOrderNote:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Get single product details
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const getProductDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }

    return successResponse(res, 200, 'Detail produk berhasil dimuat', { product });
  } catch (error) {
    console.error('Error in getProductDetail:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

/**
 * Create new product
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @returns {object} Response object
 */
const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Handle image upload if present
    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    }

    const product = await Product.create(productData);
    
    return successResponse(res, 201, 'Produk berhasil dibuat', { product });
  } catch (error) {
    console.error('Error in createProduct:', error);
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
    const productData = req.body;

    const product = await Product.findByPk(id);
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }

    // Handle image upload if present
    if (req.file) {
      productData.image = `/uploads/products/${req.file.filename}`;
    }

    await product.update(productData);
    
    return successResponse(res, 200, 'Produk berhasil diperbarui', { product });
  } catch (error) {
    console.error('Error in updateProduct:', error);
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

    const product = await Product.findByPk(id);
    if (!product) {
      return errorResponse(res, 404, 'Produk tidak ditemukan');
    }

    await product.destroy();
    
    return successResponse(res, 200, 'Produk berhasil dihapus');
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    return errorResponse(res, 500, 'Terjadi kesalahan pada server');
  }
};

module.exports = {
  getDashboardData,
  getAllCategories,
  createCategory: categoryController.createCategory,
  updateCategory: categoryController.updateCategory,
  deleteCategory: categoryController.deleteCategory,
  getAllOrders,
  getAllVouchers,
  getAllTutorials,
  getAllUsers,
  getAllProducts,
  getOrderDetail,
  updateOrderStatus,
  addOrderNote,
  getProductDetail,
  createProduct,
  updateProduct,
  deleteProduct
}; 