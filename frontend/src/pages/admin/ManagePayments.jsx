import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllPayments, fetchPaymentStats, markOrderRefunded } from "../../features/payment/paymentSlice";
import { toast } from "react-toastify";
import {
  CreditCard, Banknote, IndianRupee, Search, RefreshCw, Filter,
  CheckCircle2, XCircle, Clock, Copy, User, Mail, Phone, Hash, Calendar,
} from "lucide-react";

const METHOD_FILTERS = [
  { label: "All",     value: "" },
  { label: "Online",  value: "razorpay" },
  { label: "COD",     value: "cod" },
];

const STATUS_FILTERS = [
  { label: "All Statuses", value: "" },
  { label: "Paid",         value: "paid" },
  { label: "Pending",      value: "pending" },
  { label: "Failed",       value: "failed" },
  { label: "Refunded",     value: "refunded" },
];

const statusCfg = (s) => {
  switch (s) {
    case "paid":     return { cls: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", Icon: CheckCircle2 };
    case "refunded": return { cls: "bg-red-100 text-red-600 border-red-200",             dot: "bg-red-500",     Icon: XCircle };
    case "failed":   return { cls: "bg-rose-100 text-rose-700 border-rose-200",          dot: "bg-rose-500",    Icon: XCircle };
    default:         return { cls: "bg-amber-100 text-amber-700 border-amber-200",       dot: "bg-amber-500",   Icon: Clock };
  }
};

export default function ManagePayments() {
  const dispatch = useDispatch();
  const { payments, stats, loading } = useSelector((s) => s.payment);

  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [refunding, setRefunding] = useState(null);

  const load = () => {
    const params = {};
    if (method) params.method = method;
    if (status) params.status = status;
    dispatch(fetchAllPayments(params));
  };

  useEffect(() => { load(); dispatch(fetchPaymentStats()); }, [method, status]);

  const handleCopy = (text, label = "Copied") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const handleRefund = async (orderId) => {
    if (!window.confirm("Mark this payment as refunded? The order will also be cancelled.")) return;
    setRefunding(orderId);
    const result = await dispatch(markOrderRefunded(orderId));
    setRefunding(null);
    if (!result.error) {
      toast.success("Marked as refunded");
      load();
      dispatch(fetchPaymentStats());
    } else {
      toast.error("Refund failed");
    }
  };

  // Client-side search across customer name / email / payment id / order id
  const filtered = useMemo(() => {
    if (!search.trim()) return payments;
    const q = search.trim().toLowerCase();
    return payments.filter((p) =>
      (p.user?.name || "").toLowerCase().includes(q) ||
      (p.user?.email || "").toLowerCase().includes(q) ||
      (p.user?.phone || "").toLowerCase().includes(q) ||
      (p.razorpayPaymentId || "").toLowerCase().includes(q) ||
      (p.razorpayOrderId || "").toLowerCase().includes(q) ||
      (p._id || "").toLowerCase().includes(q)
    );
  }, [payments, search]);

  const totals = useMemo(() => {
    const acc = { paid: 0, refunded: 0, pending: 0, count: filtered.length };
    filtered.forEach((p) => {
      if (p.paymentStatus === "paid") acc.paid += p.totalPrice;
      else if (p.paymentStatus === "refunded") acc.refunded += p.totalPrice;
      else acc.pending += p.totalPrice;
    });
    return acc;
  }, [filtered]);

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-indigo-600" /> Payments
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{filtered.length} {filtered.length === 1 ? "payment" : "payments"} found</p>
        </div>
        <button onClick={load} className="admin-btn admin-btn-ghost text-xs flex items-center gap-1.5">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="admin-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Online Revenue</p>
            <CreditCard className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-xl font-black text-slate-900">₹{(stats?.razorpay?.total || 0).toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{stats?.razorpay?.count || 0} paid orders</p>
        </div>
        <div className="admin-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">COD Revenue</p>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-slate-900">₹{(stats?.cod?.total || 0).toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{stats?.cod?.count || 0} COD orders</p>
        </div>
        <div className="admin-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Refunded</p>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xl font-black text-slate-900">₹{(stats?.refunded?.total || 0).toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{stats?.refunded?.count || 0} refunds</p>
        </div>
        <div className="admin-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing</p>
            <IndianRupee className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-900">₹{totals.paid.toLocaleString("en-IN")}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">across {totals.count} rows</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-card p-4 mb-5">
        <div className="flex items-center gap-2 mb-3 text-slate-500 text-[11px] font-bold uppercase tracking-widest">
          <Filter size={12} /> Filters
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {METHOD_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setMethod(value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                method === value
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className="admin-input !w-auto"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUS_FILTERS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <div className="relative flex-1 min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer, email, payment ID, order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-input !pl-9"
            />
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card p-16 text-center">
          <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No payments found for this filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((p) => {
            const cfg = statusCfg(p.paymentStatus);
            const isOnline = p.paymentMethod === "razorpay";
            return (
              <div key={p._id} className="admin-card hover:shadow-card-hover transition-shadow duration-200 p-5">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">

                  {/* Method + status */}
                  <div className="lg:col-span-2 flex lg:flex-col gap-3 lg:gap-2 items-center lg:items-start">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                      isOnline ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                    }`}>
                      {isOnline ? <CreditCard size={20} /> : <Banknote size={20} />}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Method</p>
                      <p className="text-sm font-bold text-slate-800">
                        {isOnline ? "Razorpay" : "Cash on Delivery"}
                      </p>
                      <span className={`mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                        {p.paymentStatus?.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="lg:col-span-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User size={11} /> Customer
                    </p>
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                        {p.user?.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 text-sm truncate">{p.user?.name || "Unknown"}</p>
                        {p.user?.email && (
                          <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                            <Mail size={10} /> {p.user.email}
                          </p>
                        )}
                        {p.user?.phone && (
                          <p className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Phone size={10} /> {p.user.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment IDs */}
                  <div className="lg:col-span-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Hash size={11} /> Payment ID
                    </p>
                    {isOnline && p.razorpayPaymentId ? (
                      <div className="flex items-center gap-1.5">
                        <code className="font-mono text-[11px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-100 truncate max-w-[170px]">
                          {p.razorpayPaymentId}
                        </code>
                        <button
                          onClick={() => handleCopy(p.razorpayPaymentId, "Payment ID")}
                          className="text-slate-400 hover:text-indigo-600 transition-colors shrink-0"
                          title="Copy Payment ID"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-300 italic">—</span>
                    )}
                    {isOnline && p.razorpayOrderId && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <code className="font-mono text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded border border-slate-200 truncate max-w-[170px]">
                          {p.razorpayOrderId}
                        </code>
                        <button
                          onClick={() => handleCopy(p.razorpayOrderId, "Razorpay Order ID")}
                          className="text-slate-300 hover:text-slate-600 transition-colors shrink-0"
                          title="Copy Razorpay Order ID"
                        >
                          <Copy size={11} />
                        </button>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                      <Calendar size={10} />
                      {p.paidAt
                        ? new Date(p.paidAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
                        : new Date(p.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="lg:col-span-3 text-right lg:pl-2 lg:border-l lg:border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Amount</p>
                    <p className="text-2xl font-black text-slate-900">₹{p.totalPrice.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate mt-1">
                      Order: {p._id.slice(-8).toUpperCase()}
                    </p>
                    {isOnline && p.paymentStatus === "paid" && p.status !== "Cancelled" && (
                      <button
                        disabled={refunding === p._id}
                        onClick={() => handleRefund(p._id)}
                        className="mt-2 text-[11px] text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1 rounded-lg font-semibold disabled:opacity-50 transition-colors"
                      >
                        {refunding === p._id ? "Processing…" : "↩ Mark Refunded"}
                      </button>
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
