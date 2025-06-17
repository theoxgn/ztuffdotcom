const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  order_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  payment_method_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'PaymentMethods',
      key: 'id'
    }
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'paid', 'failed'),
    defaultValue: 'pending'
  },
  payment_proof: {
    type: DataTypes.STRING,
    allowNull: true
  },
  order_status: {
    type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  shipping_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_address: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  shipping_city: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_province: {
    type: DataTypes.STRING,
    allowNull: false
  },
  shipping_postal_code: {
    type: DataTypes.STRING,
    allowNull: false
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  voucher_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Vouchers',
      key: 'id'
    }
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'orders',
  timestamps: true
});

module.exports = Order;