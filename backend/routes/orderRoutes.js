const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public – requires a valid email-OTP token (checked before any file is accepted)
router.post('/', orderController.requireVerifiedEmail, upload.orderArtwork.any(), orderController.createOrder);

// Admin
router.get('/', authMiddleware, orderController.getOrders);
router.get('/stats', authMiddleware, orderController.getOrderStats);
router.get('/:id', authMiddleware, orderController.getOrderById);
router.patch('/:id', authMiddleware, orderController.updateOrder);
router.delete('/:id', authMiddleware, orderController.deleteOrder);

module.exports = router;
