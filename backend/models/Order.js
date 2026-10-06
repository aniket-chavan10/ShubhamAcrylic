const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonColumn = require('../utils/jsonColumn');

// A custom-apparel order placed from the website design studio.
//
// prints   : [{ key, label, view, price, kind: 'image'|'text', text, font, color,
//               artworkUrl, transform: { cx, cy, scale, angle } }]
// previews : { front: url, back: url }   – rendered mockups of the final design
const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  orderNumber: {
    type: DataTypes.STRING(30),
    unique: true,
  },
  // ── Customer ────────────────────────────────────────────────────────────
  customerName: { type: DataTypes.STRING(255), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false },
  phone: { type: DataTypes.STRING(20), allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  city: { type: DataTypes.STRING(120) },
  pincode: { type: DataTypes.STRING(12) },
  notes: { type: DataTypes.TEXT },
  emailVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
  // ── Product ─────────────────────────────────────────────────────────────
  garmentId: { type: DataTypes.INTEGER, allowNull: true },
  garmentName: { type: DataTypes.STRING(120), allowNull: false },
  colorName: { type: DataTypes.STRING(60) },
  colorHex: { type: DataTypes.STRING(9) },
  size: { type: DataTypes.STRING(10) },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  prints: jsonColumn('prints', []),
  previews: jsonColumn('previews', {}),
  // ── Pricing (re-computed on the server, never trusted from the client) ──
  basePrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  printsPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  sizeExtra: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  total: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  // ── Workflow ────────────────────────────────────────────────────────────
  status: {
    type: DataTypes.ENUM('new', 'confirmed', 'in_production', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'new',
  },
  adminNotes: { type: DataTypes.TEXT },
  ipAddress: { type: DataTypes.STRING(64) },
}, {
  tableName: 'orders',
  timestamps: true,
});

module.exports = Order;
