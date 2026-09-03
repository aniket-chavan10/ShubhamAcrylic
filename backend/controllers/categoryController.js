const Category = require('../models/Category');
const Product = require('../models/Product');
const { Op } = require('sequelize');

// Get all active categories (public)
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all categories including inactive (admin)
exports.getAllCategoriesAdmin = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create category (admin)
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description, isActive } = req.body;

    const existing = await Category.findOne({ where: { name } });
    if (existing) return res.status(400).json({ message: 'Category with this name already exists' });

    // Auto-generate slug if not provided
    const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const category = await Category.create({
      name,
      slug: finalSlug,
      description,
      isActive: isActive !== undefined ? isActive : true,
    });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update category (admin)
exports.updateCategory = async (req, res) => {
  try {
    const { name, slug, description, isActive } = req.body;
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    if (name && name !== category.name) {
      const existing = await Category.findOne({ where: { name } });
      if (existing) return res.status(400).json({ message: 'Category with this name already exists' });
    }

    await category.update({
      name: name ?? category.name,
      slug: slug ?? category.slug,
      description: description !== undefined ? description : category.description,
      isActive: isActive !== undefined ? isActive : category.isActive,
    });

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete category (admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Unlink products associated with this category so deletion never fails
    await Product.update({ categoryId: null }, { where: { categoryId: category.id } });

    await category.destroy();
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle category active status (admin)
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    await category.update({ isActive: !category.isActive });
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
