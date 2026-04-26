import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllOrders, updateOrderStatus } from "../../features/orders/orderSlice";
import { markOrderRefunded } from "../../features/payment/paymentSlice";
import { toast } from "react-toastify";
import api from "../../utils/api";

const STATUSES = ["Pending", "Processing", "Printing", "Shipped", "Delivered", "Cancelled"];

const STATUS_CFG = {
  Pending:    { cls: "bg-amber-100 text-amber-700",   dot: "bg-amber-400" },
  Processing: { cls: "bg-blue-100 text-blue-700",     dot: "bg-blue-400" },
  Printing:   { cls: "bg-violet-100 text-violet-700", dot: "bg-violet-400" },
  Shipped:    { cls: "bg-sky-100 text-sky-700",       dot: "bg-sky-400" },
  Delivered:  { cls: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-400" },
  Cancelled:  { cls: "bg-red-100 text-red-600",       dot: "bg-red-400" },
};

const DATE_FILTERS = [
  { label: "All",        value: "" },
  { label: "Today",      value: "today" },
  { label: "Last 3 Days",value: "3days" },
  { label: "Last 7 Days",value: "7days" },
  { label: "Last 30 Days",value: "30days" },
  { label: "Custom",     value: "custom" },
];

export default function ManageOrders() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);

  const [dateFilter, setDateFilter]     = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate]         = useState("");
  const [toDate, setToDate]             = useState("");
  const [shippingOrderId, setShippingOrderId] = useState(null);
  const [shipForm, setShipForm] = useState({ state: "Maharashtra", length: 10, breadth: 10, height: 5, weight: 0.5 });
  const [refunding, setRefunding] = useState(null);

  const loadOrders = () => {
    const params = {};
    if (dateFilter && dateFilter !== "custom") params.filter = dateFilter;
    if (dateFilter === "custom" && fromDate)   params.from = fromDate;
    if (dateFilter === "custom" && toDate)     params.to   = toDate;
    if (statusFilter)                          params.status = statusFilter;
    dispatch(fetchAllOrders(params));
  };

  useEffect(() => { loadOrders(); }, [dateFilter, statusFilter, fromDate, toDate]);

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
    if (!result.error) { toast.success("Order marked as refunded"); loadOrders(); }
    else toast.error("Refund failed");
  };

  const handleShipOrder = async (orderId) => {
    try {
      const { data } = await api.post(`/shipment/${orderId}`, shipForm);
      toast.success(`Shipped! Tracking: ${data.shipment.trackingId || "Assigned"}`);
      setShippingOrderId(null);
      loadOrders();
    } catch (err) {
      toast.error(err.response?.data?.message || "Shiprocket error. Check credentials in .env");
    }
  };

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">All Orders</h1>
          <p className="text-slate-400 text-sm mt-0.5">{orders.length} orders found</p>
        </div>
        <button onClick={loadOrders} className="admin-btn admin-btn-ghost text-xs">
          ↻ Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 mb-5">
        {/* Date pill filters */}
        <div className="flex flex-wrap gap-2 mb-3">
          {DATE_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setDateFilter(value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                dateFilter === value
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Custom date range */}
        {dateFilter === "custom" && (
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <input type="date" className="admin-input !w-auto" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <span className="text-slate-400 text-sm font-medium">→</span>
            <input type="date" className="admin-input !w-auto" value={toDate}   onChange={(e) => setToDate(e.target.value)} />
          </div>
        )}

        {/* Status filter */}
        <select
          className="admin-input !w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="admin-card p-16 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-slate-500 font-medium">No orders found for this filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => {
            const cfg = STATUS_CFG[order.status] || { cls: "bg-slate-100 text-slate-600", dot: "bg-slate-400" };
            return (
              <div key={order._id} className="admin-card hover:shadow-card-hover transition-shadow duration-200">
                {/* Card top stripe by status */}
                <div className={`h-1 w-full ${cfg.dot} rounded-t-2xl`} />

                <div className="p-5">
                  {/* Header row */}
                  <div className="flex justify-between flex-wrap gap-2 mb-4">
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-0.5">Order ID</p>
                      <p className="font-mono text-sm text-slate-700 font-semibold">{order._id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 mb-0.5">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </p>
                      <p className="font-black text-slate-900 text-lg">₹{order.totalPrice.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl mb-4">
                    <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {order.user?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{order.user?.name}</p>
                      <p className="text-xs text-slate-500 truncate">{order.user?.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        📞 {order.shippingAddress?.phone} &nbsp;·&nbsp;
                        📍 {order.shippingAddress?.address}, {order.shippingAddress?.city} — {order.shippingAddress?.pincode}
                      </p>
                    </div>
                  </div>

                  {/* Payment badge */}
                  <div className="flex items-center gap-2 flex-wrap mb-4">
                    <span className={`status-badge ${
                      order.paymentStatus === "paid"     ? "bg-emerald-100 text-emerald-700" :
                      order.paymentStatus === "refunded" ? "bg-red-100 text-red-600"         :
                                                           "bg-amber-100 text-amber-700"
                    }`}>
                      {order.paymentMethod === "razorpay" ? "💳 Razorpay" : "💵 COD"}
                      {" · "}{order.paymentStatus?.toUpperCase()}
                    </span>
                    {order.razorpayPaymentId && (
                      <span className="text-xs text-slate-400 font-mono">
                        ID: <span className="text-indigo-500">{order.razorpayPaymentId}</span>
                      </span>
                    )}
                  </div>

                  {/* Items */}
                  <div className="border-t border-slate-100 pt-3 flex flex-col gap-2 mb-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400">Qty: {item.quantity} × ₹{item.price}</p>
                        </div>
                        {item.uploadedImage ? (
                          <a
                            href={item.uploadedImage} target="_blank" rel="noreferrer"
                            className="text-xs border border-emerald-200 text-emerald-600 px-2.5 py-1 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
                          >
                            View Design ↗
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">No custom image</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {order.customerNote && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 mb-3">
                      <span className="mt-0.5">📝</span>
                      <span>{order.customerNote}</span>
                    </div>
                  )}

                  {order.shipment?.trackingId && (
                    <div className="flex items-start gap-2 bg-sky-50 border border-sky-100 rounded-xl px-3 py-2.5 text-sm text-sky-700 mb-3">
                      <span>🚚</span>
                      <div>
                        <span className="font-semibold">{order.shipment.courierName}</span>
                        {" · "}AWB: <code className="font-mono text-xs">{order.shipment.trackingId}</code>
                        {order.shipment.shippedAt && (
                          <span className="text-xs text-sky-400 ml-1">
                            · {new Date(order.shipment.shippedAt).toLocaleDateString("en-IN")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bottom action row */}
                  <div className="flex flex-wrap gap-3 items-start pt-3 border-t border-slate-100">
                    {/* Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`status-badge ${cfg.cls} flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {order.status}
                      </span>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="admin-input !w-auto !py-1.5 !text-xs"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Refund */}
                    {order.paymentMethod === "razorpay" && order.paymentStatus === "paid" && order.status !== "Cancelled" && (
                      <button
                        disabled={refunding === order._id}
                        onClick={() => handleRefund(order._id)}
                        className="admin-btn admin-btn-danger !py-1.5 !text-xs disabled:opacity-50"
                      >
                        {refunding === order._id ? "Processing…" : "↩ Mark Refunded"}
                      </button>
                    )}

                    {/* Shiprocket */}
                    {!order.shipment?.trackingId && order.status !== "Cancelled" && (
                      shippingOrderId === order._id ? (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 w-full mt-1">
                          <p className="text-xs font-bold text-indigo-700 mb-3 flex items-center gap-1.5">📦 Shipment Details (Shiprocket)</p>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {[
                              { key: "state",   placeholder: "State",       type: "text" },
                              { key: "length",  placeholder: "Length (cm)", type: "number" },
                              { key: "breadth", placeholder: "Breadth (cm)",type: "number" },
                              { key: "height",  placeholder: "Height (cm)", type: "number" },
                              { key: "weight",  placeholder: "Weight (kg)", type: "number", step: "0.1" },
                            ].map(({ key, placeholder, type, step }) => (
                              <input
                                key={key} type={type} step={step} placeholder={placeholder}
                                value={shipForm[key]}
                                onChange={(e) => setShipForm({ ...shipForm, [key]: e.target.value })}
                                className="admin-input !w-36 !py-1.5 !text-xs"
                              />
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleShipOrder(order._id)} className="admin-btn admin-btn-success !py-1.5 !text-xs">
                              ✅ Confirm & Ship
                            </button>
                            <button onClick={() => setShippingOrderId(null)} className="admin-btn admin-btn-ghost !py-1.5 !text-xs">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShippingOrderId(order._id)}
                          className="admin-btn bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 !py-1.5 !text-xs"
                        >
                          🚚 Ship via Shiprocket
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
