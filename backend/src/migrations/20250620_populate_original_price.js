'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For existing records where original_price is 0, set it to price + discount_amount
    // This assumes that 'price' is the discounted price and discount_amount is the discount applied
    await queryInterface.sequelize.query(`
      UPDATE "OrderItems" 
      SET original_price = price + discount_amount 
      WHERE original_price = 0 OR original_price IS NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Reset original_price to 0 for rollback
    await queryInterface.sequelize.query(`
      UPDATE "OrderItems" 
      SET original_price = 0
    `);
  }
};