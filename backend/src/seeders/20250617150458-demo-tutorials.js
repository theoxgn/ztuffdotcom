'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Tutorials', [
      {
        id: uuidv4(),
        title: 'Cara Memulai Bisnis Dropship',
        content: `<h2>Panduan Lengkap Memulai Bisnis Dropship</h2>
        <p>Dropshipping adalah model bisnis di mana Anda tidak perlu menyimpan stok barang. Berikut adalah langkah-langkah untuk memulai:</p>
        <ol>
          <li>Tentukan niche produk yang akan dijual</li>
          <li>Cari supplier yang terpercaya</li>
          <li>Buat toko online atau gunakan marketplace</li>
          <li>Promosikan produk Anda</li>
          <li>Kelola pesanan dengan baik</li>
        </ol>
        <p>Dengan mengikuti langkah-langkah di atas, Anda dapat memulai bisnis dropship dengan modal yang minim.</p>`,
        image: 'tutorials/start-dropship.jpg',
        video_url: 'https://www.youtube.com/watch?v=example1',
        sort_order: 1,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Tips Memilih Supplier Terpercaya',
        content: `<h2>Cara Memilih Supplier Dropship yang Terpercaya</h2>
        <p>Memilih supplier yang tepat sangat penting untuk kesuksesan bisnis dropship Anda. Berikut adalah tips untuk memilih supplier:</p>
        <ul>
          <li>Cek reputasi supplier</li>
          <li>Pastikan kualitas produk baik</li>
          <li>Perhatikan kecepatan pengiriman</li>
          <li>Bandingkan harga dengan supplier lain</li>
          <li>Tanyakan kebijakan retur dan garansi</li>
        </ul>
        <p>Dengan memilih supplier yang tepat, Anda dapat meminimalkan risiko dan meningkatkan kepuasan pelanggan.</p>`,
        image: 'tutorials/choose-supplier.jpg',
        video_url: 'https://www.youtube.com/watch?v=example2',
        sort_order: 2,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Strategi Marketing untuk Bisnis Dropship',
        content: `<h2>Strategi Marketing Efektif untuk Bisnis Dropship</h2>
        <p>Marketing yang efektif sangat penting untuk menarik pelanggan. Berikut adalah beberapa strategi yang bisa Anda terapkan:</p>
        <ul>
          <li>Manfaatkan media sosial</li>
          <li>Buat konten yang menarik</li>
          <li>Gunakan iklan berbayar</li>
          <li>Optimalkan SEO toko online Anda</li>
          <li>Berikan promo dan diskon</li>
        </ul>
        <p>Dengan menerapkan strategi marketing yang tepat, Anda dapat meningkatkan penjualan dan mengembangkan bisnis dropship Anda.</p>`,
        image: 'tutorials/marketing-strategy.jpg',
        video_url: 'https://www.youtube.com/watch?v=example3',
        sort_order: 3,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Cara Mengelola Pesanan Dropship',
        content: `<h2>Panduan Mengelola Pesanan dalam Bisnis Dropship</h2>
        <p>Mengelola pesanan dengan baik sangat penting untuk kepuasan pelanggan. Berikut adalah langkah-langkah untuk mengelola pesanan:</p>
        <ol>
          <li>Verifikasi pesanan dan pembayaran</li>
          <li>Teruskan pesanan ke supplier</li>
          <li>Pantau status pengiriman</li>
          <li>Informasikan status pesanan ke pelanggan</li>
          <li>Tindak lanjuti setelah pesanan diterima</li>
        </ol>
        <p>Dengan mengelola pesanan dengan baik, Anda dapat membangun kepercayaan pelanggan dan meningkatkan kemungkinan pembelian ulang.</p>`,
        image: 'tutorials/order-management.jpg',
        video_url: 'https://www.youtube.com/watch?v=example4',
        sort_order: 4,
        is_active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Tutorials', null, {});
  }
};
