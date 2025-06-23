const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ReturnPolicy = sequelize.define('ReturnPolicy', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Products',
      key: 'id'
    },
    comment: 'Specific product policy, null for category-wide policy'
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Categories',
      key: 'id'
    },
    comment: 'Category-wide policy, null for global policy'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Policy name for identification'
  },
  is_returnable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  return_window_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7,
    validate: {
      min: 0,
      max: 365
    }
  },
  exchange_window_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 14,
    validate: {
      min: 0,
      max: 365
    }
  },
  restocking_fee_percentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  who_pays_return_shipping: {
    type: DataTypes.ENUM('customer', 'seller', 'split'),
    allowNull: false,
    defaultValue: 'customer'
  },
  who_pays_replacement_shipping: {
    type: DataTypes.ENUM('customer', 'seller'),
    allowNull: false,
    defaultValue: 'seller'
  },
  allowed_return_reasons: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: ['defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping'],
    comment: 'Array of allowed reason codes'
  },
  excluded_return_reasons: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of excluded reason codes'
  },
  conditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Custom conditions like original_packaging_required, tags_attached, etc.'
  },
  refund_methods: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['original_payment', 'store_credit'],
    comment: 'Available refund methods for this policy'
  },
  min_order_value_for_free_return: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Minimum order value for free return shipping'
  },
  max_returns_per_customer: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum returns allowed per customer per month'
  },
  requires_approval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether returns need admin approval'
  },
  auto_approve_conditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Conditions for automatic approval'
  },
  quality_check_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  priority: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Higher number = higher priority when multiple policies apply'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = ReturnPolicy;