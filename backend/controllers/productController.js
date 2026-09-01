const Product = require("../models/Product");
const Category = require("../models/Category");

exports.getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const skip = (page - 1) * limit;
    const total = await Product.countDocuments();
    const products = await Product.find()
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      products,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get a product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    let {
      name,
      description,
      price,
      category,
      materialType,
      size,
      color,
      weight,
      stockQuantity,
      tags,
    } = req.body;

    if (tags) {
      tags =
        typeof tags === "string"
          ? tags.split(",").map((tag) => tag.trim())
          : tags;
    } else {
      tags = [];
    }
    const imageUrl = req.file ? (req.file.secure_url || req.file.path) : undefined;

    // If category is a name, find or create it (optional fallback, but better to send ID)
    // For now assume ID is sent, or if name is sent, try to find it
    if (category && !category.match(/^[0-9a-fA-F]{24}$/)) {
      const catObj = await Category.findOne({ name: category });
      if (catObj) category = catObj._id;
      // If not found, it will fail validation or we could create it. 
      // Let's stick to ID for now as frontend will send ID.
    }

    const newProduct = new Product({
      name,
      description,
      price,
      category,
      materialType,
      size,
      color,
      weight,
      stockQuantity,
      tags,
      imageUrl,
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error("Error creating product:", err.stack || err);
    res.status(400).json({ message: err.message, error: err });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.imageUrl = req.file.path; // New image URL
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('category', 'name slug');
    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct)
      return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.query || "";

    // Find categories matching the query
    const categories = await Category.find({ name: { $regex: query, $options: "i" } });
    const categoryIds = categories.map(c => c._id);

    // Search by name, category ID, or tags
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $in: categoryIds } },
        { tags: { $regex: query, $options: "i" } },
      ],
    }).populate('category', 'name slug');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.advancedSearchProducts = async (req, res) => {
  try {
    const { query, category, materialType, minPrice, maxPrice, color, tags } =
      req.query;
    const filter = {};

    if (query) {
      const categories = await Category.find({ name: { $regex: query, $options: "i" } });
      const categoryIds = categories.map(c => c._id);

      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { category: { $in: categoryIds } },
        { tags: { $regex: query, $options: "i" } },
      ];
    }

    if (category) {
      // If category is ID
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        filter.category = category;
      } else {
        // If category is name/slug
        const catObj = await Category.findOne({ $or: [{ name: category }, { slug: category }] });
        if (catObj) filter.category = catObj._id;
      }
    }

    if (materialType) filter.materialType = materialType;
    if (color) filter.color = color;
    if (minPrice) filter.price = { ...filter.price, $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...filter.price, $lte: Number(maxPrice) };
    if (tags) filter.tags = { $all: tags.split(",").map((tag) => tag.trim()) };

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .populate('category', 'name slug');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get product counts (total and by category)
exports.getProductStats = async (req, res) => {
  try {
    // Get total count
    const total = await Product.countDocuments();

    // Aggregate category counts
    const categoryCounts = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);

    // Populate category names
    const categories = {};
    for (const c of categoryCounts) {
      if (c._id) {
        const cat = await Category.findById(c._id);
        if (cat) {
          categories[cat.name] = c.count;
        } else {
          categories[String(c._id)] = c.count;
        }
      }
    }

    res.json({
      total,
      categories
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
