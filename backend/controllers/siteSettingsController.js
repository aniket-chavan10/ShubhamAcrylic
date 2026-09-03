const SiteSettings = require('../models/SiteSettings');

// Get settings (public + admin)
exports.getSettings = async (req, res) => {
  try {
    let settings = await SiteSettings.findOne();
    if (!settings) {
      settings = await SiteSettings.create({
        companyName: 'Astitva Creations',
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
      settings = await SiteSettings.create({ companyName: 'Astitva Creations' });
    }

    const {
      companyName, whatsappNumber, email, phone, address, googleMapsEmbed,
      instagramUrl, facebookUrl, twitterUrl, youtubeUrl,
    } = req.body;

    // Support both S3 uploads (file.location) and local disk (file.filename)
    let logoUrl;
    if (req.file) {
      logoUrl = req.file.location || `/uploads/products/${req.file.filename}`;
    }

    await settings.update({
      companyName: companyName !== undefined ? companyName : settings.companyName,
      whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : settings.whatsappNumber,
      email: email !== undefined ? email : settings.email,
      phone: phone !== undefined ? phone : settings.phone,
      address: address !== undefined ? address : settings.address,
      googleMapsEmbed: googleMapsEmbed !== undefined ? googleMapsEmbed : settings.googleMapsEmbed,
      instagramUrl: instagramUrl !== undefined ? instagramUrl : settings.instagramUrl,
      facebookUrl: facebookUrl !== undefined ? facebookUrl : settings.facebookUrl,
      twitterUrl: twitterUrl !== undefined ? twitterUrl : settings.twitterUrl,
      youtubeUrl: youtubeUrl !== undefined ? youtubeUrl : settings.youtubeUrl,
      ...(logoUrl ? { logoUrl } : {}),
    });

    res.json(settings);
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(400).json({ message: err.message });
  }
};

