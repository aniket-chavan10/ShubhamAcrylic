const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Banner = sequelize.define('Banner', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
  },
  subtitle: {
    type: DataTypes.TEXT,
  },
  imageUrl: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  link: {
    type: DataTypes.STRING(500),
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'banners',
  timestamps: true,
});

module.exports = Banner;
