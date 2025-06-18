'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    await queryInterface.bulkInsert('Vouchers', [
      {
        id: uuidv4(),
        code: 'WELCOME10',
        description: 'Diskon 10% untuk pengguna baru',
        discount_type: 'percentage',
        discount_value: 10.00,
        min_purchase: 100000.00,
        max_discount: 50000.00,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 100,
        used_count: 0,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: 'DISKON25RB',
        description: 'Potongan Rp 25.000 untuk pembelian minimal Rp 200.000',
        discount_type: 'fixed',
        discount_value: 25000.00,
        min_purchase: 200000.00,
        max_discount: null,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 50,
        used_count: 0,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: 'SALE20',
        description: 'Diskon 20% untuk semua produk',
        discount_type: 'percentage',
        discount_value: 20.00,
        min_purchase: 150000.00,
        max_discount: 100000.00,
        start_date: lastMonth,
        end_date: now,
        usage_limit: 200,
        used_count: 150,
        is_active: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        code: 'GRATIS50RB',
        description: 'Potongan Rp 50.000 untuk pembelian minimal Rp 500.000',
        discount_type: 'fixed',
        discount_value: 50000.00,
        min_purchase: 500000.00,
        max_discount: null,
        start_date: now,
        end_date: nextMonth,
        usage_limit: 30,
        used_count: 0,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Vouchers', null, {});
  }
};
