const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Enquiry = sequelize.define('Enquiry', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mobileNo: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Product-specific enquiry fields (nullable for general enquiries)
  productId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id',
    },
  },
  productCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  productName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  enquiryType: {
    type: DataTypes.ENUM('general', 'product'),
    defaultValue: 'general',
  },
  status: {
    type: DataTypes.ENUM('pending', 'resolved'),
    defaultValue: 'pending',
  },
}, {
  tableName: 'enquiries',
  timestamps: true,
});

module.exports = Enquiry;
