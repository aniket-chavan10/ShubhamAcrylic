const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// One-time codes e-mailed to customers before they can place an order.
const EmailOtp = sequelize.define('EmailOtp', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  email: { type: DataTypes.STRING(255), allowNull: false },
  codeHash: { type: DataTypes.STRING(128), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  attempts: { type: DataTypes.INTEGER, defaultValue: 0 },
  consumed: { type: DataTypes.BOOLEAN, defaultValue: false },
  ipAddress: { type: DataTypes.STRING(64) },
}, {
  tableName: 'email_otps',
  timestamps: true,
  updatedAt: false,
  indexes: [{ fields: ['email'] }],
});

module.exports = EmailOtp;
