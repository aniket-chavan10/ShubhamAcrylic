const express = require('express');
const router = express.Router();
const garmentController = require('../controllers/garmentController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const mockups = upload.fields([
  { name: 'mockupFront', maxCount: 1 },
  { name: 'mockupBack', maxCount: 1 },
]);

// Public – the design studio reads active garments, colours, sizes and print prices
router.get('/', garmentController.getActiveGarments);

// Admin
router.get('/admin/all', authMiddleware, garmentController.getAllGarments);
router.post('/', authMiddleware, mockups, garmentController.createGarment);
router.put('/:id', authMiddleware, mockups, garmentController.updateGarment);
router.delete('/:id', authMiddleware, garmentController.deleteGarment);

module.exports = router;
