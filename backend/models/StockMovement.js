const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Every change to a raw material's stock, so the current quantity can always be
// explained. `change` is signed: + for purchases/returns, − for usage.
const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  materialId: { type: DataTypes.INTEGER, allowNull: false },
  type: {
    // purchase: bought from a supplier · usage: used for printing
    // adjustment: stock count correction · order: automatic, from a website order
    type: DataTypes.ENUM('purchase', 'usage', 'adjustment', 'order'),
    allowNull: false,
  },
  change: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  balanceAfter: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  unitCost: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  supplier: { type: DataTypes.STRING(160), defaultValue: '' },
  /** Supplier bill no., order no., etc. */
  reference: { type: DataTypes.STRING(80), defaultValue: '' },
  note: { type: DataTypes.TEXT },
  date: { type: DataTypes.DATEONLY, allowNull: false },
  orderId: { type: DataTypes.INTEGER, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'stock_movements',
  timestamps: true,
  updatedAt: false,
  indexes: [{ fields: ['materialId'] }, { fields: ['orderId'] }, { fields: ['date'] }],
});

module.exports = StockMovement;
