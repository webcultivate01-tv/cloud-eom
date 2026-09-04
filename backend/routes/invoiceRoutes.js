const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  downloadInvoice, previewInvoice, invoiceSummary,
} = require("../controllers/invoiceController");
const { adminOnly } = require("../middleware/adminMiddleware");

// Owner or admin — the controller checks which
router.get("/:orderId",          protect, downloadInvoice);
router.get("/:orderId/preview",  protect, previewInvoice);

// Admin-only tax breakdown, used by the Orders and Payments panels
router.get("/:orderId/summary",  protect, adminOnly, invoiceSummary);

module.exports = router;
