import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders, requestCancelOTP, cancelOrder } from "../features/orders/orderSlice";
import { toast } from "react-toastify";
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

  // OTP modal state
  const [otpModal, setOtpModal]   = useState(null);  // order object being cancelled
  const [otp, setOtp]             = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying]   = useState(false);
  const [otpSent, setOtpSent]       = useState(false); // whether OTP was sent

  const closeModal = () => { setOtpModal(null); setOtp(""); setOtpSent(false); };

  // Step 1 — user clicks Cancel → send OTP email
  const handleRequestOTP = async (order) => {
    setOtpModal(order);
    setOtp("");
    setOtpSent(false);
    setSendingOtp(true);
    const result = await dispatch(requestCancelOTP(order._id));
    setSendingOtp(false);
    if (!result.error) {
      setOtpSent(true);
      toast.success(result.payload?.message || "OTP sent to your email");
    } else {
      toast.error(result.payload || "Failed to send OTP");
      setOtpModal(null);
    }
  };

  // Step 2 — user submits OTP → cancel order
  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setVerifying(true);
    const result = await dispatch(cancelOrder({ id: otpModal._id, otp: otp.trim() }));
    setVerifying(false);
    if (!result.error) {
      toast.success("Order cancelled successfully");
      closeModal();
    } else {
      toast.error(result.payload || "Invalid OTP. Try again.");
    }
  };

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

      {/* ── OTP Cancellation Modal ─────────────────────────── */}
      {otpModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            {/* Close */}
            <button style={s.modalClose} onClick={closeModal}>✕</button>

            <div style={s.modalIcon}>🔐</div>
            <h2 style={s.modalTitle}>Verify to Cancel Order</h2>
            <p style={s.modalSub}>
              Order <strong>#{otpModal._id.slice(-8).toUpperCase()}</strong> · ₹{otpModal.totalPrice?.toLocaleString()}
            </p>

            {sendingOtp ? (
              <p style={s.modalInfo}>📨 Sending OTP to your registered email…</p>
            ) : otpSent ? (
              <form onSubmit={handleConfirmCancel}>
                <p style={s.modalInfo}>
                  A 6-digit OTP has been sent to your registered email address.
                  Enter it below to confirm cancellation.
                </p>

                {/* 6-box OTP input */}
                <div style={s.otpBoxRow}>
                  {[0,1,2,3,4,5].map((i) => (
                    <input
                      key={i}
                      id={`otp-box-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      style={s.otpBox}
                      value={otp[i] || ""}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/, "");
                        const arr = otp.split("");
                        arr[i] = val;
                        setOtp(arr.join("").slice(0, 6));
                        if (val && i < 5) document.getElementById(`otp-box-${i + 1}`)?.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i] && i > 0)
                          document.getElementById(`otp-box-${i - 1}`)?.focus();
                      }}
                    />
                  ))}
                </div>

                <div style={s.modalActions}>
                  <button type="button" style={s.modalResendBtn}
                    onClick={() => handleRequestOTP(otpModal)} disabled={sendingOtp}>
                    Resend OTP
                  </button>
                  <button type="submit" style={s.modalConfirmBtn} disabled={verifying || otp.length < 6}>
                    {verifying ? "Verifying…" : "Confirm Cancel"}
                  </button>
                </div>

                <p style={s.modalExpiry}>⏱ OTP expires in 10 minutes</p>
              </form>
            ) : null}
          </div>
        </div>
      )}

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
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{ ...s.statusBadge, background: st.bg, color: st.color }}>
                      <span style={{ ...s.statusDot, background: st.dot }} />
                      {order.status}
                    </span>
                    {/* Payment badge */}
                    <span style={{
                      ...s.payBadge,
                      background: order.paymentStatus === "paid" ? "#e8f5e9" : order.paymentStatus === "refunded" ? "#ffebee" : "#fff8e1",
                      color: order.paymentStatus === "paid" ? "#2e7d32" : order.paymentStatus === "refunded" ? "#c62828" : "#e65100",
                    }}>
                      {order.paymentMethod === "razorpay" ? "💳" : "💵"}
                      {" "}{order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Pending"}
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

                {/* Cancel button — only for Pending or Processing orders */}
                {["Pending", "Processing"].includes(order.status) && (
                  <div style={s.cancelRow}>
                    <button
                      style={s.cancelBtn}
                      onClick={() => handleRequestOTP(order)}
                    >
                      ✕ Cancel Order
                    </button>
                    <p style={s.cancelNote}>Email OTP verification required · Printing / Shipped orders cannot be cancelled.</p>
                  </div>
                )}

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
  payBadge: { padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700" },
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
  cancelRow: { padding: "10px 20px", display: "flex", alignItems: "center", gap: "14px", borderTop: "1px solid #f0f0f0", background: "#fff9f9" },
  cancelBtn: { background: "#fff", border: "1.5px solid #c41230", color: "#c41230", padding: "7px 18px", borderRadius: "6px", fontWeight: "700", fontSize: "0.82rem", cursor: "pointer", whiteSpace: "nowrap" },
  cancelNote: { color: "#bbb", fontSize: "0.75rem", margin: 0 },

  // OTP Modal
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
  modal: { background: "#fff", borderRadius: "16px", padding: "36px 32px", maxWidth: "420px", width: "100%", position: "relative", textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" },
  modalClose: { position: "absolute", top: "14px", right: "16px", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#999", fontWeight: "700" },
  modalIcon: { fontSize: "2.8rem", marginBottom: "10px" },
  modalTitle: { fontSize: "1.2rem", fontWeight: "800", color: "#1a1a1a", marginBottom: "6px" },
  modalSub: { color: "#888", fontSize: "0.85rem", marginBottom: "20px" },
  modalInfo: { color: "#555", fontSize: "0.88rem", lineHeight: "1.6", marginBottom: "20px", background: "#f7f7f7", padding: "12px 14px", borderRadius: "8px" },
  otpBoxRow: { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "24px" },
  otpBox: { width: "44px", height: "52px", textAlign: "center", fontSize: "1.4rem", fontWeight: "800", border: "2px solid #e0e0e0", borderRadius: "8px", outline: "none", color: "#1a1a1a", caretColor: "#c41230" },
  modalActions: { display: "flex", gap: "10px", justifyContent: "center", marginBottom: "12px" },
  modalResendBtn: { background: "#fff", border: "1.5px solid #c41230", color: "#c41230", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.85rem" },
  modalConfirmBtn: { background: "#c41230", border: "none", color: "#fff", padding: "10px 22px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "0.85rem" },
  modalExpiry: { color: "#bbb", fontSize: "0.75rem", margin: 0 },
  shippingInfo: { color: "#666", fontSize: "0.8rem" },
  trackingInfo: { color: "#333", fontSize: "0.8rem", marginTop: "4px" },
  progressWrap: { display: "flex", alignItems: "flex-start", padding: "14px 20px 16px", gap: "0", overflowX: "auto" },
  progressStep: { display: "flex", flexDirection: "column", alignItems: "center", position: "relative", flex: 1 },
  progressDot: { width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "4px", flexShrink: 0, transition: "background 0.3s" },
  progressLabel: { fontSize: "0.68rem", fontWeight: "600", textAlign: "center", whiteSpace: "nowrap" },
  progressLine: { position: "absolute", top: "12px", left: "50%", width: "calc(100% - 24px)", height: "2px", transform: "translateX(12px)" },
};
