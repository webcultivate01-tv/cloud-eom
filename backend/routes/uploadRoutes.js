const express = require("express");
const router = express.Router();
const {
  upload,
  saveImage,
  deleteLocalImage,
  MAX_UPLOAD_MB,
  MAX_UPLOAD_BYTES,
  ALLOWED_EXTENSIONS,
} = require("../config/localUpload");
const { protect } = require("../middleware/authMiddleware");

// Multer errors (bad type, too large) should be JSON, not an HTML stack page.
// "File too large" is the one an admin will actually hit, so it is rewritten
// into a message that says what the limit is.
const handleUpload = (mw) => (req, res, next) =>
  mw(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? `Image is too large. Maximum size is ${MAX_UPLOAD_MB} MB.`
          : err.message;
      return res.status(400).json({ message });
    }
    next();
  });

// @desc    What the client is allowed to upload. Served so the file picker can
//          reject an oversized file before spending the upload on it, and so the
//          limit is never written down in two places that can drift apart.
// @route   GET /api/upload/limits
// @access  Public
router.get("/limits", (req, res) => {
  res.json({
    maxUploadMB: MAX_UPLOAD_MB,
    maxUploadBytes: MAX_UPLOAD_BYTES,
    allowedExtensions: ALLOWED_EXTENSIONS,
  });
});

// @desc    Upload a single image into backend/uploads/<folder>
// @route   POST /api/upload?folder=products|categories|events|orders|replacements|reviews
//          folder=products also takes &category=&product=, which nest the file
//          as uploads/products/<category>/<product>/<file>. Both are optional:
//          without them the image lands in a holding folder and is moved into
//          place when the product it belongs to is saved.
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
