const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  uploadedImage: { type: String, default: "" },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],

    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      pincode: { type: String, required: true },
    },

    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },

    // Extended lifecycle — Printing added for printing businesses
    status: {
      type: String,
      enum: ["Pending", "Processing", "Printing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },

    customerNote: {
      type: String,
      default: "",
    },

    // Filled when admin ships via Shiprocket
    shipment: {
      shiprocketOrderId: { type: String, default: "" },
      shipmentId: { type: String, default: "" },
      trackingId: { type: String, default: "" },   // AWB number
      courierName: { type: String, default: "" },
      shippedAt: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
