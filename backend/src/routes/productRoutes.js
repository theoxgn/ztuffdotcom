const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { uploadProductImage } = require('../middlewares/upload');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// Admin routes
router.post('/', authenticate, isAdmin, uploadProductImage.single('image'), productController.createProduct);
router.put('/:id', authenticate, isAdmin, uploadProductImage.single('image'), productController.updateProduct);
router.delete('/:id', authenticate, isAdmin, productController.deleteProduct);

// Product images
router.post('/:id/images', authenticate, isAdmin, uploadProductImage.single('image'), productController.addProductImage);
router.delete('/:id/images/:imageId', authenticate, isAdmin, productController.deleteProductImage);

// Product variations
router.post('/:id/variations', authenticate, isAdmin, productController.addProductVariation);
router.put('/:id/variations/:variationId', authenticate, isAdmin, productController.updateProductVariation);
router.delete('/:id/variations/:variationId', authenticate, isAdmin, productController.deleteProductVariation);

module.exports = router; 