'use strict';
const { v4: uuidv4 } = require('uuid');
const { Product } = require('../models');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Mendapatkan ID produk yang ada
    const products = await Product.findAll();
    const productIds = {};
    products.forEach(product => {
      productIds[product.name] = product.id;
    });

    // Data variasi produk
    const variations = [];
    
    // Variasi untuk Kemeja Pria
    if (productIds['Kemeja Pria Lengan Panjang']) {
      variations.push(
        {
          id: uuidv4(),
          product_id: productIds['Kemeja Pria Lengan Panjang'],
          size: 'S',
          color: 'Putih',
          price: 150000.00,
          stock: 15,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          product_id: productIds['Kemeja Pria Lengan Panjang'],
          size: 'M',
          color: 'Putih',
          price: 150000.00,
          stock: 20,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          product_id: productIds['Kemeja Pria Lengan Panjang'],
          size: 'L',
          color: 'Putih',
          price: 150000.00,
          stock: 15,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          product_id: productIds['Kemeja Pria Lengan Panjang'],
          size: 'S',
          color: 'Biru',
          price: 155000.00,
          stock: 10,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          product_id: productIds['Kemeja Pria Lengan Panjang'],
          size: 'M',
          color: 'Biru',
          price: 155000.00,
          stock: 15,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    // Variasi untuk Celana Jeans Pria
    if (productIds['Celana Jeans Pria']) {
      variations.push(
        {
          id: uuidv4(),
          product_id: productIds['Celana Jeans Pria'],
          size: '30',
          color: 'Biru Tua',
          price: 250000.00,
          stock: 10,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          product_id: productIds['Celana Jeans Pria'],
          size: '32',
          color: 'Biru Tua',
          price: 250000.00,
          stock: 12,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          product_id: productIds['Celana Jeans Pria'],
          size: '34',
          color: 'Biru Tua',
          price: 250000.00,
          stock: 8,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    // Variasi untuk Dress Wanita
    if (productIds['Dress Wanita']) {
      variations.push(
        {
          id: uuidv4(),
          product_id: productIds['Dress Wanita'],
          size: 'S',
          color: 'Merah',
          price: 180000.00,
          stock: 8,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          product_id: productIds['Dress Wanita'],
          size: 'M',
          color: 'Merah',
          price: 180000.00,
          stock: 10,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: uuidv4(),
          product_id: productIds['Dress Wanita'],
          size: 'S',
          color: 'Hitam',
          price: 180000.00,
          stock: 7,
          is_active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      );
    }

    // Jika ada variasi, tambahkan ke database
    if (variations.length > 0) {
      await queryInterface.bulkInsert('ProductVariations', variations);
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProductVariations', null, {});
  }
};
