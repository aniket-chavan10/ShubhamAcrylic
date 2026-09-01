const express = require('express');
const router = express.Router();
const enquiryController = require('../controllers/enquiryController');
const authMiddleware = require('../middleware/authMiddleware');

// Admin routes
router.get('/', authMiddleware, enquiryController.getEnquiries);
router.get('/pending-count', authMiddleware, enquiryController.getPendingCount);
router.delete('/:id', authMiddleware, enquiryController.deleteEnquiry);
router.patch('/:id/resolve', authMiddleware, enquiryController.markEnquiryResolved);

// Public routes
router.post('/', enquiryController.createEnquiry);
router.post('/product', enquiryController.createProductEnquiry);

module.exports = router;
