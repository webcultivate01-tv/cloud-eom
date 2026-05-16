import { createSlice } from "@reduxjs/toolkit";

// Composite key — same product in different sizes are SEPARATE cart entries.
export const makeCartKey = (id, size) => `${id}__${size || ""}`;

// Load cart from localStorage so it persists across refreshes
const savedCart = localStorage.getItem("cart")
  ? JSON.parse(localStorage.getItem("cart"))
  : [];

const saveCart = (items) => localStorage.setItem("cart", JSON.stringify(items));

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    items: savedCart,
  },
  reducers: {
    // Add item or increase quantity if same product+size is already in cart
    addToCart: (state, action) => {
      const { _id, size = "", quantity = 1 } = action.payload;
      const key = makeCartKey(_id, size);
      const existing = state.items.find((item) => makeCartKey(item._id, item.size) === key);
      if (existing) {
        existing.quantity += quantity;
      } else {
        state.items.push({ ...action.payload, size, quantity, cartKey: key });
      }
      saveCart(state.items);
    },

    // Remove a specific cart entry by its composite key
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => makeCartKey(item._id, item.size) !== action.payload);
      saveCart(state.items);
    },

    // Update quantity for a specific cart entry (identified by composite key)
    updateQuantity: (state, action) => {
      const { key, quantity } = action.payload;
      const item = state.items.find((i) => makeCartKey(i._id, i.size) === key);
      if (item) {
        item.quantity = quantity;
        if (item.quantity <= 0) {
          state.items = state.items.filter((i) => makeCartKey(i._id, i.size) !== key);
        }
      }
      saveCart(state.items);
    },

    // Attach a custom image URL to a specific cart entry
    setItemImage: (state, action) => {
      const { key, imageUrl } = action.payload;
      const item = state.items.find((i) => makeCartKey(i._id, i.size) === key);
      if (item) item.uploadedImage = imageUrl;
      saveCart(state.items);
    },

    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem("cart");
    },
  },
});

// Selectors
export const selectCartTotal = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartCount = (state) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);

export const { addToCart, removeFromCart, updateQuantity, setItemImage, clearCart } =
  cartSlice.actions;
export default cartSlice.reducer;
