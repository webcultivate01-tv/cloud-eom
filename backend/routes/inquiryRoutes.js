const express = require("express");
const router = express.Router();
const {
  createInquiry,
  getAllInquiries,
  getPendingCount,
  deleteInquiry,
  respondToInquiry,
  updateInquiryStatus,
} = require("../controllers/inquiryController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public: submit inquiry
router.post("/", createInquiry);

// Admin: list all inquiries
router.get("/", protect, adminOnly, getAllInquiries);

// Admin: pending count for notification badge
router.get("/pending-count", protect, adminOnly, getPendingCount);

// Admin: delete inquiry
router.delete("/:id", protect, adminOnly, deleteInquiry);

// Admin: respond to inquiry (sends the reply email)
router.patch("/:id/respond", protect, adminOnly, respondToInquiry);

// Admin: move the enquiry along the pipeline / save working notes
router.patch("/:id/status", protect, adminOnly, updateInquiryStatus);

module.exports = router;
