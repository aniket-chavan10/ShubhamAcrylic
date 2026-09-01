const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ── POST /auth/register ───────────────────────────────────────────────────────
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /auth/login ──────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, username: user.username, isMaster: user.isMaster });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /auth/me ──────────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'email', 'isMaster', 'createdAt'],
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /auth/update-password ─────────────────────────────────────────────────
exports.updatePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedNewPassword });
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /auth/create-admin ───────────────────────────────────────────────────
exports.createAdmin = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ message: 'Email already in use' });

    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) return res.status(400).json({ message: 'Username already taken' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      username,
      email,
      password: hashedPassword,
      isMaster: false,
    });

    res.status(201).json({
      id: newAdmin.id,
      username: newAdmin.username,
      email: newAdmin.email,
      isMaster: newAdmin.isMaster,
      createdAt: newAdmin.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /auth/admins ──────────────────────────────────────────────────────────
exports.listAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({
      attributes: ['id', 'username', 'email', 'isMaster', 'createdAt'],
      order: [['createdAt', 'ASC']],
    });
    res.json(admins);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /auth/admins/:id ───────────────────────────────────────────────────
exports.deleteAdmin = async (req, res) => {
  try {
    const target = await User.findByPk(req.params.id);
    if (!target) return res.status(404).json({ message: 'Admin not found' });
    if (target.isMaster) return res.status(403).json({ message: 'Cannot delete master admin' });
    if (target.id === req.user.id) return res.status(403).json({ message: 'Cannot delete yourself' });

    await target.destroy();
    res.json({ message: 'Admin deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
