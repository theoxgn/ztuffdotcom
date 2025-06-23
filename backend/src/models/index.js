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
const Review = require('./Review');
const Discount = require('./Discount');
const ReturnRequest = require('./ReturnRequest');
const ReturnPolicy = require('./ReturnPolicy');
const QualityCheck = require('./QualityCheck');
const DamagedInventory = require('./DamagedInventory');

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

// User - Review
User.hasMany(Review, { foreignKey: 'user_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Product - Review
Product.hasMany(Review, { foreignKey: 'product_id', as: 'reviews' });
Review.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Order - Review
Order.hasMany(Review, { foreignKey: 'order_id' });
Review.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Return Management Associations

// User - ReturnRequest
User.hasMany(ReturnRequest, { foreignKey: 'user_id', as: 'returnRequests' });
ReturnRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Order - ReturnRequest
Order.hasMany(ReturnRequest, { foreignKey: 'order_id', as: 'returnRequests' });
ReturnRequest.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// OrderItem - ReturnRequest
OrderItem.hasMany(ReturnRequest, { foreignKey: 'order_item_id', as: 'returnRequests' });
ReturnRequest.belongsTo(OrderItem, { foreignKey: 'order_item_id', as: 'orderItem' });

// User - ReturnRequest (processed by)
User.hasMany(ReturnRequest, { foreignKey: 'processed_by', as: 'processedReturns' });
ReturnRequest.belongsTo(User, { foreignKey: 'processed_by', as: 'processor' });

// Order - ReturnRequest (replacement order)
Order.hasMany(ReturnRequest, { foreignKey: 'replacement_order_id', as: 'replacementReturns' });
ReturnRequest.belongsTo(Order, { foreignKey: 'replacement_order_id', as: 'replacementOrder' });

// Product - ReturnPolicy
Product.hasOne(ReturnPolicy, { foreignKey: 'product_id', as: 'returnPolicy' });
ReturnPolicy.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// Category - ReturnPolicy
Category.hasMany(ReturnPolicy, { foreignKey: 'category_id', as: 'returnPolicies' });
ReturnPolicy.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

// ReturnRequest - QualityCheck
ReturnRequest.hasOne(QualityCheck, { foreignKey: 'return_request_id', as: 'qualityCheck' });
QualityCheck.belongsTo(ReturnRequest, { foreignKey: 'return_request_id', as: 'returnRequest' });

// Product - QualityCheck
Product.hasMany(QualityCheck, { foreignKey: 'product_id', as: 'qualityChecks' });
QualityCheck.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ProductVariation - QualityCheck
ProductVariation.hasMany(QualityCheck, { foreignKey: 'variation_id', as: 'qualityChecks' });
QualityCheck.belongsTo(ProductVariation, { foreignKey: 'variation_id', as: 'variation' });

// User - QualityCheck (inspector)
User.hasMany(QualityCheck, { foreignKey: 'inspector_id', as: 'inspectedQualityChecks' });
QualityCheck.belongsTo(User, { foreignKey: 'inspector_id', as: 'inspector' });

// Product - DamagedInventory
Product.hasMany(DamagedInventory, { foreignKey: 'product_id', as: 'damagedInventory' });
DamagedInventory.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });

// ProductVariation - DamagedInventory
ProductVariation.hasMany(DamagedInventory, { foreignKey: 'variation_id', as: 'damagedInventory' });
DamagedInventory.belongsTo(ProductVariation, { foreignKey: 'variation_id', as: 'variation' });

// ReturnRequest - DamagedInventory
ReturnRequest.hasMany(DamagedInventory, { foreignKey: 'return_request_id', as: 'damagedItems' });
DamagedInventory.belongsTo(ReturnRequest, { foreignKey: 'return_request_id', as: 'returnRequest' });

// QualityCheck - DamagedInventory
QualityCheck.hasMany(DamagedInventory, { foreignKey: 'quality_check_id', as: 'damagedItems' });
DamagedInventory.belongsTo(QualityCheck, { foreignKey: 'quality_check_id', as: 'qualityCheck' });

// User - DamagedInventory (reported by & assessed by)
User.hasMany(DamagedInventory, { foreignKey: 'reported_by', as: 'reportedDamagedItems' });
DamagedInventory.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });

User.hasMany(DamagedInventory, { foreignKey: 'assessed_by', as: 'assessedDamagedItems' });
DamagedInventory.belongsTo(User, { foreignKey: 'assessed_by', as: 'assessor' });

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
  Setting,
  Review,
  Discount,
  ReturnRequest,
  ReturnPolicy,
  QualityCheck,
  DamagedInventory
}; 