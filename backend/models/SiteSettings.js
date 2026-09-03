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
  // ── Dynamic Brand Story & Highlights ──────────────────────────────────────
  aboutSubtitle: {
    type: DataTypes.STRING(255),
    defaultValue: 'OUR BRAND STORY',
  },
  aboutTitle: {
    type: DataTypes.STRING(255),
    defaultValue: 'Crafting Premium Custom Apparel & T-Shirt Designs',
  },
  aboutDescription: {
    type: DataTypes.TEXT,
    defaultValue: 'At Astitva Creations, we transform organic cotton and premium fabrics into high-impact oversized t-shirts, custom graphic tees, hoodies, and corporate merchandise. Engineered with state-of-the-art screen printing, DTG precision, and bio-wash softness.',
  },
  aboutImage1: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop',
  },
  aboutImage2: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop',
  },
  feature1Title: {
    type: DataTypes.STRING(255),
    defaultValue: 'Heavyweight Cotton',
  },
  feature1Desc: {
    type: DataTypes.TEXT,
    defaultValue: '180 to 350 GSM pre-shrunk combed cotton for maximum durability.',
  },
  feature2Title: {
    type: DataTypes.STRING(255),
    defaultValue: 'Precision DTG & Screen Printing',
  },
  feature2Desc: {
    type: DataTypes.TEXT,
    defaultValue: 'Vibrant, crack-resistant eco-friendly prints with high detail.',
  },
  feature3Title: {
    type: DataTypes.STRING(255),
    defaultValue: 'Bio-Washed & Pre-Shrunk',
  },
  feature3Desc: {
    type: DataTypes.TEXT,
    defaultValue: 'Ultra-soft fabric feel with zero color fading or shrinkage.',
  },
  feature4Title: {
    type: DataTypes.STRING(255),
    defaultValue: 'Custom Apparel & Bulk Orders',
  },
  feature4Desc: {
    type: DataTypes.TEXT,
    defaultValue: 'Bespoke oversized fits, custom embroidery, and corporate branding.',
  },
}, {
  tableName: 'site_settings',
  timestamps: true,
});

module.exports = SiteSettings;
