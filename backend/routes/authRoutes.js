const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require('../middleware/authMiddleware');

router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected
router.get('/me', authMiddleware, authController.getMe);
router.put('/update-password', authMiddleware, authController.updatePassword);
router.post('/create-admin', authMiddleware, authController.createAdmin);
router.get('/admins', authMiddleware, authController.listAdmins);
router.delete('/admins/:id', authMiddleware, authController.deleteAdmin);

module.exports = router;
