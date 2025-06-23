const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create ReturnPolicies table
    await queryInterface.createTable('ReturnPolicies', {
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
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      is_returnable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      return_window_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 7
      },
      exchange_window_days: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 14
      },
      restocking_fee_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
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
        allowNull: true
      },
      excluded_return_reasons: {
        type: DataTypes.JSON,
        allowNull: true
      },
      conditions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      refund_methods: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: '["original_payment", "store_credit"]'
      },
      min_order_value_for_free_return: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      max_returns_per_customer: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      requires_approval: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      auto_approve_conditions: {
        type: DataTypes.JSON,
        allowNull: true
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
        defaultValue: 0
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create ReturnRequests table
    await queryInterface.createTable('ReturnRequests', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      order_item_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'OrderItems',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
        allowNull: true
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
        allowNull: true
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
        allowNull: true
      },
      processed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create QualityChecks table
    await queryInterface.createTable('QualityChecks', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      variation_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'ProductVariations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      qc_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      quantity_received: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      quantity_expected: {
        type: DataTypes.INTEGER,
        allowNull: false
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
        defaultValue: 0
      },
      damaged_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      missing_quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      inspection_checklist: {
        type: DataTypes.JSON,
        allowNull: true
      },
      damage_details: {
        type: DataTypes.JSON,
        allowNull: true
      },
      photos: {
        type: DataTypes.JSON,
        allowNull: true
      },
      inspector_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
        allowNull: true
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
        allowNull: true
      },
      refund_adjustment: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Create DamagedInventories table
    await queryInterface.createTable('DamagedInventories', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      variation_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'ProductVariations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      return_request_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'ReturnRequests',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      quality_check_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'QualityChecks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false
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
        allowNull: true
      },
      estimated_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
      },
      salvage_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      repair_cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      source: {
        type: DataTypes.ENUM('return', 'receiving', 'warehouse', 'customer_complaint', 'quality_control'),
        allowNull: false,
        defaultValue: 'return'
      },
      location: {
        type: DataTypes.STRING,
        allowNull: true
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
        allowNull: true
      },
      insurance_claim_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true
      },
      supplier_claim_id: {
        type: DataTypes.STRING,
        allowNull: true
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assessed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      assessed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Add new columns to Orders table
    await queryInterface.addColumn('Orders', 'delivered_date', {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'return_window_expires', {
      type: DataTypes.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('Orders', 'is_returnable', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });

    await queryInterface.addColumn('Orders', 'has_active_returns', {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('Orders', 'total_returned_amount', {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    });

    // Add indexes for better performance
    await queryInterface.addIndex('ReturnRequests', ['order_id']);
    await queryInterface.addIndex('ReturnRequests', ['user_id']);
    await queryInterface.addIndex('ReturnRequests', ['status']);
    await queryInterface.addIndex('ReturnRequests', ['return_number']);
    await queryInterface.addIndex('QualityChecks', ['return_request_id']);
    await queryInterface.addIndex('DamagedInventories', ['product_id']);
    await queryInterface.addIndex('ReturnPolicies', ['product_id']);
    await queryInterface.addIndex('ReturnPolicies', ['category_id']);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('ReturnRequests', ['order_id']);
    await queryInterface.removeIndex('ReturnRequests', ['user_id']);
    await queryInterface.removeIndex('ReturnRequests', ['status']);
    await queryInterface.removeIndex('ReturnRequests', ['return_number']);
    await queryInterface.removeIndex('QualityChecks', ['return_request_id']);
    await queryInterface.removeIndex('DamagedInventories', ['product_id']);
    await queryInterface.removeIndex('ReturnPolicies', ['product_id']);
    await queryInterface.removeIndex('ReturnPolicies', ['category_id']);

    // Remove columns from Orders table
    await queryInterface.removeColumn('Orders', 'delivered_date');
    await queryInterface.removeColumn('Orders', 'return_window_expires');
    await queryInterface.removeColumn('Orders', 'is_returnable');
    await queryInterface.removeColumn('Orders', 'has_active_returns');
    await queryInterface.removeColumn('Orders', 'total_returned_amount');

    // Drop tables
    await queryInterface.dropTable('DamagedInventories');
    await queryInterface.dropTable('QualityChecks');
    await queryInterface.dropTable('ReturnRequests');
    await queryInterface.dropTable('ReturnPolicies');
  }
};