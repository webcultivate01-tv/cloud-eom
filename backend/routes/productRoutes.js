const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/adminMiddleware");

// Public routes
router.get("/", getProducts);

// Admin only — must come before /:id to avoid conflict
router.get("/admin/all", protect, adminOnly, getAllProductsAdmin);

// Public route
router.get("/:id", getProductById);

// Admin routes — JSON body with images as URL array.
// Image URLs come either from /api/upload (stored in backend/uploads/products/<category>/<product>) or from external URLs pasted by admin.
router.post("/",    protect, adminOnly, createProduct);
router.put("/:id",  protect, adminOnly, updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

module.exports = router;
