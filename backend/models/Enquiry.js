const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    mobileNo: { type: String, require: true, trim: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["pending", "resolved"], default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);
