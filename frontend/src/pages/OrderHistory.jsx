import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMyOrders, requestCancelOTP, cancelOrder } from "../features/orders/orderSlice";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { Package, Lock, Mail, CreditCard, Banknote, Palette, MapPin, Truck, X, ExternalLink, Check, ShoppingBag, ArrowRight } from "lucide-react";

const STATUS_CLS = {
  Pending:    { badge: "bg-amber-50 text-amber-700 border border-amber-200", dot: "bg-amber-400" },
  Processing: { badge: "bg-blue-50 text-blue-700 border border-blue-200",   dot: "bg-blue-400" },
  Printing:   { badge: "bg-purple-50 text-purple-700 border border-purple-200", dot: "bg-purple-400" },
  Shipped:    { badge: "bg-indigo-50 text-indigo-700 border border-indigo-200",  dot: "bg-indigo-500" },
  Delivered:  { badge: "bg-emerald-50 text-emerald-700 border border-emerald-200", dot: "bg-emerald-500" },
  Cancelled:  { badge: "bg-red-50 text-red-700 border border-red-200",     dot: "bg-red-500" },
};
const PAY_CLS = {
  paid:     "bg-emerald-50 text-emerald-700 border border-emerald-200",
  refunded: "bg-red-50 text-red-700 border border-red-200",
  pending:  "bg-amber-50 text-amber-700 border border-amber-200",
};
const STATUS_ORDER = ["Pending", "Processing", "Printing", "Shipped", "Delivered"];

