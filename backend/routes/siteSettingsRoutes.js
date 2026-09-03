const express = require('express');
const router = express.Router();
const siteSettingsController = require('../controllers/siteSettingsController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public – frontend reads settings (company name, whatsapp, etc.)
router.get('/', siteSettingsController.getSettings);

// Admin – update settings (with optional logo, aboutImage1, aboutImage2 uploads)
router.put(
  '/',
  authMiddleware,
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'aboutImage1', maxCount: 1 },
    { name: 'aboutImage2', maxCount: 1 },
  ]),
  siteSettingsController.updateSettings
);

module.exports = router;
