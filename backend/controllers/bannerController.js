const Banner = require('../models/Banner');

// Get all active banners (public)
exports.getBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all banners (admin)
exports.getAllBanners = async (req, res) => {
  try {
    const banners = await Banner.findAll({ order: [['order', 'ASC'], ['createdAt', 'DESC']] });
    res.json(banners);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a banner
exports.createBanner = async (req, res) => {
  try {
    const { title, subtitle, link, isActive, order } = req.body;
    const imageUrl = req.file ? (req.file.location || `/uploads/products/${req.file.filename}`) : undefined;

    if (!imageUrl) return res.status(400).json({ message: 'Image is required' });

    const newBanner = await Banner.create({
      title,
      subtitle,
      imageUrl,
      link,
      isActive: isActive === 'true' || isActive === true,
      order: parseInt(order) || 0,
    });
    res.status(201).json(newBanner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Update a banner
exports.updateBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });

    const updateData = { ...req.body };
    if (req.file) updateData.imageUrl = req.file.location || `/uploads/products/${req.file.filename}`;
    if (typeof updateData.isActive === 'string') {
      updateData.isActive = updateData.isActive === 'true';
    }

    await banner.update(updateData);
    res.json(banner);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete a banner
exports.deleteBanner = async (req, res) => {
  try {
    const banner = await Banner.findByPk(req.params.id);
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    await banner.destroy();
    res.json({ message: 'Banner deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
