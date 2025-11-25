const express = require("express");
const router = express.Router();
const enquiryController = require("../controllers/enquiryController");

router.get("/", enquiryController.getEnquiries);
router.post("/", enquiryController.createEnquiry);
router.get("/pending-count", enquiryController.getPendingCount);
router.delete("/:id", enquiryController.deleteEnquiry);
router.patch("/:id/resolve", enquiryController.markEnquiryResolved);

module.exports = router;
