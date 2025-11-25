const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  category: String,
  materialType: String,   // e.g., acrylic, other materials
  size: String,           // e.g., dimensions or size description
  color: String,          // color of the product
  weight: Number,         // weight if relevant
  stockQuantity: Number,  // inventory count
  tags: [String],         // array of searchable tags
  imageUrl: String,       // URL to product image stored externally (e.g., Cloudinary)
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
