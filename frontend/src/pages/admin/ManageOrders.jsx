import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllOrders, updateOrderStatus } from "../../features/orders/orderSlice";
import { markOrderRefunded } from "../../features/payment/paymentSlice";
import { toast } from "react-toastify";
import api from "../../utils/api";

const STATUSES = ["Pending", "Processing", "Printing", "Shipped", "Delivered", "Cancelled"];

const STATUS_COLORS = {
  Pending: "#ffd700",
  Processing: "#87ceeb",
  Printing: "#c084fc",
  Shipped: "#60a5fa",
  Delivered: "#a8d8a8",
  Cancelled: "#e94560",
};

const DATE_FILTERS = [
  { label: "All", value: "" },
  { label: "Today", value: "today" },
  { label: "Last 3 Days", value: "3days" },
  { label: "Last 7 Days", value: "7days" },
  { label: "Last 30 Days", value: "30days" },
  { label: "Custom", value: "custom" },
];

export default function ManageOrders() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);

  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [shipForm, setShipForm] = useState({ state: "Maharashtra", length: 10, breadth: 10, height: 5, weight: 0.5 });
  const [refunding, setRefunding] = useState(null);

  const loadOrders = () => {
    const params = {};
    if (dateFilter && dateFilter !== "custom") params.filter = dateFilter;
    if (dateFilter === "custom" && fromDate) params.from = fromDate;
    if (dateFilter === "custom" && toDate) params.to = toDate;
    if (statusFilter) params.status = statusFilter;
    dispatch(fetchAllOrders(params));
  };

  useEffect(() => {
    loadOrders();
  }, [dateFilter, statusFilter, fromDate, toDate]);

  const handleStatusChange = async (orderId, status) => {
    const result = await dispatch(updateOrderStatus({ id: orderId, status }));
    if (!result.error) toast.success(`Status updated to "${status}"`);
    else toast.error("Failed to update status");
  };

  const handleRefund = async (orderId) => {
    if (!window.confirm("Mark this order as refunded and cancel it?")) return;
    setRefunding(orderId);
    const result = await dispatch(markOrderRefunded(orderId));
    setRefunding(null);
    if (!result.error) {
      toast.success("Order marked as refunded");
      loadOrders();
    } else {
      toast.error("Refund failed");
    }
  };

  const handleShipOrder = async (orderId) => {
    try {
      const { data } = await api.post(`/shipment/${orderId}`, shipForm);
      toast.success(`Shipped! Tracking: ${data.shipment.trackingId || "Assigned"}`);
      setShippingOrderId(null);
      loadOrders(); // refresh
    } catch (error) {
      toast.error(error.response?.data?.message || "Shiprocket error. Check credentials in .env");
    }
  };

  return (
    <div>
      <h1 style={styles.title}>📦 All Orders ({orders.length})</h1>

      {/* ── Filters ──────────────────────────────────── */}
      <div style={styles.filterBar}>
        {/* Date filter chips */}
        <div style={styles.chipRow}>
          {DATE_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              style={{ ...styles.chip, ...(dateFilter === value ? styles.activeChip : {}) }}
              onClick={() => setDateFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom date pickers */}
        {dateFilter === "custom" && (
          <div style={styles.datePickers}>
            <input type="date" style={styles.dateInput} value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <span style={{ color: "#aaa" }}>to</span>
            <input type="date" style={styles.dateInput} value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        )}

        {/* Status filter */}
        <select
          style={styles.statusSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* ── Orders List ──────────────────────────────── */}
      {loading ? (
        <p style={styles.msg}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <p style={styles.msg}>No orders found for this filter.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} style={styles.card}>
            {/* Header row */}
            <div style={styles.cardHeader}>
              <div>
                <p style={{ color: "#888", fontSize: "0.78rem", margin: 0 }}>Order ID</p>
                <p style={{ color: "#fff", fontFamily: "monospace", fontSize: "0.85rem", margin: "2px 0 0" }}>
                  {order._id}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ color: "#888", fontSize: "0.78rem", margin: 0 }}>
                  {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                </p>
                <p style={{ color: "#ffd700", fontWeight: "bold", margin: "2px 0 0" }}>
                  ₹{order.totalPrice.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Customer Info */}
            <div style={styles.customerRow}>
              <span style={{ color: "#87ceeb" }}>👤 {order.user?.name}</span>
              <span style={{ color: "#888" }}> — {order.user?.email}</span>
              <span style={{ color: "#888" }}> | 📞 {order.shippingAddress?.phone}</span>
            </div>
            <p style={{ color: "#888", fontSize: "0.82rem", margin: "4px 0 8px" }}>
              📍 {order.shippingAddress?.address}, {order.shippingAddress?.city} – {order.shippingAddress?.pincode}
            </p>

            {/* Payment Info Row */}
            <div style={styles.paymentRow}>
              <span style={{
                ...styles.payBadge,
                background: order.paymentStatus === "paid" ? "#1b4a1b" : order.paymentStatus === "refunded" ? "#3a1020" : "#2a2000",
                color: order.paymentStatus === "paid" ? "#a8d8a8" : order.paymentStatus === "refunded" ? "#e94560" : "#ffd700",
              }}>
                {order.paymentMethod === "razorpay" ? "💳 Razorpay" : "💵 COD"}
                {" · "}{order.paymentStatus?.toUpperCase()}
              </span>
              {order.razorpayPaymentId && (
                <span style={{ color: "#666", fontSize: "0.75rem" }}>
                  ID: <code style={{ color: "#87ceeb" }}>{order.razorpayPaymentId}</code>
                </span>
              )}
            </div>

            {/* Items */}
            <div style={styles.itemsSection}>
              {order.items.map((item, i) => (
                <div key={i} style={styles.item}>
                  <div>
                    <p style={{ color: "#fff", margin: 0, fontSize: "0.9rem" }}>{item.name}</p>
                    <p style={{ color: "#aaa", margin: 0, fontSize: "0.8rem" }}>
                      Qty: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  {item.uploadedImage ? (
                    <a href={item.uploadedImage} target="_blank" rel="noreferrer" style={styles.viewImgBtn}>
                      View Custom Image ↗
                    </a>
                  ) : (
                    <span style={{ color: "#444", fontSize: "0.78rem" }}>No custom image</span>
                  )}
                </div>
              ))}
            </div>

            {/* Note */}
            {order.customerNote && (
              <p style={{ color: "#ffd700", fontSize: "0.83rem", margin: "8px 0 0" }}>
                📝 {order.customerNote}
              </p>
            )}

            {/* Shipment Info */}
            {order.shipment?.trackingId && (
              <div style={styles.shipmentInfo}>
                <span>🚚 <strong>{order.shipment.courierName}</strong></span>
                <span> · AWB: <code style={{ color: "#87ceeb" }}>{order.shipment.trackingId}</code></span>
                {order.shipment.shippedAt && (
                  <span style={{ color: "#888", fontSize: "0.8rem" }}>
                    {" "}· Shipped {new Date(order.shipment.shippedAt).toLocaleDateString("en-IN")}
                  </span>
                )}
              </div>
            )}

            {/* Bottom row: status + actions */}
            <div style={styles.bottomRow}>
              {/* Status badge + changer */}
              <div style={styles.statusRow}>
                <span style={{ ...styles.statusBadge, background: STATUS_COLORS[order.status] || "#888" }}>
                  {order.status}
                </span>
                <select
                  style={styles.statusDropdown}
                  value={order.status}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Refund button — only for paid Razorpay orders */}
              {order.paymentMethod === "razorpay" && order.paymentStatus === "paid" && order.status !== "Cancelled" && (
                <button
                  style={styles.refundBtn}
                  disabled={refunding === order._id}
                  onClick={() => handleRefund(order._id)}
                >
                  {refunding === order._id ? "Processing..." : "↩ Mark Refunded"}
                </button>
              )}

              {/* Ship via Shiprocket */}
              {!order.shipment?.trackingId && order.status !== "Cancelled" && (
                <div>
                  {shippingOrderId === order._id ? (
                    <div style={styles.shipForm}>
                      <p style={{ color: "#ffd700", margin: "0 0 8px", fontSize: "0.85rem" }}>
                        📦 Shipment Details (Shiprocket)
                      </p>
                      <div style={styles.shipFormRow}>
                        <input style={styles.shipInput} placeholder="State" value={shipForm.state} onChange={(e) => setShipForm({ ...shipForm, state: e.target.value })} />
                        <input style={styles.shipInput} type="number" placeholder="Length cm" value={shipForm.length} onChange={(e) => setShipForm({ ...shipForm, length: e.target.value })} />
                        <input style={styles.shipInput} type="number" placeholder="Breadth cm" value={shipForm.breadth} onChange={(e) => setShipForm({ ...shipForm, breadth: e.target.value })} />
                        <input style={styles.shipInput} type="number" placeholder="Height cm" value={shipForm.height} onChange={(e) => setShipForm({ ...shipForm, height: e.target.value })} />
                        <input style={styles.shipInput} type="number" step="0.1" placeholder="Weight kg" value={shipForm.weight} onChange={(e) => setShipForm({ ...shipForm, weight: e.target.value })} />
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button style={styles.confirmShipBtn} onClick={() => handleShipOrder(order._id)}>
                          ✅ Confirm & Ship
                        </button>
                        <button style={styles.cancelBtn} onClick={() => setShippingOrderId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      style={styles.shipBtn}
                      onClick={() => setShippingOrderId(order._id)}
                    >
                      🚚 Ship via Shiprocket
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const styles = {
  title: { color: "#fff", fontSize: "1.4rem", marginBottom: "20px" },
  filterBar: { background: "#1a1a3a", borderRadius: "10px", padding: "16px", marginBottom: "20px", display: "flex", flexDirection: "column", gap: "12px" },
  chipRow: { display: "flex", flexWrap: "wrap", gap: "8px" },
  chip: { padding: "6px 14px", borderRadius: "20px", border: "1px solid #333", background: "transparent", color: "#aaa", cursor: "pointer", fontSize: "0.82rem" },
  activeChip: { background: "#e94560", color: "#fff", border: "1px solid #e94560" },
  datePickers: { display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" },
  dateInput: { padding: "6px 10px", borderRadius: "6px", border: "1px solid #333", background: "#0d0d1a", color: "#fff", fontSize: "0.85rem" },
  statusSelect: { background: "#0d0d1a", color: "#fff", border: "1px solid #444", borderRadius: "6px", padding: "6px 12px", cursor: "pointer", fontSize: "0.85rem", alignSelf: "flex-start" },
  msg: { color: "#aaa", textAlign: "center", padding: "60px" },
  card: { background: "#1a1a3a", borderRadius: "12px", padding: "18px", marginBottom: "16px" },
  cardHeader: { display: "flex", justifyContent: "space-between", marginBottom: "10px", flexWrap: "wrap", gap: "8px" },
  customerRow: { marginBottom: "4px", flexWrap: "wrap", wordBreak: "break-word" },
  itemsSection: { borderTop: "1px solid #2a2a4e", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" },
  item: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "6px" },
  viewImgBtn: { border: "1px solid #a8d8a8", color: "#a8d8a8", padding: "4px 10px", borderRadius: "4px", textDecoration: "none", fontSize: "0.78rem", whiteSpace: "nowrap" },
  shipmentInfo: { background: "#0d1a2e", borderRadius: "6px", padding: "8px 12px", marginTop: "10px", fontSize: "0.85rem", color: "#ccc" },
  bottomRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "14px", flexWrap: "wrap", gap: "12px" },
  statusRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  statusBadge: { color: "#1a1a2e", padding: "4px 12px", borderRadius: "20px", fontWeight: "bold", fontSize: "0.82rem" },
  statusDropdown: { background: "#0d0d1a", color: "#fff", border: "1px solid #444", borderRadius: "6px", padding: "5px 10px", cursor: "pointer", fontSize: "0.82rem" },
  shipBtn: { background: "#1a4a7a", border: "none", color: "#87ceeb", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", fontSize: "0.85rem" },
  shipForm: { background: "#0d1a2e", borderRadius: "8px", padding: "12px" },
  shipFormRow: { display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "10px" },
  shipInput: { padding: "6px 10px", borderRadius: "4px", border: "1px solid #333", background: "#1a1a3a", color: "#fff", fontSize: "0.82rem", width: "100px", boxSizing: "border-box" },
  confirmShipBtn: { background: "#2a7a2a", border: "none", color: "#fff", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "bold" },
  cancelBtn: { background: "#333", border: "none", color: "#aaa", padding: "7px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.82rem" },
  paymentRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px", flexWrap: "wrap" },
  payBadge: { padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "700" },
  refundBtn: { background: "#2a0a14", border: "1px solid #e94560", color: "#e94560", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.8rem", fontWeight: "600" },
};
