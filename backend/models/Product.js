const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  productCode: {
    type: DataTypes.STRING(20),
    unique: true,
    // auto-generated before create in controller
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'categories',
      key: 'id',
    },
  },
  // ── Jersey / T-Shirt specific fields ────────────────────────────────────
  sportType: {
    type: DataTypes.STRING(100),
    // e.g. Football, Cricket, Basketball, Volleyball, Hockey, Generic
  },
  fabric: {
    type: DataTypes.STRING(100),
    // e.g. Polyester, Cotton, Dri-FIT, Mesh, Cotton Blend
  },
  availableSizes: {
    type: DataTypes.TEXT,
    // stored as JSON array: ["S","M","L","XL"]
    get() {
      const raw = this.getDataValue('availableSizes');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('availableSizes', JSON.stringify(value));
      } else if (typeof value === 'string') {
        try {
          JSON.parse(value);
          this.setDataValue('availableSizes', value);
        } catch {
          this.setDataValue('availableSizes', JSON.stringify([]));
        }
      } else {
        this.setDataValue('availableSizes', JSON.stringify([]));
      }
    },
  },
  gender: {
    type: DataTypes.STRING(50),
    // Men, Women, Unisex, Kids
  },
  fitType: {
    type: DataTypes.STRING(50),
    // Regular, Slim, Loose, Athletic
  },
  isCustomizable: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // ── Legacy / general fields ──────────────────────────────────────────────
  color: {
    type: DataTypes.STRING(100),
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  tags: {
    type: DataTypes.TEXT,
    // stored as JSON string
    get() {
      const raw = this.getDataValue('tags');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('tags', JSON.stringify(value));
      } else if (typeof value === 'string') {
        try {
          JSON.parse(value);
          this.setDataValue('tags', value);
        } catch {
          const arr = value.split(',').map(t => t.trim()).filter(Boolean);
          this.setDataValue('tags', JSON.stringify(arr));
        }
      } else {
        this.setDataValue('tags', JSON.stringify([]));
      }
    },
  },
  // Kept for backward compat (hidden in form)
  materialType: { type: DataTypes.STRING(100) },
  size: { type: DataTypes.STRING(100) },
  weight: { type: DataTypes.DECIMAL(10, 3) },
}, {
  tableName: 'products',
  timestamps: true,
});

module.exports = Product;
