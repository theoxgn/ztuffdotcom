'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Categories', [
      {
        id: uuidv4(),
        name: 'Pakaian Pria',
        description: 'Berbagai macam pakaian untuk pria',
        image: 'categories/men-clothing.jpg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Pakaian Wanita',
        description: 'Berbagai macam pakaian untuk wanita',
        image: 'categories/women-clothing.jpg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Aksesoris',
        description: 'Berbagai macam aksesoris fashion',
        image: 'categories/accessories.jpg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Sepatu',
        description: 'Berbagai macam sepatu pria dan wanita',
        image: 'categories/shoes.jpg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Tas',
        description: 'Berbagai macam tas pria dan wanita',
        image: 'categories/bags.jpg',
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Categories', null, {});
  }
};
