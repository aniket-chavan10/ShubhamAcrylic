const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ProductImage = require('../models/ProductImage');

// ── Helper: generate unique product code ─────────────────────────────────────
async function generateProductCode() {
  const last = await Product.findOne({
    where: { productCode: { [Op.like]: 'AC-%' } },
    order: [['id', 'DESC']],
  });
  let nextNum = 1;
  if (last && last.productCode) {
    const parts = last.productCode.split('-');
    const num = parseInt(parts[parts.length - 1]);
    if (!isNaN(num)) nextNum = num + 1;
  }
  return `AC-${String(nextNum).padStart(4, '0')}`;
}

// ── Helper: build image URL (supports S3 + local disk) ──────────────────────
function getImageUrl(file) {
  if (!file) return null;
  // If it already has a URL (e.g. from seed), return as-is
  if (file.imageUrl) return file.imageUrl;
  // S3 upload → multer-s3 sets `location` to the full S3 URL
  if (file.location) return file.location;
  // Local disk upload
  return `/uploads/products/${file.filename}`;
}

// ── Helper: build product JSON response ──────────────────────────────────────
function formatProduct(product) {
  const p = product.toJSON();
  if (p.images) {
    p.images = p.images.sort((a, b) => a.imageOrder - b.imageOrder);
    p.imageUrl = p.images.find(img => img.isMain)?.imageUrl || p.images[0]?.imageUrl || null;
  } else {
    p.imageUrl = null;
  }
  return p;
}

// ── Helper: parse jersey fields from body ─────────────────────────────────────
function parseJerseyFields(body) {
  let { availableSizes } = body;
  if (typeof availableSizes === 'string') {
    try { availableSizes = JSON.parse(availableSizes); }
    catch { availableSizes = availableSizes.split(',').map(s => s.trim()).filter(Boolean); }
  }
  if (!Array.isArray(availableSizes)) availableSizes = [];
  return { availableSizes };
}

// ── GET /products ─────────────────────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    const { count, rows } = await Product.findAndCountAll({
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'imageOrder', 'isMain'] },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      total: count,
      page,
      pages: Math.ceil(count / limit),
      products: rows.map(formatProduct),
    });
  } catch (err) {
    console.error('getProducts error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ── GET /products/:id ─────────────────────────────────────────────────────────
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images', attributes: ['id', 'imageUrl', 'imageOrder', 'isMain'] },
      ],
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(formatProduct(product));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /products ────────────────────────────────────────────────────────────
exports.createProduct = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    let {
      name, description, price, category,
      color, stockQuantity, tags,
      sportType, fabric, gender, fitType, isCustomizable,
    } = req.body;

    // Parse jersey fields
    const { availableSizes } = parseJerseyFields(req.body);

    // Parse tags
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch { tags = tags.split(',').map(t => t.trim()).filter(Boolean); }
    }
    if (!Array.isArray(tags)) tags = [];

    // Resolve category
    let categoryId = null;
    if (category) {
      if (!isNaN(parseInt(category))) {
        categoryId = parseInt(category);
      } else {
        const cat = await Category.findOne({ where: { name: category } });
        if (cat) categoryId = cat.id;
      }
    }

    const productCode = await generateProductCode();

    const newProduct = await Product.create({
      productCode,
      name,
      description,
      price: parseFloat(price),
      categoryId,
      color,
      stockQuantity: stockQuantity ? parseInt(stockQuantity) : 0,
      tags,
      sportType: sportType || null,
      fabric: fabric || null,
      availableSizes,
      gender: gender || null,
      fitType: fitType || null,
      isCustomizable: isCustomizable === 'true' || isCustomizable === true,
    }, { transaction: t });

    // Handle uploaded images
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length > 0) {
      const imageRecords = files.map((file, index) => ({
        productId: newProduct.id,
        imageUrl: getImageUrl(file),
        imageOrder: index,
        isMain: index === 0,
      }));
      await ProductImage.bulkCreate(imageRecords, { transaction: t });
    }

    await t.commit();

    const saved = await Product.findByPk(newProduct.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images' },
      ],
    });
    res.status(201).json(formatProduct(saved));
  } catch (err) {
    await t.rollback();
    console.error('createProduct error:', err.stack || err);
    res.status(400).json({ message: err.message });
  }
};

