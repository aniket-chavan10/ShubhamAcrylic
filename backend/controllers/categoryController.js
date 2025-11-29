const Category = require('../models/Category');

// Get all categories (public)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all categories including inactive (admin)
exports.getAllCategoriesAdmin = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }
        res.json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create category (admin)
exports.createCategory = async (req, res) => {
    try {
        const { name, slug, description, isActive } = req.body;

        // Check if category with same name already exists
        const existingCategory = await Category.findOne({ name });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category with this name already exists' });
        }

        const category = new Category({
            name,
            slug,
            description,
            isActive: isActive !== undefined ? isActive : true,
        });

        const savedCategory = await category.save();
        res.status(201).json(savedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update category (admin)
exports.updateCategory = async (req, res) => {
    try {
        const { name, slug, description, isActive } = req.body;
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if new name conflicts with another category
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ name });
            if (existingCategory) {
                return res.status(400).json({ message: 'Category with this name already exists' });
            }
        }

        if (name) category.name = name;
        if (slug) category.slug = slug;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete category (admin)
exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        // Check if any products are using this category
        const Product = require('../models/Product');
        const productsUsingCategory = await Product.countDocuments({ category: category.name });

        if (productsUsingCategory > 0) {
            return res.status(400).json({
                message: `Cannot delete category. ${productsUsingCategory} product(s) are using this category.`,
                productsCount: productsUsingCategory
            });
        }

        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Toggle category active status (admin)
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Category not found' });
        }

        category.isActive = !category.isActive;
        const updatedCategory = await category.save();

        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
