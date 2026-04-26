const Order = require("../models/Order");
const Product = require("../models/Product");

// @desc    Place a new order
// @route   POST /api/orders
// @access  Private (logged-in users)
const createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, customerNote } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items in order" });
    }

    // Build order items with current prices from DB
    let totalPrice = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      if (!product.isAvailable) {
        return res.status(400).json({ message: `${product.name} is currently unavailable` });
      }

      const lineTotal = product.price * item.quantity;
      totalPrice += lineTotal;

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        uploadedImage: item.uploadedImage || "", // Cloudinary URL from frontend upload
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      totalPrice,
      customerNote,
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get orders for the logged-in user
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.product", "name image category")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a specific order by ID (owner or admin)
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product", "name image category");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only the owner or an admin can view the order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all orders (admin) with optional date filter
// @route   GET /api/orders?filter=today|3days|7days|30days&from=DATE&to=DATE
// @access  Admin
const getAllOrders = async (req, res) => {
  try {
    const { filter, from, to, status } = req.query;
    const query = {};

    // Date range filter
    const now = new Date();
    if (filter) {
      const daysMap = { today: 0, "3days": 3, "7days": 7, "30days": 30 };
      const days = daysMap[filter];
      if (days !== undefined) {
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        if (days > 0) start.setDate(start.getDate() - days);
        query.createdAt = { $gte: start };
      }
    } else if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        query.createdAt.$lte = toDate;
      }
    }

    // Status filter
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate("user", "name email phone")
      .populate("items.product", "name category")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
// @access  Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Processing", "Printing", "Shipped", "Delivered", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "name email");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin dashboard stats
// @route   GET /api/orders/admin/stats
// @access  Admin
const getDashboardStats = async (req, res) => {
  try {
    const User = require("../models/User");

    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalProducts = await require("../models/Product").countDocuments();

    // Sum revenue only from completed orders
    const revenueResult = await Order.aggregate([
      { $match: { status: { $in: ["Completed", "Processing"] } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Order count by status
    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({ totalOrders, totalUsers, totalProducts, totalRevenue, statusCounts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getDashboardStats,
};
