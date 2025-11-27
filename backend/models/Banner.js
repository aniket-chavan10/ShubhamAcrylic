const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    link: { type: String, trim: true }, // Optional link to a product or category
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Banner', bannerSchema);
