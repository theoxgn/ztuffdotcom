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
    const { Op } = require('sequelize');
    const totalRevenue = await Order.sum('total', { 
      where: { status: { [Op.in]: ['paid', 'processing', 'shipped', 'delivered'] } } 
    }) || 0;
    const categoryCount = await Category.count();
    const totalOrderCount = await Order.count();
    

    // Recent orders (last 5)
    const recentOrders = await Order.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: 5,
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

    // Monthly sales data (last 6 months including current month)
    const monthlyRevenue = await sequelize.query(`
      WITH monthly_range AS (
        SELECT 
          TO_CHAR(generate_series(
            DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
            DATE_TRUNC('month', NOW()),
            INTERVAL '1 month'
          ), 'YYYY-MM') as month
      )
      SELECT 
        mr.month,
        COALESCE(SUM(o.total), 0) as revenue,
        COALESCE(COUNT(o.id), 0) as order_count
      FROM monthly_range mr
      LEFT JOIN "Orders" o ON TO_CHAR(o."createdAt", 'YYYY-MM') = mr.month 
        AND o.status = 'delivered'
      GROUP BY mr.month
      ORDER BY mr.month ASC
    `, { type: sequelize.QueryTypes.SELECT });

    // Top selling products (only products that have been sold)
    const topProducts = await sequelize.query(`
      SELECT 
        p.id,
        p.name,
        p.price,
        p.image,
        c.name as category_name,
        SUM(oi.quantity) as sold_count,
        SUM(oi.quantity * oi.price) as revenue
      FROM "Products" p
      INNER JOIN "OrderItems" oi ON p.id = oi.product_id
      INNER JOIN "Orders" o ON oi.order_id = o.id
      LEFT JOIN "Categories" c ON p.category_id = c.id
      WHERE o.status = 'delivered'
      GROUP BY p.id, p.name, p.price, p.image, c.name
      HAVING SUM(oi.quantity) > 0
      ORDER BY sold_count DESC
      LIMIT 10
    `, { type: sequelize.QueryTypes.SELECT });

    // Sales by category (only categories with actual sales)
    const salesByCategory = await sequelize.query(`
      SELECT 
        c.name,
        SUM(oi.quantity * oi.price) as sales
      FROM "Categories" c
      INNER JOIN "Products" p ON c.id = p.category_id
      INNER JOIN "OrderItems" oi ON p.id = oi.product_id
      INNER JOIN "Orders" o ON oi.order_id = o.id
      WHERE o.status = 'delivered'
      GROUP BY c.id, c.name
      HAVING SUM(oi.quantity * oi.price) > 0
      ORDER BY sales DESC
      LIMIT 5
    `, { type: sequelize.QueryTypes.SELECT });

    return successResponse(res, 200, 'Data dashboard berhasil dimuat', {
      userCount,
      productCount,
      totalOrderCount,
      newOrderCount,
      totalRevenue: parseFloat(totalRevenue) || 0,
      categoryCount,
      recentOrders,
      ordersByStatus: statusDistribution,
      monthlyRevenue: monthlyRevenue.map(m => ({
        month: m.month,
        revenue: parseFloat(m.revenue) || 0,
        orderCount: parseInt(m.order_count) || 0
      })),
      topProducts: topProducts.map(p => ({
        ...p,
        price: parseFloat(p.price) || 0,
        sold_count: parseInt(p.sold_count) || 0,
        revenue: parseFloat(p.revenue) || 0,
        image: p.image ? `${process.env.API_BASE_URL || 'http://localhost:3001'}${p.image}` : null
      })),
      salesByCategory: salesByCategory.map(s => ({
        name: s.name,
        sales: parseFloat(s.sales) || 0
      }))
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
      order: [['createdAt', 'DESC']],
      where: {
        is_active: true
      }
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
    const { page = 1, limit = 10, search, category } = req.query;
    const offset = (page - 1) * limit;
    
    // Build where condition
    const whereCondition = {};
    
    if (search) {
      whereCondition.name = {
        [require('sequelize').Op.iLike]: `%${search}%`
      };
    }
    
    if (category) {
      whereCondition.category_id = category;
    }
    
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    const totalPages = Math.ceil(count / limit);
    
    return successResponse(res, 200, 'Produk berhasil dimuat', { 
      products,
      totalItems: count,
      totalPages,
      currentPage: parseInt(page),
      itemsPerPage: parseInt(limit)
    });
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
        },
        {
          model: require('../models').ProductVariation,
          as: 'variations',
          attributes: ['id', 'size', 'color', 'price', 'stock', 'is_active']
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

    // Parse combinations or variations if present
    let combinations = [];
    let variations = [];
    
    if (productData.combinations) {
      try {
        combinations = JSON.parse(productData.combinations);
      } catch (e) {
        console.error('Error parsing combinations:', e);
      }
    } else if (productData.variations) {
      try {
        variations = JSON.parse(productData.variations);
      } catch (e) {
        console.error('Error parsing variations:', e);
      }
    }

    // Remove from productData as they're not Product fields
    delete productData.combinations;
    delete productData.variations;

    const product = await Product.create(productData);
    
    // Create combinations if provided (preferred method)
    if (combinations.length > 0) {
      const { ProductVariation } = require('../models');
      
      for (const combination of combinations) {
        const variationData = {
          product_id: product.id,
          size: combination.values.size || null,
          color: combination.values.color || null,
          price: parseFloat(combination.price) || parseFloat(productData.price),
          stock: parseInt(combination.stock) || 0,
          is_active: combination.is_active !== false,
          combination_string: combination.combination_string || null
        };
        
        // Handle custom variation types (material, etc.)
        Object.keys(combination.values).forEach(key => {
          if (key !== 'size' && key !== 'color' && combination.values[key]) {
            // Store custom variations in size field with prefix
            if (!variationData.size) {
              variationData.size = `${key}: ${combination.values[key]}`;
            } else {
              variationData.size += ` | ${key}: ${combination.values[key]}`;
            }
          }
        });
        
        await ProductVariation.create(variationData);
      }
    }
    // Create variations if provided (legacy method)
    else if (variations.length > 0) {
      const { ProductVariation } = require('../models');
      
      for (const variation of variations) {
        // Create variation entries for each value
        for (const value of variation.values) {
          const variationData = {
            product_id: product.id,
            size: null,
            color: null,
            price: parseFloat(productData.price),
            stock: Math.floor(parseInt(productData.stock) / variations.length) || 0,
            is_active: true
          };
          
          // Set the appropriate field based on variation type
          if (variation.type === 'size') {
            variationData.size = value;
          } else if (variation.type === 'color') {
            variationData.color = value;
          } else {
            // For material, other types, store in size field as fallback
            variationData.size = `${variation.name}: ${value}`;
          }
          
          await ProductVariation.create(variationData);
        }
      }
    }
    
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

    // Parse combinations or variations if present
    let combinations = [];
    let variations = [];
    
    if (productData.combinations) {
      try {
        combinations = JSON.parse(productData.combinations);
      } catch (e) {
        console.error('Error parsing combinations:', e);
      }
    } else if (productData.variations) {
      try {
        variations = JSON.parse(productData.variations);
      } catch (e) {
        console.error('Error parsing variations:', e);
      }
    }

    // Remove from productData as they're not Product fields
    delete productData.combinations;
    delete productData.variations;

    await product.update(productData);
    
    // Update combinations if provided (preferred method)
    if (combinations.length > 0) {
      const { ProductVariation } = require('../models');
      
      // Delete existing variations
      await ProductVariation.destroy({
        where: { product_id: id }
      });
      
      // Create new combinations
      for (const combination of combinations) {
        const variationData = {
          product_id: product.id,
          size: combination.values.size || null,
          color: combination.values.color || null,
          price: parseFloat(combination.price) || parseFloat(productData.price || product.price),
          stock: parseInt(combination.stock) || 0,
          is_active: combination.is_active !== false,
          combination_string: combination.combination_string || null
        };
        
        // Handle custom variation types (material, etc.)
        Object.keys(combination.values).forEach(key => {
          if (key !== 'size' && key !== 'color' && combination.values[key]) {
            // Store custom variations in size field with prefix
            if (!variationData.size) {
              variationData.size = `${key}: ${combination.values[key]}`;
            } else {
              variationData.size += ` | ${key}: ${combination.values[key]}`;
            }
          }
        });
        
        await ProductVariation.create(variationData);
      }
    }
    // Update variations if provided (legacy method)
    else if (variations.length > 0) {
      const { ProductVariation } = require('../models');
      
      // Delete existing variations
      await ProductVariation.destroy({
        where: { product_id: id }
      });
      
      // Create new variations
      for (const variation of variations) {
        for (const value of variation.values) {
          const variationData = {
            product_id: product.id,
            size: null,
            color: null,
            price: parseFloat(productData.price || product.price),
            stock: Math.floor((parseInt(productData.stock) || product.stock) / variations.length) || 0,
            is_active: true
          };
          
          // Set the appropriate field based on variation type
          if (variation.type === 'size') {
            variationData.size = value;
          } else if (variation.type === 'color') {
            variationData.color = value;
          } else {
            // For material, other types, store in size field as fallback
            variationData.size = `${variation.name}: ${value}`;
          }
          
          await ProductVariation.create(variationData);
        }
      }
    }
    
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