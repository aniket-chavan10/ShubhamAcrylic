const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');


router.get("/stats", authMiddleware ,productController.getProductStats);

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.get('/search', productController.searchProducts);
router.get('/search', productController.advancedSearchProducts);



// Protected routes with image upload handling (single image)
router.post('/', authMiddleware, upload.single('image'), productController.createProduct);

router.put('/:id', authMiddleware, upload.single('image'), productController.updateProduct);
router.delete('/:id', authMiddleware, productController.deleteProduct);



module.exports = router;
