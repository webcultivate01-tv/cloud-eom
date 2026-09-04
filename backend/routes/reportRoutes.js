const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");
const { getOverview, downloadReport, listReports } = require("../controllers/reportController");

// Every report is admin-only — they carry customer and revenue data
router.get("/",         protect, adminOnly, listReports);
router.get("/overview", protect, adminOnly, getOverview);

// sales | gst | invoices | payments | products
router.get("/:type",    protect, adminOnly, downloadReport);

module.exports = router;
