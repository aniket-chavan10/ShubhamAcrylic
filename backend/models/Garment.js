const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const jsonColumn = require('../utils/jsonColumn');

// A customisable blank (Hoodie, Oversized Tee, Polo …) configured by the admin.
//
// colors     : [{ name, hex }]
// sizes      : [{ label, extra }]                      extra = surcharge in ₹ for that size
// placements : [{ key, label, view, price, x, y, w, h, enabled }]
//              view = 'front' | 'back'; x/y/w/h are fractions (0–1) of the mockup canvas
const Garment = sequelize.define('Garment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  key: {
    type: DataTypes.STRING(60),
    allowNull: false,
    unique: true,
  },
  // Which built-in mockup drawing to use when no custom mockup image is uploaded
  style: {
    type: DataTypes.ENUM('hoodie', 'oversized-tee', 'polo'),
    allowNull: false,
    defaultValue: 'oversized-tee',
  },
  name: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  tagline: {
    type: DataTypes.STRING(255),
    defaultValue: '',
  },
  description: {
    type: DataTypes.TEXT,
  },
  fabric: {
    type: DataTypes.STRING(255),
    defaultValue: '',
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  },
  colors: jsonColumn('colors', []),
  sizes: jsonColumn('sizes', []),
  placements: jsonColumn('placements', []),
  // Optional photo mockups (white garment on transparent PNG) – tinted on the fly
  mockupFront: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  mockupBack: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Photo shown on the home page garment card (not used by the design studio)
  coverImage: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  tableName: 'garments',
  timestamps: true,
});

const COMMON_SIZES = [
  { label: 'S', extra: 0 },
  { label: 'M', extra: 0 },
  { label: 'L', extra: 0 },
  { label: 'XL', extra: 0 },
  { label: 'XXL', extra: 50 },
  { label: '3XL', extra: 100 },
];

Garment.DEFAULTS = [
  {
    key: 'hoodie',
    style: 'hoodie',
    name: 'Classic Hoodie',
    tagline: 'Heavyweight fleece, made for your artwork',
    description: '320 GSM brushed-back fleece hoodie with ribbed cuffs, kangaroo pocket and a double-lined hood.',
    fabric: '320 GSM Cotton Fleece',
    basePrice: 500,
    sortOrder: 1,
    colors: [
      { name: 'Jet Black', hex: '#141414' },
      { name: 'Off White', hex: '#f3f1ea' },
      { name: 'Grey Melange', hex: '#a3a3a3' },
      { name: 'Navy', hex: '#1f2a44' },
      { name: 'Maroon', hex: '#6d1b2b' },
      { name: 'Bottle Green', hex: '#1e4d3a' },
    ],
    sizes: COMMON_SIZES,
    placements: [
      { key: 'chest', label: 'Left Chest (over heart)', view: 'front', price: 100, x: 0.56, y: 0.30, w: 0.13, h: 0.11, enabled: true },
      { key: 'front', label: 'Front / Stomach – Large', view: 'front', price: 300, x: 0.33, y: 0.43, w: 0.34, h: 0.24, enabled: true },
      { key: 'back', label: 'Full Back', view: 'back', price: 350, x: 0.31, y: 0.36, w: 0.38, h: 0.42, enabled: true },
    ],
  },
  {
    key: 'oversized-tee',
    style: 'oversized-tee',
    name: 'Oversized Tee',
    tagline: 'Drop-shoulder, boxy fit, 240 GSM',
    description: 'Boxy drop-shoulder oversized t-shirt in bio-washed 240 GSM combed cotton with a thick ribbed neck.',
    fabric: '240 GSM Bio-washed Cotton',
    basePrice: 399,
    sortOrder: 2,
    colors: [
      { name: 'Jet Black', hex: '#141414' },
      { name: 'Pure White', hex: '#fafafa' },
      { name: 'Beige', hex: '#d8c7a8' },
      { name: 'Lavender', hex: '#b9a7d6' },
      { name: 'Red', hex: '#c62828' },
      { name: 'Olive', hex: '#5b6236' },
    ],
    sizes: COMMON_SIZES,
    placements: [
      { key: 'chest', label: 'Left Chest (over heart)', view: 'front', price: 80, x: 0.56, y: 0.27, w: 0.14, h: 0.12, enabled: true },
      { key: 'front', label: 'Front / Stomach – Large', view: 'front', price: 200, x: 0.33, y: 0.42, w: 0.34, h: 0.36, enabled: true },
      { key: 'back', label: 'Full Back', view: 'back', price: 250, x: 0.30, y: 0.22, w: 0.40, h: 0.50, enabled: true },
    ],
  },
  {
    key: 'polo',
    style: 'polo',
    name: 'Polo T-Shirt',
    tagline: 'Pique cotton, smart and comfortable',
    description: '220 GSM cotton pique polo with a knitted collar, 3-button placket and ribbed sleeve cuffs. Great for teams and corporate wear.',
    fabric: '220 GSM Cotton Pique',
    basePrice: 449,
    sortOrder: 3,
    colors: [
      { name: 'Pure White', hex: '#fafafa' },
      { name: 'Jet Black', hex: '#141414' },
      { name: 'Navy', hex: '#1f2a44' },
      { name: 'Royal Blue', hex: '#2747a3' },
      { name: 'Red', hex: '#c62828' },
      { name: 'Grey Melange', hex: '#a3a3a3' },
    ],
    sizes: COMMON_SIZES,
    placements: [
      { key: 'chest', label: 'Left Chest (over heart)', view: 'front', price: 100, x: 0.565, y: 0.30, w: 0.12, h: 0.10, enabled: true },
      { key: 'front', label: 'Front / Stomach – Large', view: 'front', price: 250, x: 0.35, y: 0.44, w: 0.30, h: 0.30, enabled: true },
      { key: 'back', label: 'Full Back', view: 'back', price: 300, x: 0.32, y: 0.22, w: 0.36, h: 0.44, enabled: true },
    ],
  },
];

module.exports = Garment;
