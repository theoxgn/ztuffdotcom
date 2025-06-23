const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReturnRequest = sequelize.define('ReturnRequest', {
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
  order_item_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'OrderItems',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  return_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  reason_code: {
    type: DataTypes.ENUM('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping', 'missing_parts', 'size_issue', 'quality_issue'),
    allowNull: false
  },
  reason_description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  return_type: {
    type: DataTypes.ENUM('refund', 'exchange', 'store_credit'),
    allowNull: false,
    defaultValue: 'refund'
  },
  requested_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  approved_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  restocking_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  photos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of photo URLs as evidence'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'item_received', 'quality_check', 'processing', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending'
  },
  admin_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customer_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  return_deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  tracking_number: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Return shipping tracking number'
  },
  courier: {
    type: DataTypes.STRING,
    allowNull: true
  },
  refund_method: {
    type: DataTypes.ENUM('original_payment', 'store_credit', 'bank_transfer', 'manual'),
    allowNull: false,
    defaultValue: 'original_payment'
  },
  refund_status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    allowNull: false,
    defaultValue: 'pending'
  },
  refund_reference: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment gateway refund transaction ID'
  },
  processed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    },
    comment: 'Admin who processed the return'
  },
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  quality_check_status: {
    type: DataTypes.ENUM('pending', 'passed', 'failed', 'partial'),
    allowNull: true
  },
  quality_check_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  replacement_order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Orders',
      key: 'id'
    },
    comment: 'For exchange type returns'
  }
});

module.exports = ReturnRequest;