const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route
router.get('/public', bannerController.getBanners);

// Admin routes
router.get('/', authMiddleware, bannerController.getAllBanners);
router.post('/', authMiddleware, upload.single('image'), bannerController.createBanner);
router.put('/:id', authMiddleware, upload.single('image'), bannerController.updateBanner);
router.delete('/:id', authMiddleware, bannerController.deleteBanner);

module.exports = router;
