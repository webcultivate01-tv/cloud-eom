import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders } from "../features/orders/orderSlice";
import { Link } from "react-router-dom";

const STATUS_STYLES = {
  Pending:    { bg: "#fff8e1", color: "#f57f17", dot: "#f9a825" },
  Processing: { bg: "#e3f2fd", color: "#1565c0", dot: "#1e88e5" },
  Printing:   { bg: "#f3e5f5", color: "#6a1b9a", dot: "#8e24aa" },
  Shipped:    { bg: "#e8f5e9", color: "#1b5e20", dot: "#43a047" },
  Delivered:  { bg: "#e8f5e9", color: "#1b5e20", dot: "#2e7d32" },
  Cancelled:  { bg: "#ffebee", color: "#b71c1c", dot: "#e53935" },
};

export default function OrderHistory() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchMyOrders());
  }, [dispatch]);

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <p style={{ color: "#999" }}>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>My Orders</h1>
        <Link to="/products" style={s.shopBtn}>Continue Shopping</Link>
      </div>

      {orders.length === 0 ? (
        <div style={s.empty}>
          <span style={{ fontSize: "3.5rem" }}>📦</span>
          <h2 style={s.emptyTitle}>No orders yet</h2>
          <p style={s.emptyDesc}>You haven't placed any orders. Start shopping!</p>
          <Link to="/products" style={s.emptyBtn}>Browse Products</Link>
        </div>
      ) : (
        <div style={s.ordersList}>
          {orders.map((order) => {
            const st = STATUS_STYLES[order.status] || STATUS_STYLES.Pending;
            return (
              <div key={order._id} style={s.card}>
                {/* Card header */}
                <div style={s.cardTop}>
                  <div style={s.orderMeta}>
                    <p style={s.orderId}>Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p style={s.orderDate}>
                      Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ ...s.statusBadge, background: st.bg, color: st.color }}>
                      <span style={{ ...s.statusDot, background: st.dot }} />
                      {order.status}
                    </span>
                    <span style={s.totalPrice}>₹{order.totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                {/* Items */}
                <div style={s.itemsList}>
                  {order.items.map((item, i) => (
                    <div key={i} style={s.item}>
                      <img
                        src={item.product?.image || "https://placehold.co/64x64/f5f5f5/999?text=Item"}
                        alt={item.name}
                        style={s.itemImg}
                      />
                      <div style={s.itemInfo}>
                        <p style={s.itemName}>{item.name}</p>
                        <p style={s.itemQty}>Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                        {item.uploadedImage && (
                          <a href={item.uploadedImage} target="_blank" rel="noreferrer" style={s.viewDesign}>
                            🎨 View Custom Design ↗
                          </a>
                        )}
                      </div>
                      <p style={s.itemTotal}>₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Shipping + Tracking */}
                <div style={s.cardBottom}>
                  <p style={s.shippingInfo}>
                    📍 {order.shippingAddress?.address}, {order.shippingAddress?.city} – {order.shippingAddress?.pincode}
                  </p>
                  {order.shipment?.trackingId && (
                    <div style={s.trackingInfo}>
                      <span>🚚 {order.shipment.courierName}</span>
                      <span> · AWB: <strong style={{ color: "#1565c0" }}>{order.shipment.trackingId}</strong></span>
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div style={s.progressWrap}>
                  {["Pending", "Processing", "Printing", "Shipped", "Delivered"].map((st2, i) => {
                    const statusOrder = ["Pending", "Processing", "Printing", "Shipped", "Delivered"];
                    const currentIdx = statusOrder.indexOf(order.status);
                    const isDone = i <= currentIdx && order.status !== "Cancelled";
                    return (
                      <div key={st2} style={s.progressStep}>
                        <div style={{ ...s.progressDot, background: isDone ? "#c41230" : "#e0e0e0" }}>
                          {isDone && <span style={{ color: "#fff", fontSize: "0.6rem" }}>✓</span>}
                        </div>
                        <p style={{ ...s.progressLabel, color: isDone ? "#c41230" : "#bbb" }}>{st2}</p>
                        {i < 4 && <div style={{ ...s.progressLine, background: i < currentIdx && order.status !== "Cancelled" ? "#c41230" : "#e0e0e0" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { background: "#f7f7f7", minHeight: "80vh", padding: "32px 60px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  title: { fontSize: "1.6rem", fontWeight: "800", color: "#1a1a1a" },
  shopBtn: { background: "#fff", border: "1px solid #e0e0e0", color: "#333", padding: "8px 18px", borderRadius: "6px", fontWeight: "600", fontSize: "0.85rem" },
  empty: { background: "#fff", borderRadius: "12px", padding: "80px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" },
  emptyTitle: { fontSize: "1.4rem", fontWeight: "800", color: "#1a1a1a" },
  emptyDesc: { color: "#999", fontSize: "0.9rem" },
  emptyBtn: { background: "#c41230", color: "#fff", padding: "11px 28px", borderRadius: "6px", fontWeight: "700", marginTop: "8px" },
  ordersList: { display: "flex", flexDirection: "column", gap: "16px" },
  card: { background: "#fff", borderRadius: "12px", border: "1px solid #e0e0e0", overflow: "hidden" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "16px 20px", borderBottom: "1px solid #f0f0f0", flexWrap: "wrap", gap: "12px" },
  orderMeta: {},
  orderId: { fontWeight: "700", color: "#1a1a1a", fontSize: "0.9rem" },
  orderDate: { color: "#999", fontSize: "0.8rem", marginTop: "2px" },
  statusBadge: { display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700" },
  statusDot: { width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0 },
  totalPrice: { fontWeight: "800", color: "#c41230", fontSize: "1rem" },
  itemsList: { padding: "12px 20px", display: "flex", flexDirection: "column", gap: "12px" },
  item: { display: "flex", gap: "14px", alignItems: "center" },
  itemImg: { width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px", background: "#f5f5f5", flexShrink: 0 },
  itemInfo: { flex: 1 },
  itemName: { fontWeight: "600", color: "#1a1a1a", fontSize: "0.88rem" },
  itemQty: { color: "#999", fontSize: "0.8rem", marginTop: "2px" },
  viewDesign: { color: "#c41230", fontSize: "0.76rem", fontWeight: "600" },
  itemTotal: { fontWeight: "700", color: "#1a1a1a", fontSize: "0.88rem" },
  cardBottom: { padding: "10px 20px", background: "#f9f9f9", borderTop: "1px solid #f0f0f0" },
  shippingInfo: { color: "#666", fontSize: "0.8rem" },
  trackingInfo: { color: "#333", fontSize: "0.8rem", marginTop: "4px" },
  progressWrap: { display: "flex", alignItems: "flex-start", padding: "14px 20px 16px", gap: "0", overflowX: "auto" },
  progressStep: { display: "flex", flexDirection: "column", alignItems: "center", position: "relative", flex: 1 },
  progressDot: { width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px", flexShrink: 0, transition: "background 0.3s" },
  progressLabel: { fontSize: "0.68rem", fontWeight: "600", textAlign: "center", whiteSpace: "nowrap" },
  progressLine: { position: "absolute", top: "12px", left: "50%", width: "calc(100% - 24px)", height: "2px", transform: "translateX(12px)" },
};
