const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Protected routes (admin only)
router.get('/admin/all', authMiddleware, categoryController.getAllCategoriesAdmin);
router.post('/', authMiddleware, categoryController.createCategory);
router.put('/:id', authMiddleware, categoryController.updateCategory);
router.patch('/:id/toggle', authMiddleware, categoryController.toggleCategoryStatus);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
