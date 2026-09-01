const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.get('/stats', authMiddleware, productController.getProductStats);

// Public routes
router.get('/', productController.getProducts);
router.get('/search', productController.searchProducts);
router.get('/advanced-search', productController.advancedSearchProducts);
router.get('/:id', productController.getProductById);

// Protected routes – support up to 5 images
router.post('/', authMiddleware, upload.array('images', 5), productController.createProduct);
router.put('/:id', authMiddleware, upload.array('images', 5), productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);

module.exports = router;
