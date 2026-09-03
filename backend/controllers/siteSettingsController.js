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
      aboutSubtitle, aboutTitle, aboutDescription,
      feature1Title, feature1Desc, feature2Title, feature2Desc,
      feature3Title, feature3Desc, feature4Title, feature4Desc,
    } = req.body;

    // Support multiple uploaded files (req.files) or single file (req.file)
    let logoUrl = req.body.logoUrl;
    let aboutImage1Url = req.body.aboutImage1;
    let aboutImage2Url = req.body.aboutImage2;

    if (req.files) {
      if (req.files.logo && req.files.logo[0]) {
        const f = req.files.logo[0];
        logoUrl = f.location || `/uploads/products/${f.filename}`;
      }
      if (req.files.aboutImage1 && req.files.aboutImage1[0]) {
        const f = req.files.aboutImage1[0];
        aboutImage1Url = f.location || `/uploads/products/${f.filename}`;
      }
      if (req.files.aboutImage2 && req.files.aboutImage2[0]) {
        const f = req.files.aboutImage2[0];
        aboutImage2Url = f.location || `/uploads/products/${f.filename}`;
      }
    } else if (req.file) {
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

      aboutSubtitle: aboutSubtitle !== undefined ? aboutSubtitle : settings.aboutSubtitle,
      aboutTitle: aboutTitle !== undefined ? aboutTitle : settings.aboutTitle,
      aboutDescription: aboutDescription !== undefined ? aboutDescription : settings.aboutDescription,
      feature1Title: feature1Title !== undefined ? feature1Title : settings.feature1Title,
      feature1Desc: feature1Desc !== undefined ? feature1Desc : settings.feature1Desc,
      feature2Title: feature2Title !== undefined ? feature2Title : settings.feature2Title,
      feature2Desc: feature2Desc !== undefined ? feature2Desc : settings.feature2Desc,
      feature3Title: feature3Title !== undefined ? feature3Title : settings.feature3Title,
      feature3Desc: feature3Desc !== undefined ? feature3Desc : settings.feature3Desc,
      feature4Title: feature4Title !== undefined ? feature4Title : settings.feature4Title,
      feature4Desc: feature4Desc !== undefined ? feature4Desc : settings.feature4Desc,

      ...(logoUrl ? { logoUrl } : {}),
      ...(aboutImage1Url ? { aboutImage1: aboutImage1Url } : {}),
      ...(aboutImage2Url ? { aboutImage2: aboutImage2Url } : {}),
    });

    res.json(settings);
  } catch (err) {
    console.error('updateSettings error:', err);
    res.status(400).json({ message: err.message });
  }
};
