const SiteSettings = require('../models/SiteSettings');

// Get settings (public + admin)
exports.getSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({
        companyName: 'Shubham Tees',
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update settings (admin only)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({ companyName: 'Shubham Tees' });
    }

    const { companyName, whatsappNumber, email, phone, address, googleMapsEmbed } = req.body;
    const logoUrl = req.file ? `/uploads/products/${req.file.filename}` : undefined;

    await settings.update({
      companyName: companyName !== undefined ? companyName : settings.companyName,
      whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : settings.whatsappNumber,
      email: email !== undefined ? email : settings.email,
      phone: phone !== undefined ? phone : settings.phone,
      address: address !== undefined ? address : settings.address,
      googleMapsEmbed: googleMapsEmbed !== undefined ? googleMapsEmbed : settings.googleMapsEmbed,
      ...(logoUrl ? { logoUrl } : {}),
    });

    res.json(settings);
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(400).json({ message: err.message });
  }
};
