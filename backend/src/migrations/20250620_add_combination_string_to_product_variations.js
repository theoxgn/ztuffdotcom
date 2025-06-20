'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('ProductVariations', 'combination_string', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Human readable combination string (e.g., "Merah + S")'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('ProductVariations', 'combination_string');
  }
};