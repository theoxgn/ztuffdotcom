'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('ReturnPolicies', [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        product_id: null,
        category_id: null,
        name: 'Default Return Policy',
        is_returnable: true,
        return_window_days: 7,
        exchange_window_days: 14,
        restocking_fee_percentage: 0,
        who_pays_return_shipping: 'customer',
        who_pays_replacement_shipping: 'seller',
        allowed_return_reasons: JSON.stringify([
          'defective', 'wrong_item', 'not_as_described', 'changed_mind', 
          'damaged_shipping', 'missing_parts', 'size_issue', 'quality_issue'
        ]),
        excluded_return_reasons: null,
        conditions: JSON.stringify({
          original_packaging_required: true,
          tags_attached: false,
          unused_condition: true
        }),
        refund_methods: JSON.stringify(['original_payment', 'store_credit']),
        min_order_value_for_free_return: null,
        max_returns_per_customer: 3,
        requires_approval: true,
        auto_approve_conditions: JSON.stringify({
          defective: true,
          wrong_item: true,
          damaged_shipping: true
        }),
        quality_check_required: true,
        is_active: true,
        priority: 0,
        notes: 'Kebijakan pengembalian default untuk semua produk',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        product_id: null,
        category_id: null,
        name: 'Electronics Return Policy',
        is_returnable: true,
        return_window_days: 14,
        exchange_window_days: 21,
        restocking_fee_percentage: 10,
        who_pays_return_shipping: 'customer',
        who_pays_replacement_shipping: 'seller',
        allowed_return_reasons: JSON.stringify([
          'defective', 'wrong_item', 'not_as_described', 'damaged_shipping'
        ]),
        excluded_return_reasons: JSON.stringify(['changed_mind']),
        conditions: JSON.stringify({
          original_packaging_required: true,
          tags_attached: true,
          unused_condition: true,
          warranty_seal_intact: true
        }),
        refund_methods: JSON.stringify(['original_payment', 'store_credit']),
        min_order_value_for_free_return: 500000,
        max_returns_per_customer: 2,
        requires_approval: true,
        auto_approve_conditions: JSON.stringify({
          defective: true,
          damaged_shipping: true
        }),
        quality_check_required: true,
        is_active: true,
        priority: 10,
        notes: 'Kebijakan khusus untuk produk elektronik dengan persyaratan lebih ketat',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        product_id: null,
        category_id: null,
        name: 'Fashion & Apparel Policy',
        is_returnable: true,
        return_window_days: 30,
        exchange_window_days: 30,
        restocking_fee_percentage: 0,
        who_pays_return_shipping: 'customer',
        who_pays_replacement_shipping: 'seller',
        allowed_return_reasons: JSON.stringify([
          'defective', 'wrong_item', 'not_as_described', 'changed_mind', 
          'size_issue', 'quality_issue'
        ]),
        excluded_return_reasons: null,
        conditions: JSON.stringify({
          original_packaging_required: false,
          tags_attached: true,
          unused_condition: true,
          hygiene_seal_intact: true
        }),
        refund_methods: JSON.stringify(['original_payment', 'store_credit', 'bank_transfer']),
        min_order_value_for_free_return: 250000,
        max_returns_per_customer: 5,
        requires_approval: false,
        auto_approve_conditions: JSON.stringify({
          size_issue: true,
          changed_mind: true,
          defective: true
        }),
        quality_check_required: false,
        is_active: true,
        priority: 5,
        notes: 'Kebijakan untuk fashion dan apparel dengan window lebih panjang',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('ReturnPolicies', null, {});
  }
};