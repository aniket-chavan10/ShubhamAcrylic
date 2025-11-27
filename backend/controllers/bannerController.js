const Banner = require('../models/Banner');

// Get all active banners (public)
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get all banners (admin)
exports.getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ order: 1, createdAt: -1 });
        res.json(banners);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a banner
exports.createBanner = async (req, res) => {
    try {
        const { title, subtitle, link, isActive, order } = req.body;
        const imageUrl = req.file ? (req.file.secure_url || req.file.path) : undefined;

        if (!imageUrl) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const newBanner = new Banner({
            title,
            subtitle,
            imageUrl,
            link,
            isActive: isActive === 'true' || isActive === true,
            order: parseInt(order) || 0
        });

        const savedBanner = await newBanner.save();
        res.status(201).json(savedBanner);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Update a banner
exports.updateBanner = async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) {
            updateData.imageUrl = req.file.secure_url || req.file.path;
        }

        // Handle boolean conversion if sent as string form-data
        if (typeof updateData.isActive === 'string') {
            updateData.isActive = updateData.isActive === 'true';
        }

        const updatedBanner = await Banner.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedBanner) return res.status(404).json({ message: 'Banner not found' });
        res.json(updatedBanner);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Delete a banner
exports.deleteBanner = async (req, res) => {
    try {
        const deletedBanner = await Banner.findByIdAndDelete(req.params.id);
        if (!deletedBanner) return res.status(404).json({ message: 'Banner not found' });
        res.json({ message: 'Banner deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
