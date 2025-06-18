'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('PaymentMethods', [
      {
        id: uuidv4(),
        name: 'Transfer Bank BCA',
        description: 'Pembayaran melalui transfer bank BCA',
        account_number: '1234567890',
        account_name: 'PT Dropship Indonesia',
        bank_name: 'BCA',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Transfer Bank Mandiri',
        description: 'Pembayaran melalui transfer bank Mandiri',
        account_number: '0987654321',
        account_name: 'PT Dropship Indonesia',
        bank_name: 'Mandiri',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Transfer Bank BNI',
        description: 'Pembayaran melalui transfer bank BNI',
        account_number: '1122334455',
        account_name: 'PT Dropship Indonesia',
        bank_name: 'BNI',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'QRIS',
        description: 'Pembayaran melalui QRIS',
        account_number: null,
        account_name: 'PT Dropship Indonesia',
        bank_name: null,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Cash on Delivery (COD)',
        description: 'Pembayaran tunai saat barang diterima',
        account_number: null,
        account_name: null,
        bank_name: null,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PaymentMethods', null, {});
  }
};