// ── PUT /products/:id ─────────────────────────────────────────────────────────
exports.updateProduct = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    let {
      name, description, price, category,
      color, stockQuantity, tags, removeImageIds,
      sportType, fabric, gender, fitType, isCustomizable,
    } = req.body;

    const { availableSizes } = parseJerseyFields(req.body);

    // Parse tags
    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch { tags = tags.split(',').map(t => t.trim()).filter(Boolean); }
    }

    // Resolve category
    let categoryId = product.categoryId;
    if (category !== undefined) {
      if (!isNaN(parseInt(category))) {
        categoryId = parseInt(category);
      } else if (category) {
        const cat = await Category.findOne({ where: { name: category } });
        if (cat) categoryId = cat.id;
      }
    }

    await product.update({
      name: name ?? product.name,
      description: description ?? product.description,
      price: price !== undefined ? parseFloat(price) : product.price,
      categoryId,
      color: color ?? product.color,
      stockQuantity: stockQuantity !== undefined ? parseInt(stockQuantity) : product.stockQuantity,
      ...(Array.isArray(tags) ? { tags } : {}),
      sportType: sportType !== undefined ? sportType : product.sportType,
      fabric: fabric !== undefined ? fabric : product.fabric,
      availableSizes: availableSizes.length > 0 ? availableSizes : product.availableSizes,
      gender: gender !== undefined ? gender : product.gender,
      fitType: fitType !== undefined ? fitType : product.fitType,
      isCustomizable: isCustomizable !== undefined
        ? (isCustomizable === 'true' || isCustomizable === true)
        : product.isCustomizable,
    }, { transaction: t });

    // Remove images if requested
    if (removeImageIds) {
      const ids = typeof removeImageIds === 'string'
        ? removeImageIds.split(',').map(Number)
        : Array.isArray(removeImageIds) ? removeImageIds.map(Number) : [];
      if (ids.length > 0) {
        await ProductImage.destroy({ where: { id: ids, productId: product.id }, transaction: t });
      }
    }

    // Add new uploaded images
    const files = req.files || (req.file ? [req.file] : []);
    if (files.length > 0) {
      const existingCount = await ProductImage.count({ where: { productId: product.id } });
      const imageRecords = files.map((file, index) => ({
        productId: product.id,
        imageUrl: getImageUrl(file),
        imageOrder: existingCount + index,
        isMain: existingCount === 0 && index === 0,
      }));
      await ProductImage.bulkCreate(imageRecords, { transaction: t });
    }

    await t.commit();

    const updated = await Product.findByPk(product.id, {
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images' },
      ],
    });
    res.json(formatProduct(updated));
  } catch (err) {
    await t.rollback();
    console.error('updateProduct error:', err);
    res.status(400).json({ message: err.message });
  }
};

// ── DELETE /products/:id ──────────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductImage, as: 'images' }]
    });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Collect all image URLs for cleanup
    const imageRecords = product.images || [];
    const imageUrls = imageRecords.map(img => img.imageUrl).filter(Boolean);

    await ProductImage.destroy({ where: { productId: product.id }, transaction: t });
    await product.destroy({ transaction: t });
    await t.commit();

    // Clean up physical image files from local disk (if stored locally)
    imageUrls.forEach(url => {
      if (url && url.startsWith('/uploads/')) {
        const filePath = path.join(__dirname, '../', url);
        if (fs.existsSync(filePath)) {
          fs.unlink(filePath, err => {
            if (err) console.error('Error deleting local file:', filePath, err);
            else console.log('🗑️ Deleted local image file from server:', filePath);
          });
        }
      }
    });

    res.json({ message: 'Product and associated image files deleted successfully' });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ message: err.message });
  }
};

// ── GET /products/search ──────────────────────────────────────────────────────
exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.query || '';
    const categories = await Category.findAll({ where: { name: { [Op.like]: `%${query}%` } } });
    const categoryIds = categories.map(c => c.id);

    const products = await Product.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${query}%` } },
          { tags: { [Op.like]: `%${query}%` } },
          ...(categoryIds.length > 0 ? [{ categoryId: { [Op.in]: categoryIds } }] : []),
        ],
      },
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images' },
      ],
    });
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /products/advanced-search ─────────────────────────────────────────────
exports.advancedSearchProducts = async (req, res) => {
  try {
    const { query, category, sportType, minPrice, maxPrice, gender, tags } = req.query;
    const where = {};

    if (query) {
      const cats = await Category.findAll({ where: { name: { [Op.like]: `%${query}%` } } });
      const catIds = cats.map(c => c.id);
      where[Op.or] = [
        { name: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { tags: { [Op.like]: `%${query}%` } },
        ...(catIds.length > 0 ? [{ categoryId: { [Op.in]: catIds } }] : []),
      ];
    }

    if (category) {
      if (!isNaN(parseInt(category))) {
        where.categoryId = parseInt(category);
      } else {
        const cat = await Category.findOne({ where: { [Op.or]: [{ name: category }, { slug: category }] } });
        if (cat) where.categoryId = cat.id;
      }
    }

    if (sportType) where.sportType = sportType;
    if (gender) where.gender = gender;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      where[Op.and] = where[Op.and] || [];
      tagList.forEach(tag => {
        where[Op.and].push({ tags: { [Op.like]: `%${tag}%` } });
      });
    }

    const products = await Product.findAll({
      where,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: ProductImage, as: 'images' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(products.map(formatProduct));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /products/stats ───────────────────────────────────────────────────────
exports.getProductStats = async (req, res) => {
  try {
    const total = await Product.count();

    const rows = await Product.findAll({
      attributes: ['categoryId', [sequelize.fn('COUNT', sequelize.col('Product.id')), 'count']],
      include: [{ model: Category, as: 'category', attributes: ['name'] }],
      group: ['categoryId', 'category.id'],
      raw: true,
      nest: true,
    });

    const categories = {};
    rows.forEach(row => {
      const name = row['category.name'] || row.category?.name || String(row.categoryId);
      categories[name] = parseInt(row.count);
    });

    res.json({ total, categories });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
