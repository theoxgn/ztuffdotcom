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
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  total_weight: {
    type: DataTypes.FLOAT,
    allowNull: true,
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
  payment_proof: {
    type: DataTypes.STRING,
    allowNull: true
  },
  payment_date: {
    type: DataTypes.DATE,
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
  status: {
    type: DataTypes.ENUM('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = Order;