'use strict';
const { v4: uuidv4 } = require('uuid');
const { Category } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Mendapatkan ID kategori yang ada
    const categories = await Category.findAll();
    const categoryIds = {};
    categories.forEach(category => {
      categoryIds[category.name] = category.id;
    });

    // Jika tidak ada kategori, buat ID dummy
    const menClothingId = categoryIds['Pakaian Pria'] || uuidv4();
    const womenClothingId = categoryIds['Pakaian Wanita'] || uuidv4();
    const accessoriesId = categoryIds['Aksesoris'] || uuidv4();
    const shoesId = categoryIds['Sepatu'] || uuidv4();
    const bagsId = categoryIds['Tas'] || uuidv4();

    await queryInterface.bulkInsert('Products', [
      {
        id: uuidv4(),
        name: 'Kemeja Pria Lengan Panjang',
        description: 'Kemeja pria lengan panjang dengan bahan katun berkualitas',
        price: 150000.00,
        stock: 50,
        weight: 0.3,
        image: 'products/men-shirt-1.jpg',
        is_featured: true,
        is_active: true,
        category_id: menClothingId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Celana Jeans Pria',
        description: 'Celana jeans pria dengan model slim fit',
        price: 250000.00,
        stock: 30,
        weight: 0.5,
        image: 'products/men-jeans-1.jpg',
        is_featured: false,
        is_active: true,
        category_id: menClothingId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Dress Wanita',
        description: 'Dress wanita dengan model casual',
        price: 180000.00,
        stock: 25,
        weight: 0.3,
        image: 'products/women-dress-1.jpg',
        is_featured: true,
        is_active: true,
        category_id: womenClothingId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Blouse Wanita',
        description: 'Blouse wanita dengan bahan chiffon',
        price: 120000.00,
        stock: 40,
        weight: 0.2,
        image: 'products/women-blouse-1.jpg',
        is_featured: false,
        is_active: true,
        category_id: womenClothingId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Kalung Wanita',
        description: 'Kalung wanita dengan model minimalis',
        price: 80000.00,
        stock: 15,
        weight: 0.1,
        image: 'products/necklace-1.jpg',
        is_featured: true,
        is_active: true,
        category_id: accessoriesId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Sepatu Sneakers Pria',
        description: 'Sepatu sneakers pria dengan model casual',
        price: 350000.00,
        stock: 20,
        weight: 0.8,
        image: 'products/men-shoes-1.jpg',
        is_featured: true,
        is_active: true,
        category_id: shoesId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Tas Wanita',
        description: 'Tas wanita dengan model tote bag',
        price: 200000.00,
        stock: 15,
        weight: 0.6,
        image: 'products/women-bag-1.jpg',
        is_featured: true,
        is_active: true,
        category_id: bagsId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Products', null, {});
  }
};
