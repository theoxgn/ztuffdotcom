const sequelize = require('../config/database');

// Import models
const User = require('./User');
const Category = require('./Category');
const Product = require('./Product');
const ProductVariation = require('./ProductVariation');
const ProductImage = require('./ProductImage');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Cart = require('./Cart');
const PaymentMethod = require('./PaymentMethod');
const Voucher = require('./Voucher');
const Point = require('./Point');
const Tutorial = require('./Tutorial');
const Wishlist = require('./Wishlist');
const Setting = require('./Setting');

// Define associations

// Category - Product
Category.hasMany(Product, { foreignKey: 'category_id', as: 'products' });
Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// Product - ProductVariation
Product.hasMany(ProductVariation, { foreignKey: 'product_id', as: 'variations' });
ProductVariation.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Product - ProductImage
Product.hasMany(ProductImage, { foreignKey: 'product_id', as: 'images' });
ProductImage.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// User - Order
User.hasMany(Order, { foreignKey: 'user_id', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order - OrderItem
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Product - OrderItem
Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ProductVariation - OrderItem
ProductVariation.hasMany(OrderItem, { foreignKey: 'variation_id' });
OrderItem.belongsTo(ProductVariation, { foreignKey: 'variation_id', as: 'variation' });

// User - Cart
User.hasMany(Cart, { foreignKey: 'user_id', as: 'cartItems' });
Cart.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Product - Cart
Product.hasMany(Cart, { foreignKey: 'product_id' });
Cart.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ProductVariation - Cart
ProductVariation.hasMany(Cart, { foreignKey: 'variation_id' });
Cart.belongsTo(ProductVariation, { foreignKey: 'variation_id', as: 'variation' });

// PaymentMethod - Order
PaymentMethod.hasMany(Order, { foreignKey: 'payment_method_id' });
Order.belongsTo(PaymentMethod, { foreignKey: 'payment_method_id', as: 'paymentMethod' });

// Voucher - Order
Voucher.hasMany(Order, { foreignKey: 'voucher_id' });
Order.belongsTo(Voucher, { foreignKey: 'voucher_id', as: 'voucher' });

// User - Point
User.hasMany(Point, { foreignKey: 'user_id', as: 'points' });
Point.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order - Point
Order.hasMany(Point, { foreignKey: 'order_id' });
Point.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// User - Wishlist
User.hasMany(Wishlist, { foreignKey: 'user_id', as: 'wishlists' });
Wishlist.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Product - Wishlist
Product.hasMany(Wishlist, { foreignKey: 'product_id' });
Wishlist.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Export models
module.exports = {
  sequelize,
  User,
  Category,
  Product,
  ProductVariation,
  ProductImage,
  Order,
  OrderItem,
  Cart,
  PaymentMethod,
  Voucher,
  Point,
  Tutorial,
  Wishlist,
  Setting
}; 