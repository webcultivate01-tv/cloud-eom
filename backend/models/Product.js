const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    subcategory: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    images: {
      type: [String],
      default: [],
    },
    stock: {
      type: Number,
      default: 100,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    // true  → customer sees the image upload field
    allowCustomImage: {
      type: Boolean,
      default: false,
    },
    // true  → order CANNOT be placed without uploading a custom image
    // Only relevant when allowCustomImage is true
    requiresCustomImage: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
