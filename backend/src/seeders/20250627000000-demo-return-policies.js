'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ReturnPolicies', [
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        name: 'Default Return Policy',
        notes: 'Kebijakan pengembalian default untuk semua produk',
        is_returnable: true,
        return_window_days: 14,
        exchange_window_days: 14,
        quality_check_required: true,
        restocking_fee_percentage: 0,
        who_pays_return_shipping: 'customer',
        who_pays_replacement_shipping: 'seller',
        allowed_return_reasons: JSON.stringify([
          'defective', 'wrong_item', 'not_as_described', 'damaged_shipping'
        ]),
        excluded_return_reasons: JSON.stringify(['changed_mind']),
        refund_methods: JSON.stringify(['original_payment', 'store_credit']),
        requires_approval: true,
        auto_approve_conditions: JSON.stringify({
          max_amount: 100000,
          trusted_customer: false
        }),
        is_active: true,
        priority: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
        name: 'Electronics Return Policy',
        notes: 'Kebijakan khusus untuk produk elektronik',
        category_id: null,
        is_returnable: true,
        return_window_days: 7,
        exchange_window_days: 7,
        quality_check_required: true,
        restocking_fee_percentage: 10,
        who_pays_return_shipping: 'customer',
        who_pays_replacement_shipping: 'seller',
        allowed_return_reasons: JSON.stringify([
          'defective', 'wrong_item', 'not_as_described', 'damaged_shipping'
        ]),
        excluded_return_reasons: JSON.stringify(['changed_mind']),
        refund_methods: JSON.stringify(['original_payment']),
        requires_approval: true,
        auto_approve_conditions: JSON.stringify({
          max_amount: 50000,
          trusted_customer: false
        }),
        is_active: true,
        priority: 200,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d481',
        name: 'Fashion Return Policy',
        notes: 'Kebijakan khusus untuk produk fashion',
        category_id: null,
        is_returnable: true,
        return_window_days: 30,
        exchange_window_days: 30,
        quality_check_required: true,
        restocking_fee_percentage: 0,
        who_pays_return_shipping: 'seller',
        who_pays_replacement_shipping: 'seller',
        allowed_return_reasons: JSON.stringify([
          'defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_shipping'
        ]),
        excluded_return_reasons: JSON.stringify([]),
        refund_methods: JSON.stringify(['original_payment', 'store_credit']),
        requires_approval: false,
        auto_approve_conditions: JSON.stringify({
          max_amount: 200000,
          trusted_customer: true
        }),
        is_active: true,
        priority: 150,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ReturnPolicies', null, {});
  }
};