export default function OrderHistory() {
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((s) => s.orders);
  const [otpModal, setOtpModal] = useState(null);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const closeModal = () => { setOtpModal(null); setOtp(""); setOtpSent(false); };

  const handleRequestOTP = async (order) => {
    setOtpModal(order); setOtp(""); setOtpSent(false); setSendingOtp(true);
    const result = await dispatch(requestCancelOTP(order._id));
    setSendingOtp(false);
    if (!result.error) { setOtpSent(true); toast.success(result.payload?.message || "OTP sent to your email"); }
    else { toast.error(result.payload || "Failed to send OTP"); setOtpModal(null); }
  };

  const handleConfirmCancel = async (e) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length !== 6) { toast.error("Enter the 6-digit OTP"); return; }
    setVerifying(true);
    const result = await dispatch(cancelOrder({ id: otpModal._id, otp: otp.trim() }));
    setVerifying(false);
    if (!result.error) { toast.success("Order cancelled successfully"); closeModal(); }
    else toast.error(result.payload || "Invalid OTP. Try again.");
  };

  useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-red-700 rounded-full animate-spin mb-4" />
      <div className="text-gray-400 font-medium">Loading your orders...</div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-[80vh]">
      <div className="w-full mx-auto px-4 md:px-12 py-10 pb-16">

        {/* OTP Modal */}
        {otpModal && (
          <div className="fixed inset-0 bg-black/60 z-[1000] flex items-center justify-center p-5 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative text-center shadow-2xl animate-in zoom-in-95 duration-200">
              <button onClick={closeModal} className="absolute top-4 right-4 bg-gray-50 w-8 h-8 rounded-full border-none flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <Lock className="w-10 h-10 text-red-700" />
              </div>
              
              <h2 className="text-xl font-black text-gray-900 mb-2">Verify to Cancel Order</h2>
              <p className="text-gray-500 text-sm mb-6">Order <strong>#{otpModal._id.slice(-8).toUpperCase()}</strong> · ₹{otpModal.totalPrice?.toLocaleString()}</p>
              
              {sendingOtp ? (
                <div className="flex items-center justify-center gap-2 text-gray-600 text-sm bg-gray-50 rounded-xl px-4 py-4 font-medium border border-gray-100">
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-red-700 rounded-full animate-spin" />
                  Sending OTP to your email...
                </div>
              ) : otpSent ? (
                <form onSubmit={handleConfirmCancel}>
                  <div className="flex gap-3 text-left bg-blue-50 border border-blue-100 text-blue-800 text-sm rounded-xl px-4 py-3 mb-6">
                    <Mail className="w-5 h-5 shrink-0 text-blue-600" />
                    <p className="leading-relaxed m-0">A 6-digit OTP has been sent to your registered email. Enter it below to confirm.</p>
                  </div>
                  
                  <div className="flex gap-2 justify-between mb-6">
                    {[0,1,2,3,4,5].map((i) => (
                      <input key={i} id={`otp-box-${i}`} type="text" inputMode="numeric" maxLength={1}
                        className="w-12 h-14 text-center text-xl font-black border-2 border-gray-200 rounded-xl outline-none focus:border-red-700 focus:bg-red-50/30 text-gray-900 transition-all shadow-sm"
                        value={otp[i] || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/, "");
                          const arr = otp.split(""); arr[i] = val;
                          setOtp(arr.join("").slice(0, 6));
                          if (val && i < 5) document.getElementById(`otp-box-${i + 1}`)?.focus();
                        }}
                        onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) document.getElementById(`otp-box-${i - 1}`)?.focus(); }}
                      />
                    ))}
                  </div>
                  
                  <div className="flex gap-3 justify-center mb-4">
                    <button type="button" onClick={() => handleRequestOTP(otpModal)} disabled={sendingOtp}
                      className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                      Resend OTP
                    </button>
                    <button type="submit" disabled={verifying || otp.length < 6}
                      className="flex-[2] bg-red-700 border-none text-white py-3 rounded-xl font-bold text-sm cursor-pointer hover:bg-red-800 transition-colors shadow-sm disabled:opacity-50">
                      {verifying ? "Verifying..." : "Confirm Cancel"}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs font-medium">⏱ OTP expires in 10 minutes</p>
                </form>
              ) : null}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-red-700" />
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 m-0">My Orders</h1>
          </div>
          <Link to="/products" className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-sm active:scale-95 w-fit">
            <ShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-transparent p-16 text-center flex flex-col items-center w-full mx-auto">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-3">No orders yet</h2>
            <p className="text-gray-500 text-base mb-8 max-w-md mx-auto">You haven't placed any orders yet. Discover our amazing products and start shopping!</p>
            <Link to="/products" className="inline-flex items-center gap-2 bg-red-700 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-red-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Browse Products
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {orders.map((order) => {
              const st = STATUS_CLS[order.status] || STATUS_CLS.Pending;
              const payCls = PAY_CLS[order.paymentStatus] || PAY_CLS.pending;
              const currentIdx = STATUS_ORDER.indexOf(order.status);
              
              return (
                <div key={order._id} className="bg-transparent overflow-hidden mb-6">
                  {/* Card top */}
                  <div className="flex flex-wrap justify-between items-start gap-4 px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                    <div>
                      <p className="font-bold text-gray-900 text-sm mb-1">Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="text-gray-500 text-xs font-medium">Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${st.badge}`}>
                        <span className={`w-2 h-2 rounded-full ${st.dot} shadow-sm`} />{order.status}
                      </span>
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${payCls}`}>
                        {order.paymentMethod === "razorpay" ? <CreditCard className="w-3.5 h-3.5" /> : <Banknote className="w-3.5 h-3.5" />} 
                        {order.paymentStatus === "paid" ? "Paid" : order.paymentStatus === "refunded" ? "Refunded" : "Pending"}
                      </span>
                      <span className="font-black text-gray-900 text-base ml-2">₹{order.totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-6 py-4 flex flex-col gap-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-4 flex-wrap pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        <img src={item.product?.image || "https://placehold.co/64x64/f5f5f5/999?text=Item"} alt={item.name}
                          className="w-20 h-20 object-cover rounded-2xl border border-gray-100 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-base truncate mb-1 flex items-center gap-2 flex-wrap">
                            {item.name}
                            {item.size && (
                              <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                Size: {item.size}
                              </span>
                            )}
                          </p>
                          <p className="text-gray-500 text-sm font-medium mb-2">Qty: {item.quantity} × ₹{item.price.toLocaleString()}</p>
                          {item.uploadedImage && (
                            <a href={item.uploadedImage} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-red-700 text-xs font-bold bg-red-50 px-2.5 py-1 rounded-md hover:bg-red-100 transition-colors w-fit">
                              <Palette className="w-3 h-3" /> View Custom Design <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <p className="font-black text-gray-900 text-base">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 border-t border-gray-100 bg-gray-50/30">
                    {/* Shipping */}
                    <div className="px-6 py-4 flex flex-col gap-3 justify-center">
                      <div className="flex items-start gap-2.5 text-gray-600 text-sm">
                        <MapPin className="w-4 h-4 shrink-0 text-gray-400 mt-0.5" />
                        <p className="leading-relaxed m-0 font-medium">{order.shippingAddress?.address}, {order.shippingAddress?.city} – {order.shippingAddress?.pincode}</p>
                      </div>
                      {order.shipment?.trackingId && (
                        <div className="flex items-center gap-2.5 text-gray-700 text-sm bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm w-fit">
                          <Truck className="w-4 h-4 shrink-0 text-indigo-500" />
                          <span>{order.shipment.courierName} · AWB: <strong className="text-indigo-700">{order.shipment.trackingId}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Progress / Actions */}
                    <div className="px-6 py-4 flex flex-col justify-center">
                      {["Pending", "Processing"].includes(order.status) && order.status !== "Cancelled" ? (
                        <div className="flex flex-col sm:flex-row items-center gap-4 bg-red-50/50 p-3.5 rounded-2xl border border-red-100 h-full">
                          <p className="text-gray-500 text-xs leading-relaxed flex-1 m-0">Email OTP verification required. Printing / Shipped orders cannot be cancelled.</p>
                          <button onClick={() => handleRequestOTP(order)}
                            className="flex items-center gap-1.5 bg-white border border-red-200 text-red-700 px-4 py-2 rounded-xl font-bold text-sm cursor-pointer hover:bg-red-50 hover:border-red-300 transition-all shadow-sm whitespace-nowrap active:scale-95 w-full sm:w-auto justify-center">
                            <X className="w-4 h-4" /> Cancel Order
                          </button>
                        </div>
                      ) : order.status === "Cancelled" ? (
                        <div className="flex items-center justify-center h-full">
                          <span className="bg-red-50 text-red-700 border border-red-200 font-bold px-4 py-2 rounded-xl text-sm">Order Cancelled</span>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center h-full">
                          <div className="flex items-center justify-between relative px-2">
                            {STATUS_ORDER.map((s2, i) => {
                              const isDone = i <= currentIdx && order.status !== "Cancelled";
                              const isCurrent = i === currentIdx && order.status !== "Cancelled";
                              return (
                                <div key={s2} className="flex flex-col items-center relative z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 shrink-0 transition-all duration-300 shadow-sm
                                    ${isDone ? "bg-red-700 text-white" : "bg-white border-2 border-gray-200 text-gray-300"}
                                    ${isCurrent ? "ring-4 ring-red-100" : ""}`}>
                                    {isDone ? <Check className="w-4 h-4" /> : <span className="w-2 h-2 rounded-full bg-gray-200" />}
                                  </div>
                                  <p className={`text-[10px] sm:text-xs font-bold text-center absolute -bottom-5 w-20 
                                    ${isDone ? "text-gray-900" : "text-gray-400"}`}>{s2}</p>
                                </div>
                              );
                            })}
                            
                            {/* Connecting Line */}
                            <div className="absolute top-4 left-6 right-6 h-1 bg-gray-100 rounded-full z-0">
                              <div className="h-full bg-red-700 rounded-full transition-all duration-500" 
                                style={{ width: `${order.status === 'Cancelled' ? 0 : (currentIdx / 4) * 100}%` }} />
                            </div>
                          </div>
                          <div className="h-6"></div> {/* Spacer for absolute text */}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
