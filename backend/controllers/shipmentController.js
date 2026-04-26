const axios = require("axios");
const Order = require("../models/Order");

const SHIPROCKET_BASE = "https://apiv2.shiprocket.in/v1/external";

// Get a fresh Shiprocket JWT token (valid 24h)
const getShiprocketToken = async () => {
  const { data } = await axios.post(`${SHIPROCKET_BASE}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });
  return data.token;
};

// @desc    Ship an order via Shiprocket
// @route   POST /api/shipment/:orderId
// @access  Admin
const shipOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user", "name email phone")
      .populate("items.product", "name");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.shipment?.trackingId) {
      return res.status(400).json({ message: "Order already shipped", shipment: order.shipment });
    }

    // Step 1: Get Shiprocket auth token
    const token = await getShiprocketToken();
    const headers = { Authorization: `Bearer ${token}` };

    // Step 2: Build order payload for Shiprocket
    const orderDate = new Date(order.createdAt).toISOString().split("T")[0];

    const srOrderPayload = {
      order_id: order._id.toString(),
      order_date: orderDate,
      pickup_location: "Primary",  // Configure pickup address in Shiprocket dashboard
      billing_customer_name: order.shippingAddress.fullName,
      billing_last_name: "",
      billing_address: order.shippingAddress.address,
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.pincode,
      billing_state: req.body.state || "Maharashtra",
      billing_country: "India",
      billing_email: order.user.email,
      billing_phone: order.shippingAddress.phone,
      shipping_is_billing: true,
      order_items: order.items.map((item) => ({
        name: item.name,
        sku: item.product?._id?.toString() || "SKU001",
        units: item.quantity,
        selling_price: item.price,
      })),
      payment_method: "COD",
      sub_total: order.totalPrice,
      length: req.body.length || 10,
      breadth: req.body.breadth || 10,
      height: req.body.height || 5,
      weight: req.body.weight || 0.5,
    };

    // Step 3: Create order on Shiprocket
    const { data: srOrder } = await axios.post(
      `${SHIPROCKET_BASE}/orders/create/adhoc`,
      srOrderPayload,
      { headers }
    );

    const shiprocketOrderId = srOrder.order_id;
    const shipmentId = srOrder.shipment_id;

    // Step 4: Generate AWB (tracking number) — auto assign best courier
    const { data: awbData } = await axios.post(
      `${SHIPROCKET_BASE}/courier/assign/awb`,
      { shipment_id: shipmentId },
      { headers }
    );

    const trackingId = awbData.response?.data?.awb_code || "";
    const courierName = awbData.response?.data?.courier_name || "";

    // Step 5: Save shipment details to our Order document
    order.shipment = {
      shiprocketOrderId: shiprocketOrderId?.toString(),
      shipmentId: shipmentId?.toString(),
      trackingId,
      courierName,
      shippedAt: new Date(),
    };
    order.status = "Shipped";
    await order.save();

    res.json({
      message: "Order shipped successfully via Shiprocket",
      shipment: order.shipment,
    });
  } catch (error) {
    // Surface the Shiprocket error message if available
    const msg =
      error.response?.data?.message ||
      error.response?.data?.errors ||
      error.message ||
      "Shiprocket API error";
    res.status(500).json({ message: msg });
  }
};

// @desc    Get shipment tracking info
// @route   GET /api/shipment/:orderId
// @access  Admin or Order Owner
const getShipmentInfo = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId).select("shipment status shippingAddress user");
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only owner or admin
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json({ shipment: order.shipment, status: order.status });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { shipOrder, getShipmentInfo };
