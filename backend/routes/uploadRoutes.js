const express = require("express");
const router = express.Router();
const { upload, saveImage, deleteLocalImage } = require("../config/localUpload");
const { protect } = require("../middleware/authMiddleware");

// Multer errors (bad type, too large) should be JSON, not an HTML stack page
const handleUpload = (mw) => (req, res, next) =>
  mw(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });

// @desc    Upload a single image into backend/uploads/<folder>
// @route   POST /api/upload?folder=products|categories|events|orders|replacements|reviews
// @access  Private
router.post("/", protect, handleUpload(upload.single("image")), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    res.json({ imageUrl: await saveImage(req, req.file) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Upload multiple images (up to 5) — used for replacement requests
// @route   POST /api/upload/multiple?folder=replacements
// @access  Private
router.post("/multiple", protect, handleUpload(upload.array("images", 5)), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No image files provided" });
    }
    const imageUrls = [];
    for (const file of req.files) imageUrls.push(await saveImage(req, file));
    res.json({ imageUrls });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete a previously uploaded local image
// @route   DELETE /api/upload?url=<stored image url>
// @access  Private
router.delete("/", protect, (req, res) => {
  const url = req.query.url || req.body?.url;
  if (!url) return res.status(400).json({ message: "Image url is required" });
  const removed = deleteLocalImage(url);
  res.json({ removed });
});

module.exports = router;
