const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const { protect } = require("../middleware/authMiddleware");

// @desc    Upload a custom image (used during checkout for order items)
// @route   POST /api/upload
// @access  Private
router.post("/", protect, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    // multer-storage-cloudinary puts the URL in req.file.path
    res.json({ imageUrl: req.file.path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
