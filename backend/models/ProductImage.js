const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductImage = sequelize.define('ProductImage', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id',
    },
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  imageOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  isMain: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'product_images',
  timestamps: true,
  updatedAt: false,
});

module.exports = ProductImage;
