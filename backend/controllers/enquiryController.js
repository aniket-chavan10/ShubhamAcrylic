const Enquiry = require('../models/Enquiry');
const Product = require('../models/Product');

// Get paginated enquiries
exports.getEnquiries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Enquiry.findAndCountAll({
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    res.json({
      total: count,
      page,
      pages: Math.ceil(count / limit),
      enquiries: rows,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a general enquiry (from Contact page)
exports.createEnquiry = async (req, res) => {
  try {
    const { name, email, message, mobileNo } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }
    const newEnquiry = await Enquiry.create({
      name,
      email,
      mobileNo,
      message,
      enquiryType: 'general',
    });
    res.status(201).json(newEnquiry);
  } catch (err) {
    console.error('createEnquiry error:', err);
    res.status(400).json({ message: err.message });
  }
};

// Create a product-specific enquiry
exports.createProductEnquiry = async (req, res) => {
  try {
    const { name, email, message, mobileNo, productId, productCode, productName } = req.body;
    if (!name || !email || !message || !mobileNo) {
      return res.status(400).json({ message: 'Name, email, mobile and message are required' });
    }

    const newEnquiry = await Enquiry.create({
      name,
      email,
      mobileNo,
      message,
      productId: productId ? parseInt(productId) : null,
      productCode: productCode || null,
      productName: productName || null,
      enquiryType: 'product',
    });
    res.status(201).json(newEnquiry);
  } catch (err) {
    console.error('createProductEnquiry error:', err);
    res.status(400).json({ message: err.message });
  }
};

// Get count of pending enquiries
exports.getPendingCount = async (req, res) => {
  try {
    const count = await Enquiry.count({ where: { status: 'pending' } });
    res.json({ pendingCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete an enquiry by ID
exports.deleteEnquiry = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByPk(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    await enquiry.destroy();
    res.json({ message: 'Enquiry deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark enquiry as resolved
exports.markEnquiryResolved = async (req, res) => {
  try {
    const enquiry = await Enquiry.findByPk(req.params.id);
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });
    await enquiry.update({ status: 'resolved' });
    res.json(enquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
