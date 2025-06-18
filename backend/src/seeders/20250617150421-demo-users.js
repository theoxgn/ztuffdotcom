'use strict';
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash password untuk demo users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Data untuk user demo
    await queryInterface.bulkInsert('Users', [
      {
        id: uuidv4(),
        name: 'Admin User',
        email: 'admin@dropship.com',
        password: hashedPassword,
        store_name: 'Admin Store',
        phone: '081234567890',
        address: 'Jl. Admin No. 1',
        city: 'Jakarta',
        province: 'DKI Jakarta',
        postal_code: '12345',
        role: 'admin',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Demo User',
        email: 'user@dropship.com',
        password: hashedPassword,
        store_name: 'Demo Store',
        phone: '089876543210',
        address: 'Jl. Demo No. 2',
        city: 'Bandung',
        province: 'Jawa Barat',
        postal_code: '40111',
        role: 'user',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Test User',
        email: 'test@dropship.com',
        password: hashedPassword,
        store_name: 'Test Store',
        phone: '087654321098',
        address: 'Jl. Test No. 3',
        city: 'Surabaya',
        province: 'Jawa Timur',
        postal_code: '60111',
        role: 'user',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', null, {});
  }
};
