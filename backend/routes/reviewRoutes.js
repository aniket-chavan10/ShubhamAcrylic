const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/product/:productId', reviewController.getProductReviews);
router.post('/', reviewController.createReview);

// Protected routes (admin only)
router.get('/all', authMiddleware, reviewController.getAllReviews);
router.delete('/:id', authMiddleware, reviewController.deleteReview);

module.exports = router;
