const Product = require("../models/Product");
const { cloudinary } = require("../config/cloudinary");

// @desc    Get all available products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search } = req.query;
    let filter = { isAvailable: true };

    // Filter by category if provided
    if (category) filter.category = category;

    // Search by name if provided
    if (search) filter.name = { $regex: search, $options: "i" };

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new product (admin uploads image via Cloudinary)
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock, allowCustomImage, requiresCustomImage } = req.body;

    // If admin uploaded an image, req.file.path is the Cloudinary URL
    const image = req.file ? req.file.path : "";

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
      allowCustomImage,
      requiresCustomImage,
      image,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const { name, description, price, category, stock, isAvailable, allowCustomImage, requiresCustomImage } = req.body;

    // Update image if a new one was uploaded
    if (req.file) {
      product.image = req.file.path;
    }

    product.name = name ?? product.name;
    product.description = description ?? product.description;
    product.price = price ?? product.price;
    product.category = category ?? product.category;
    product.stock = stock ?? product.stock;
    product.isAvailable = isAvailable ?? product.isAvailable;
    product.allowCustomImage = allowCustomImage ?? product.allowCustomImage;
    product.requiresCustomImage = requiresCustomImage ?? product.requiresCustomImage;

    const updated = await product.save();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all products (including unavailable) for admin
// @route   GET /api/products/admin/all
// @access  Admin
const getAllProductsAdmin = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
};
