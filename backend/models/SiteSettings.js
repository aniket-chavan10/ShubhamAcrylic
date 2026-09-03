const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SiteSettings = sequelize.define('SiteSettings', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  companyName: {
    type: DataTypes.STRING(255),
    defaultValue: 'Astitva Creations',
  },
  logoUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  whatsappNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Include country code, e.g. 919876543210',
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  googleMapsEmbed: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Google Maps embed URL',
  },
  instagramUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  facebookUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  twitterUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
  youtubeUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'site_settings',
  timestamps: true,
});

module.exports = SiteSettings;
