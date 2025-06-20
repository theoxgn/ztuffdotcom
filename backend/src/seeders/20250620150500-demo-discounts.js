'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get some sample category and product IDs for targeted discounts
    const categories = await queryInterface.sequelize.query(
      'SELECT id FROM "Categories" LIMIT 2',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const products = await queryInterface.sequelize.query(
      'SELECT id FROM "Products" LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + 30); // 30 days from now

    const discounts = [
      {
        id: uuidv4(),
        name: 'Flash Sale 50%',
        description: 'Diskon besar-besaran untuk semua produk! Berlaku terbatas.',
        type: 'percentage',
        value: 50.00,
        min_purchase: 100000.00,
        max_discount: 500000.00,
        start_date: now,
        end_date: futureDate,
        target_type: 'all',
        target_ids: null,
        is_active: true,
        priority: 10,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Diskon Kategori Electronics',
        description: 'Diskon khusus untuk kategori elektronik',
        type: 'percentage',
        value: 25.00,
        min_purchase: 50000.00,
        max_discount: 200000.00,
        start_date: now,
        end_date: futureDate,
        target_type: 'category',
        target_ids: categories.length > 0 ? JSON.stringify([categories[0].id]) : null,
        is_active: true,
        priority: 5,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Produk Pilihan Rp 50.000',
        description: 'Potongan harga tetap untuk produk pilihan',
        type: 'fixed',
        value: 50000.00,
        min_purchase: 200000.00,
        max_discount: null,
        start_date: now,
        end_date: futureDate,
        target_type: 'product',
        target_ids: products.length > 0 ? JSON.stringify(products.slice(0, 2).map(p => p.id)) : null,
        is_active: true,
        priority: 7,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Weekend Sale 30%',
        description: 'Diskon akhir pekan untuk semua produk',
        type: 'percentage',
        value: 30.00,
        min_purchase: 75000.00,
        max_discount: 300000.00,
        start_date: now,
        end_date: futureDate,
        target_type: 'all',
        target_ids: null,
        is_active: true,
        priority: 3,
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        name: 'Member Exclusive 15%',
        description: 'Diskon eksklusif untuk member setia',
        type: 'percentage',
        value: 15.00,
        min_purchase: 0.00,
        max_discount: 100000.00,
        start_date: now,
        end_date: futureDate,
        target_type: 'category',
        target_ids: categories.length > 1 ? JSON.stringify([categories[1].id]) : null,
        is_active: true,
        priority: 1,
        createdAt: now,
        updatedAt: now
      }
    ];

    await queryInterface.bulkInsert('Discounts', discounts, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Discounts', null, {});
  }
};