const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public – frontend reads settings (company name, whatsapp, etc.)
router.get('/', siteSettingsController.getSettings);

// Admin – update settings (with optional logo upload)
router.put('/', authMiddleware, upload.single('logo'), siteSettingsController.updateSettings);

module.exports = router;
