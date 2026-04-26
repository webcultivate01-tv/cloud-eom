const express = require("express");
const router = express.Router();
const { shipOrder, getShipmentInfo } = require("../controllers/shipmentController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Ship an order (admin triggers this)
router.post("/:orderId", protect, adminOnly, shipOrder);

// Get shipment info (admin or order owner)
router.get("/:orderId", protect, getShipmentInfo);

module.exports = router;
