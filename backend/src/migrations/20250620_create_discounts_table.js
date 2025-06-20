'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Discounts table
    await queryInterface.createTable('Discounts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('percentage', 'fixed'),
        allowNull: false
      },
      value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      min_purchase: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      max_discount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: true
      },
      target_type: {
        type: Sequelize.ENUM('all', 'category', 'product'),
        allowNull: false,
        defaultValue: 'all'
      },
      target_ids: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'JSON array of category or product IDs'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Higher number = higher priority'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('Discounts', ['is_active']);
    await queryInterface.addIndex('Discounts', ['start_date']);
    await queryInterface.addIndex('Discounts', ['end_date']);
    await queryInterface.addIndex('Discounts', ['target_type']);
    await queryInterface.addIndex('Discounts', ['priority']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop Discounts table
    await queryInterface.dropTable('Discounts');
  }
};