const Enquiry = require("../models/Enquiry");

// Get paginated enquiries
exports.getEnquiries = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const skip = (page - 1) * limit;
    const total = await Enquiry.countDocuments();
    const enquiries = await Enquiry.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      total,
      page,
      pages: Math.ceil(total / limit),
      enquiries,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new enquiry from Contact Us form
exports.createEnquiry = async (req, res) => {
  try {
    const { name, email, message ,mobileNo} = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, mobileNo and message are required" });
    }

    const newEnquiry = new Enquiry({
      name,
      email,
      message,
      mobileNo
    });

    const savedEnquiry = await newEnquiry.save();
    res.status(201).json(savedEnquiry);
  } catch (err) {
    console.error("Error creating enquiry:", err.stack || err);
    res.status(400).json({ message: err.message, error: err });
  }
};

// Get count of pending enquiries for navbar notification
exports.getPendingCount = async (req, res) => {
  try {
    const count = await Enquiry.countDocuments({ status: "pending" });
    res.json({ pendingCount: count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Delete an enquiry by ID
exports.deleteEnquiry = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Enquiry.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Enquiry not found" });
    res.json({ message: "Enquiry deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mark enquiry as read/resolved by ID
exports.markEnquiryResolved = async (req, res) => {
  try {
    const id = req.params.id;
    const enquiry = await Enquiry.findById(id);
    if (!enquiry) return res.status(404).json({ message: "Enquiry not found" });

    enquiry.status = "resolved";
    await enquiry.save();
    res.json(enquiry);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
