import { useDispatch, useSelector } from "react-redux";
import { removeFromCart, updateQuantity, selectCartTotal } from "../features/cart/cartSlice";
import { useNavigate, Link } from "react-router-dom";

export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const total = useSelector(selectCartTotal);
  const { user } = useSelector((state) => state.auth);

  if (items.length === 0) {
    return (
      <div style={s.empty}>
        <span style={{ fontSize: "4rem" }}>🛒</span>
        <h2 style={s.emptyTitle}>Your cart is empty</h2>
        <p style={s.emptyDesc}>Looks like you haven't added any products yet.</p>
        <Link to="/products" style={s.shopBtn}>Start Shopping</Link>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>Shopping Cart</h1>
        <span style={s.count}>{items.length} {items.length === 1 ? "item" : "items"}</span>
      </div>

      <div style={s.layout}>
        {/* Items */}
        <div style={s.itemsCol}>
          {/* Column labels */}
          <div style={s.tableHead}>
            <span style={{ flex: 2 }}>Product</span>
            <span style={{ width: "120px", textAlign: "center" }}>Quantity</span>
            <span style={{ width: "100px", textAlign: "right" }}>Total</span>
            <span style={{ width: "60px" }} />
          </div>

          {items.map((item) => (
            <div key={item._id} style={s.item}>
              <div style={s.itemLeft}>
                <img
                  src={item.image || "https://placehold.co/80x80/f5f5f5/999?text=Item"}
                  alt={item.name}
                  style={s.itemImg}
                  onClick={() => navigate(`/products/${item._id}`)}
                />
                <div>
                  <p style={s.itemName} onClick={() => navigate(`/products/${item._id}`)}>{item.name}</p>
                  <p style={s.itemCategory}>{item.category}</p>
                  <p style={s.itemPrice}>₹{item.price.toLocaleString()} each</p>
                  {item.requiresCustomImage && !item.uploadedImage && (
                    <p style={s.imageWarning}>⚠️ Custom image required at checkout</p>
                  )}
                  {item.uploadedImage && (
                    <p style={s.imageReady}>✅ Custom image ready</p>
                  )}
                </div>
              </div>

              {/* Qty control */}
              <div style={s.qtyControl}>
                <button style={s.qtyBtn} onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity - 1 }))}>−</button>
                <span style={s.qtyVal}>{item.quantity}</span>
                <button style={s.qtyBtn} onClick={() => dispatch(updateQuantity({ id: item._id, quantity: item.quantity + 1 }))}>+</button>
              </div>

              {/* Line total */}
              <p style={s.lineTotal}>₹{(item.price * item.quantity).toLocaleString()}</p>

              {/* Remove */}
              <button style={s.removeBtn} onClick={() => dispatch(removeFromCart(item._id))}>✕</button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={s.summary}>
          <h2 style={s.summaryTitle}>Order Summary</h2>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Subtotal</span>
            <span style={s.summaryVal}>₹{total.toLocaleString()}</span>
          </div>
          <div style={s.summaryRow}>
            <span style={s.summaryLabel}>Shipping</span>
            <span style={{ color: "#2e7d32", fontWeight: "600" }}>FREE</span>
          </div>
          <div style={s.divider} />
          <div style={s.summaryRow}>
            <span style={{ fontWeight: "800", fontSize: "1rem", color: "#1a1a1a" }}>Total</span>
            <span style={s.totalVal}>₹{total.toLocaleString()}</span>
          </div>

          <button
            style={s.checkoutBtn}
            onClick={() => user ? navigate("/checkout") : navigate("/login")}
          >
            {user ? "Proceed to Checkout" : "Login to Checkout"}
          </button>
          <Link to="/products" style={s.continueLink}>← Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { background: "#fff", maxWidth: "1200px", margin: "0 auto", padding: "32px 40px 60px" },
  header: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", paddingBottom: "16px", borderBottom: "2px solid #e0e0e0" },
  title: { fontSize: "1.6rem", fontWeight: "800", color: "#1a1a1a" },
  count: { background: "#f0f0f0", color: "#666", padding: "4px 12px", borderRadius: "20px", fontSize: "0.85rem", fontWeight: "600" },
  layout: { display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" },
  itemsCol: { flex: 1, minWidth: "400px" },
  tableHead: { display: "flex", alignItems: "center", gap: "16px", padding: "0 0 10px", borderBottom: "1px solid #e0e0e0", color: "#999", fontSize: "0.78rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" },
  item: { display: "flex", alignItems: "center", gap: "16px", padding: "16px 0", borderBottom: "1px solid #f0f0f0" },
  itemLeft: { display: "flex", gap: "14px", flex: 2 },
  itemImg: { width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", background: "#f5f5f5", cursor: "pointer", flexShrink: 0 },
  itemName: { color: "#1a1a1a", fontWeight: "700", fontSize: "0.9rem", cursor: "pointer", marginBottom: "2px" },
  itemCategory: { color: "#999", fontSize: "0.75rem", marginBottom: "4px" },
  itemPrice: { color: "#666", fontSize: "0.82rem" },
  imageWarning: { color: "#e65100", fontSize: "0.76rem", fontWeight: "600", marginTop: "4px" },
  imageReady: { color: "#2e7d32", fontSize: "0.76rem", fontWeight: "600", marginTop: "4px" },
  qtyControl: { display: "flex", alignItems: "center", border: "1px solid #e0e0e0", borderRadius: "4px", overflow: "hidden", width: "120px" },
  qtyBtn: { background: "#f5f5f5", border: "none", width: "36px", height: "36px", fontSize: "1.1rem", cursor: "pointer", color: "#333" },
  qtyVal: { flex: 1, textAlign: "center", fontWeight: "700", fontSize: "0.9rem" },
  lineTotal: { width: "100px", textAlign: "right", fontWeight: "700", color: "#1a1a1a" },
  removeBtn: { width: "60px", background: "none", border: "none", color: "#ccc", fontSize: "1rem", cursor: "pointer", transition: "color 0.2s", textAlign: "right" },
  summary: { width: "320px", background: "#f7f7f7", borderRadius: "12px", padding: "24px", position: "sticky", top: "120px" },
  summaryTitle: { fontSize: "1.1rem", fontWeight: "800", color: "#1a1a1a", marginBottom: "20px" },
  summaryRow: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" },
  summaryLabel: { color: "#666", fontSize: "0.88rem" },
  summaryVal: { color: "#1a1a1a", fontWeight: "600", fontSize: "0.88rem" },
  divider: { height: "1px", background: "#e0e0e0", margin: "16px 0" },
  totalVal: { color: "#c41230", fontWeight: "800", fontSize: "1.2rem" },
  checkoutBtn: { width: "100%", padding: "14px", background: "#c41230", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", marginTop: "20px", letterSpacing: "0.5px", transition: "background 0.2s" },
  continueLink: { display: "block", textAlign: "center", color: "#c41230", fontWeight: "600", fontSize: "0.85rem", marginTop: "12px" },
  empty: { background: "#fff", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", padding: "60px" },
  emptyTitle: { fontSize: "1.5rem", fontWeight: "800", color: "#1a1a1a" },
  emptyDesc: { color: "#999", fontSize: "0.9rem" },
  shopBtn: { background: "#c41230", color: "#fff", padding: "12px 32px", borderRadius: "6px", fontWeight: "700", marginTop: "12px" },
};
