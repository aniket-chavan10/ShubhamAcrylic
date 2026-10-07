const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Raw material the shop buys and keeps in stock: plain hoodies / tees / polos
// (one row per colour + size), inks, packaging, etc.
//
// A material can optionally be linked to a design-studio garment + colour +
// size. Linked materials are deducted automatically when a website order for
// that combination goes into production (see utils/inventory.js).
const RawMaterial = sequelize.define('RawMaterial', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: { type: DataTypes.STRING(120), allowNull: false },
  category: { type: DataTypes.STRING(40), defaultValue: 'garment' },
  color: { type: DataTypes.STRING(60), defaultValue: '' },
  colorHex: { type: DataTypes.STRING(9), defaultValue: '' },
  size: { type: DataTypes.STRING(20), defaultValue: '' },
  sku: { type: DataTypes.STRING(60), defaultValue: '' },
  unit: { type: DataTypes.STRING(20), defaultValue: 'pcs' },
  quantity: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  /** Alert when stock is at or below this */
  reorderLevel: { type: DataTypes.DECIMAL(12, 2), defaultValue: 10 },
  /** Usual quantity to buy when restocking (optional) */
  reorderQty: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
  /** Average purchase cost per unit */
  costPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  supplier: { type: DataTypes.STRING(160), defaultValue: '' },
  notes: { type: DataTypes.TEXT },
  garmentId: { type: DataTypes.INTEGER, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'raw_materials',
  timestamps: true,
  indexes: [{ fields: ['garmentId'] }, { fields: ['category'] }],
});

module.exports = RawMaterial;
