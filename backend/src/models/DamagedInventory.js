const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const DamagedInventory = sequelize.define('DamagedInventory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
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
  return_request_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'ReturnRequests',
      key: 'id'
    }
  },
  quality_check_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'QualityChecks',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1
    }
  },
  damage_type: {
    type: DataTypes.ENUM('physical_damage', 'cosmetic_damage', 'missing_parts', 'defective', 'expired', 'contaminated', 'customer_damage', 'shipping_damage', 'manufacturing_defect'),
    allowNull: false
  },
  damage_severity: {
    type: DataTypes.ENUM('minor', 'moderate', 'major', 'total_loss'),
    allowNull: false
  },
  damage_description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  damage_photos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of damage photo URLs'
  },
  estimated_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Original value of damaged items'
  },
  salvage_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Estimated salvage/resale value'
  },
  repair_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Estimated cost to repair'
  },
  source: {
    type: DataTypes.ENUM('return', 'receiving', 'warehouse', 'customer_complaint', 'quality_control'),
    allowNull: false,
    defaultValue: 'return'
  },
  location: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Physical location of damaged items'
  },
  status: {
    type: DataTypes.ENUM('pending_assessment', 'assessed', 'repairable', 'salvageable', 'disposed', 'returned_to_supplier'),
    allowNull: false,
    defaultValue: 'pending_assessment'
  },
  disposition: {
    type: DataTypes.ENUM('repair', 'salvage', 'donate', 'recycle', 'dispose', 'return_to_supplier'),
    allowNull: true
  },
  disposition_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  disposition_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  insurance_claim_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Insurance claim reference if applicable'
  },
  insurance_claim_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  supplier_claim_id: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Supplier claim reference if applicable'
  },
  supplier_claim_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  reported_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assessed_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  assessed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = DamagedInventory;