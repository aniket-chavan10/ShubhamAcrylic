const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonColumn = require('../utils/jsonColumn');

// Sales invoice – created manually by the admin or from a website order.
//
// items : [{ description, hsn, qty, unit, rate, discountPct }]
const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  invoiceDate: { type: DataTypes.DATEONLY, allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  source: {
    type: DataTypes.ENUM('website', 'manual'),
    defaultValue: 'manual',
  },
  orderId: { type: DataTypes.INTEGER, allowNull: true },
  // ── Bill to ─────────────────────────────────────────────────────────────
  customerName: { type: DataTypes.STRING(255), allowNull: false },
  customerPhone: { type: DataTypes.STRING(20) },
  customerEmail: { type: DataTypes.STRING(255) },
  customerAddress: { type: DataTypes.TEXT },
  customerGstin: { type: DataTypes.STRING(20) },
  // ── Lines & adjustments ────────────────────────────────────────────────
  items: jsonColumn('items', []),
  discountType: {
    type: DataTypes.ENUM('amount', 'percent'),
    defaultValue: 'amount',
  },
  discountValue: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  taxPercent: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  taxMode: {
    type: DataTypes.ENUM('cgst_sgst', 'igst'),
    defaultValue: 'cgst_sgst',
  },
  shipping: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  roundOff: { type: DataTypes.BOOLEAN, defaultValue: true },
  // ── Computed totals (always recalculated server-side) ──────────────────
  subtotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  discountTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  taxTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  roundOffAmount: { type: DataTypes.DECIMAL(6, 2), defaultValue: 0 },
  grandTotal: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  amountPaid: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('draft', 'unpaid', 'partial', 'paid', 'cancelled'),
    defaultValue: 'unpaid',
  },
  notes: { type: DataTypes.TEXT },
  terms: { type: DataTypes.TEXT },
}, {
  tableName: 'invoices',
  timestamps: true,
});

module.exports = Invoice;
