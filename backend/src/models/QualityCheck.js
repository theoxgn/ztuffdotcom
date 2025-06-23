const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QualityCheck = sequelize.define('QualityCheck', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  return_request_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'ReturnRequests',
      key: 'id'
    }
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
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
  qc_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  quantity_received: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  quantity_expected: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  condition_status: {
    type: DataTypes.ENUM('pending_inspection', 'inspecting', 'completed'),
    allowNull: false,
    defaultValue: 'pending_inspection'
  },
  overall_condition: {
    type: DataTypes.ENUM('excellent', 'good', 'fair', 'poor', 'damaged', 'unsellable'),
    allowNull: true
  },
  sellable_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  damaged_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  missing_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  inspection_checklist: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Detailed inspection checklist results'
  },
  damage_details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Details of any damage found'
  },
  photos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Photos taken during quality check'
  },
  inspector_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  inspector_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  inspection_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  estimated_repair_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Cost to repair damaged items'
  },
  disposition: {
    type: DataTypes.ENUM('restock', 'repair', 'salvage', 'dispose', 'return_to_supplier'),
    allowNull: true
  },
  disposition_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  restocked_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  requires_cleaning: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  requires_repackaging: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  customer_fault: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'Whether damage is due to customer misuse'
  },
  refund_adjustment: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Adjustment to refund amount based on condition'
  }
});

module.exports = QualityCheck;