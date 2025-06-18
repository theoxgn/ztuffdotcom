const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Orders',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Products',
      key: 'id'
    }
  },
  variation_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ProductVariations',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  }
});

module.exports = OrderItem; 