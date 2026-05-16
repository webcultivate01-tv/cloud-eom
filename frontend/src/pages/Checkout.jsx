import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { placeOrder, resetOrderState } from "../features/orders/orderSlice";
import { createRazorpayOrder, verifyAndPlaceOrder, resetPayment } from "../features/payment/paymentSlice";
import { clearCart, selectCartTotal, setItemImage, makeCartKey } from "../features/cart/cartSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";
import { Package, MapPin, Palette, CheckCircle2, CreditCard, Banknote, ShieldCheck, Home, Briefcase, Image as ImageIcon, Upload, AlertTriangle, Ban, Info, ChevronRight, Check } from "lucide-react";

const INDIAN_STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry"];
const ADDR_TYPES = ["Home", "Work", "Other"];
const STEPS = ["Shipping", "Designs", "Review", "Payment"];

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((s) => s.cart);
  const total = useSelector(selectCartTotal);
  const { loading: orderLoading, success: orderSuccess, error: orderError, createdOrder: codCreatedOrder } = useSelector((s) => s.orders);
  const { loading: payLoading, success: paySuccess, error: payError, createdOrder: payCreatedOrder } = useSelector((s) => s.payment);
  const { user } = useSelector((s) => s.auth);

  const [shipping, setShipping] = useState({ fullName: "", phone: "", address: "", addressLine2: "", landmark: "", city: "", state: "", pincode: "", addressType: "Home" });
  const [note, setNote] = useState("");
  const [uploadingFor, setUploadingFor] = useState(null);
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [upiId, setUpiId] = useState("");
  const loading = orderLoading || payLoading;

  useEffect(() => {
    if (orderSuccess || paySuccess) {
      const order = payCreatedOrder || codCreatedOrder;
      dispatch(clearCart()); dispatch(resetOrderState()); dispatch(resetPayment());
      navigate("/order-success", {
        state: {
          orderId: order?._id || "",
          paymentMethod: order?.paymentMethod || paymentMethod,
          totalPrice: order?.totalPrice,
        },
        replace: true,
      });
    }
  }, [orderSuccess, paySuccess]);

  useEffect(() => {
    if (orderError) toast.error(orderError);
    if (payError) toast.error(payError);
  }, [orderError, payError]);

  const missingImages = items.filter((i) => i.requiresCustomImage && !i.uploadedImage);

  // Default payment method based on cart contents — if any item disallows COD, force razorpay.
  const codBlockedItems = items.filter((i) => i.allowCOD === false);
  const codAllowed = codBlockedItems.length === 0;

  useEffect(() => {
    if (!codAllowed && paymentMethod === "cod") {
      setPaymentMethod("razorpay");
    }
  }, [codAllowed, paymentMethod]);

  const handleImageUpload = async (e, itemKey) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingFor(itemKey);
    try {
      const fd = new FormData(); fd.append("image", file);
      const { data } = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      dispatch(setItemImage({ key: itemKey, imageUrl: data.imageUrl }));
      toast.success("Image uploaded successfully");
    } catch { toast.error("Upload failed. Try again."); }
    finally { setUploadingFor(null); }
  };

  const buildOrderItems = () => items.map((item) => ({
    product: item._id,
    quantity: item.quantity,
    size: item.size || "",
    uploadedImage: item.uploadedImage || "",
  }));

  const validateShipping = () => {
    if (!shipping.fullName.trim()) { toast.error("Enter your full name"); return false; }
    if (!shipping.phone.trim() || !/^\d{10}$/.test(shipping.phone.trim())) { toast.error("Enter a valid 10-digit phone number"); return false; }
    if (!shipping.address.trim()) { toast.error("Enter your address"); return false; }
    if (!shipping.city.trim()) { toast.error("Enter your city"); return false; }
    if (!shipping.state) { toast.error("Select your state"); return false; }
    if (!shipping.pincode.trim() || !/^\d{6}$/.test(shipping.pincode.trim())) { toast.error("Enter a valid 6-digit pincode"); return false; }
    return true;
  };

  const handleCOD = () => {
    if (missingImages.length > 0) { toast.error(`Upload image for: ${missingImages.map((i) => i.name).join(", ")}`); return; }
    dispatch(placeOrder({ items: buildOrderItems(), shippingAddress: shipping, customerNote: note, paymentMethod: "cod" }));
  };

  const handleRazorpay = async () => {
    if (missingImages.length > 0) { toast.error(`Upload image for: ${missingImages.map((i) => i.name).join(", ")}`); return; }
    const result = await dispatch(createRazorpayOrder(total));
    if (result.error) return;
    const { razorpayOrderId, amount, currency, keyId } = result.payload;
    const options = {
      key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID, amount, currency,
      name: "Cloud Graphics Amravati", description: "Custom Print Products", order_id: razorpayOrderId,
      prefill: { name: user?.name || shipping.fullName, email: user?.email || "", contact: shipping.phone, vpa: upiId.trim() || undefined },
      theme: { color: "#b91c1c" },
      handler: async (response) => {
        await dispatch(verifyAndPlaceOrder({ ...response, items: buildOrderItems(), shippingAddress: shipping, customerNote: note }));
      },
      modal: { ondismiss: () => toast.info("Payment cancelled. You can try again.") },
    };
    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => toast.error(`Payment failed: ${resp.error.description}`));
    rzp.open();
  };

  const handlePayNow = () => paymentMethod === "cod" ? handleCOD() : handleRazorpay();

  if (items.length === 0) return (
    <div className="text-center py-24 bg-gray-50 min-h-[70vh] flex flex-col items-center justify-center">
      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
        <Package className="w-10 h-10 text-gray-400" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">Checkout Unavailable</h2>
      <p className="text-gray-500 mb-8 max-w-md">Your cart is empty. Please add some products to your cart before proceeding to checkout.</p>
      <Link to="/products" className="bg-red-700 text-white px-8 py-3.5 rounded-xl font-bold text-sm hover:bg-red-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">Shop Now</Link>
    </div>
  );

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-red-700 focus:bg-white focus:ring-4 focus:ring-red-700/10 transition-all box-border font-[inherit]";

  return (
    <div className="bg-gray-50 min-h-[80vh]">
      <div className="w-full mx-auto px-4 md:px-10 py-10 pb-16">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

        {/* Step bar */}
        <div className="flex items-center mb-10 flex-wrap gap-1 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${step > i + 1 ? "bg-red-700 text-white" : step === i + 1 ? "bg-red-100 text-red-700 ring-4 ring-red-50" : "bg-gray-100 text-gray-400"}`}>
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm whitespace-nowrap hidden sm:inline ${step >= i + 1 ? "text-gray-900 font-bold" : "text-gray-400 font-medium"}`}>{label}</span>
              {i < STEPS.length - 1 && <div className={`w-6 md:w-16 h-1 mx-2 rounded-full transition-colors ${step > i + 1 ? "bg-red-700" : "bg-gray-100"}`} />}
            </div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 min-w-0 w-full">

            {/* Step 1: Shipping */}
            {step === 1 && (
              <div className="bg-transparent p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-red-700" /> Delivery Address
                </h2>
                <div className="mb-6">
                  <label className="block text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wider">Address Type</label>
                  <div className="flex gap-3 flex-wrap">
                    {ADDR_TYPES.map((t) => (
                      <button key={t} type="button" onClick={() => setShipping({ ...shipping, addressType: t })}
                        className={`flex items-center gap-2 px-5 py-2.5 border-2 rounded-xl text-sm font-bold cursor-pointer transition-all ${shipping.addressType === t ? "border-red-700 bg-red-50 text-red-700 shadow-sm" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"}`}>
                        {t === "Home" ? <Home className="w-4 h-4" /> : t === "Work" ? <Briefcase className="w-4 h-4" /> : <MapPin className="w-4 h-4" />} {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-2">Full Name *</label><input className={inputCls} placeholder="Your full name" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-2">Phone Number *</label><input className={inputCls} placeholder="10-digit mobile number" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} maxLength={10} /></div>
                </div>
                <div className="mb-5"><label className="block text-xs font-semibold text-gray-600 mb-2">Address Line 1 *</label><input className={inputCls} placeholder="House no, building, street" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} /></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-2">Address Line 2 <span className="font-normal text-gray-400">(optional)</span></label><input className={inputCls} placeholder="e.g. Opposite Bus Stand" value={shipping.addressLine2} onChange={(e) => setShipping({ ...shipping, addressLine2: e.target.value })} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-2">Landmark <span className="font-normal text-gray-400">(optional)</span></label><input className={inputCls} placeholder="e.g. Near City Mall" value={shipping.landmark} onChange={(e) => setShipping({ ...shipping, landmark: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                  <div><label className="block text-xs font-semibold text-gray-600 mb-2">City / Town *</label><input className={inputCls} placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} /></div>
                  <div><label className="block text-xs font-semibold text-gray-600 mb-2">Pincode *</label><input className={inputCls} placeholder="6-digit pincode" value={shipping.pincode} onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })} maxLength={6} /></div>
                </div>
                <div className="mb-6"><label className="block text-xs font-semibold text-gray-600 mb-2">State *</label>
                  <select className={inputCls} value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })}>
                    <option value="">— Select State —</option>
                    {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </div>
                <div className="mb-8"><label className="block text-xs font-semibold text-gray-600 mb-2">Order Note <span className="font-normal text-gray-400">(optional)</span></label><textarea className={`${inputCls} h-24 resize-y`} placeholder="Special instructions for delivery..." value={note} onChange={(e) => setNote(e.target.value)} /></div>
                <div className="flex justify-end">
                  <button onClick={() => { if (validateShipping()) setStep(2); }} className="bg-red-700 hover:bg-red-800 text-white px-8 py-4 rounded-xl font-bold text-base border-none cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 w-full sm:w-auto justify-center">
                    Continue to Upload Designs <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Images */}
            {step === 2 && (
              <div className="bg-transparent p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                  <Palette className="w-6 h-6 text-red-700" /> Upload Custom Designs
                </h2>
                
                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 mb-6 items-start">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-blue-800 text-sm m-0 leading-relaxed font-medium">For custom printed items, please upload a high-quality image. We'll use this exactly as provided for your print.</p>
                </div>

                <div className="flex flex-col gap-4">
                  {items.map((item) => {
                    const itemKey = makeCartKey(item._id, item.size);
                    return (
                    <div key={itemKey} className="flex gap-5 p-5 border border-gray-100 bg-gray-50/50 rounded-2xl items-start sm:items-center flex-col sm:flex-row">
                      <div className="flex items-center gap-4 w-full sm:w-auto flex-1">
                        <img src={item.image || "https://placehold.co/60x60/f5f5f5/999"} alt={item.name} className="w-16 h-16 object-cover rounded-xl bg-white border border-gray-200 shrink-0 shadow-sm" />
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm mb-1.5 flex items-center gap-2 flex-wrap">
                            {item.name}
                            {item.size && <span className="bg-gray-100 text-gray-700 border border-gray-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Size: {item.size}</span>}
                            {item.requiresCustomImage && <span className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Required</span>}
                          </p>
                          <p className="text-gray-500 text-xs font-medium">Qty: {item.quantity}</p>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto">
                        {item.requiresCustomImage || item.allowCustomImage ? (
                          <div className="flex flex-col gap-3 sm:items-end">
                            <input type="file" accept="image/*" id={`upload-${itemKey}`} className="hidden" onChange={(e) => handleImageUpload(e, itemKey)} />
                            <label htmlFor={`upload-${itemKey}`} className={`inline-flex items-center justify-center gap-2 border-2 rounded-xl px-5 py-2.5 cursor-pointer text-sm font-bold w-full sm:w-auto transition-all ${item.uploadedImage ? "bg-white border-gray-200 text-gray-700 hover:border-gray-300" : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"}`}>
                              {uploadingFor === itemKey ? (
                                <><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> Uploading...</>
                              ) : item.uploadedImage ? (
                                <><ImageIcon className="w-4 h-4" /> Change Image</>
                              ) : (
                                <><Upload className="w-4 h-4" /> Choose Image</>
                              )}
                            </label>
                            
                            <div className="h-6 flex items-center justify-start sm:justify-end">
                              {item.uploadedImage ? (
                                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                                  <CheckCircle2 className="w-4 h-4" /> Uploaded ready for print
                                </div>
                              ) : item.requiresCustomImage ? (
                                <div className="flex items-center gap-1.5 text-orange-600 text-xs font-bold">
                                  <AlertTriangle className="w-4 h-4" /> Image required
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-100 px-4 py-2 rounded-lg text-gray-400 text-xs font-semibold text-center h-fit">
                            No custom design needed
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>

                {missingImages.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 mt-6 items-start">
                    <Ban className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-bold text-sm mb-1">Uploads Required</p>
                      <p className="text-red-700 text-sm m-0">Please upload images for: <strong>{missingImages.map((i) => i.name).join(", ")}</strong> before proceeding.</p>
                    </div>
                  </div>
                )}
                
                <div className="flex gap-4 justify-between mt-8 pt-6 border-t border-gray-100">
                  <button onClick={() => setStep(1)} className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold text-base cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all">Back</button>
                  <button onClick={() => { if (missingImages.length > 0) { toast.error("Upload required images first"); return; } setStep(3); }}
                    className={`bg-red-700 hover:bg-red-800 text-white px-8 py-3.5 rounded-xl font-bold text-base border-none cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2 ${missingImages.length > 0 ? "opacity-50 hover:-translate-y-0 hover:shadow-md cursor-not-allowed" : ""}`}>
                    Review Order <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="bg-transparent p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-red-700" /> Review Your Order
                </h2>
                
                <div className="mb-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Delivering To
                  </h3>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                    <span className="bg-white border border-gray-200 text-gray-700 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-flex items-center gap-1.5 shadow-sm">
                      {shipping.addressType === "Home" ? <Home className="w-3.5 h-3.5" /> : shipping.addressType === "Work" ? <Briefcase className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />} 
                      {shipping.addressType}
                    </span>
                    <p className="font-bold text-gray-900 text-base mb-1">{shipping.fullName}</p>
                    <p className="text-gray-500 text-sm mb-2 font-medium">Phone: {shipping.phone}</p>
                    <p className="text-gray-600 text-sm leading-relaxed m-0">{shipping.address}{shipping.addressLine2 ? ", " + shipping.addressLine2 : ""}{shipping.landmark ? `, Near: ${shipping.landmark}` : ""}<br />{shipping.city}, {shipping.state} – {shipping.pincode}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" /> Items ({items.length})
                  </h3>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                    <div className="flex flex-col divide-y divide-gray-200">
                      {items.map((item) => (
                        <div key={makeCartKey(item._id, item.size)} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="bg-white border border-gray-200 w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold text-gray-600">{item.quantity}x</span>
                            <span className="text-gray-700 font-medium">{item.name}</span>
                            {item.size && (
                              <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold px-2 py-0.5 rounded uppercase">{item.size}</span>
                            )}
                          </div>
                          <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {note && (
                  <div className="mb-6">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Order Note</h3>
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                      <p className="text-amber-800 text-sm m-0 italic">{note}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 justify-between mt-8 pt-6 border-t border-gray-100">
                  <button onClick={() => setStep(2)} className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold text-base cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all">Back</button>
                  <button onClick={() => setStep(4)} className="bg-red-700 hover:bg-red-800 text-white px-8 py-3.5 rounded-xl font-bold text-base border-none cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center gap-2">
                    Choose Payment <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <div className="bg-transparent p-6 md:p-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-black text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-red-700" /> Choose Payment Method
                </h2>
                
                {!codAllowed && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-5 items-start">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-amber-800 font-bold text-sm mb-1">Cash on Delivery not available</p>
                      <p className="text-amber-700 text-sm m-0">
                        The following customisable item{codBlockedItems.length > 1 ? "s" : ""} require online payment: <strong>{codBlockedItems.map((i) => i.name).join(", ")}</strong>.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4 mb-6">
                  {[
                    { value: "razorpay", icon: CreditCard, name: "Pay Online Securely", desc: "UPI, Credit/Debit Cards, Net Banking, Wallets", activeCls: "border-red-700 bg-red-50 shadow-md", iconColor: "text-red-700", available: true },
                    { value: "cod", icon: Banknote, name: "Cash on Delivery", desc: "Pay in cash when your order arrives", activeCls: "border-emerald-600 bg-emerald-50 shadow-md", iconColor: "text-emerald-600", available: codAllowed },
                  ].filter((opt) => opt.available).map((opt) => (
                    <label key={opt.value} className={`flex items-center gap-5 border-2 rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-0.5 ${paymentMethod === opt.value ? opt.activeCls : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                      <input type="radio" name="payment" value={opt.value} checked={paymentMethod === opt.value} onChange={() => setPaymentMethod(opt.value)} className="hidden" />
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm border border-gray-100 shrink-0 ${paymentMethod === opt.value ? "" : "opacity-70"}`}>
                        <opt.icon className={`w-6 h-6 ${paymentMethod === opt.value ? opt.iconColor : "text-gray-400"}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-gray-900 text-base mb-1">{opt.name}</p>
                        <p className="text-gray-500 text-sm font-medium">{opt.desc}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 shrink-0 transition-colors flex items-center justify-center ${paymentMethod === opt.value ? (opt.value === "razorpay" ? "border-red-700 bg-red-700" : "border-emerald-600 bg-emerald-600") : "border-gray-300"}`}>
                        {paymentMethod === opt.value && <Check className="w-3.5 h-3.5 text-white" />}
                      </div>
                    </label>
                  ))}
                </div>

                {paymentMethod === "razorpay" && (
                  <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    <p className="text-gray-900 font-bold text-sm mb-3 flex items-center gap-2">
                      Quick Pay with UPI <span className="font-normal text-gray-400 text-xs">(optional)</span>
                    </p>
                    <div className="flex gap-2 mb-4">
                      <input className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-red-700 focus:bg-white focus:ring-4 focus:ring-red-700/10 transition-all" placeholder="yourname@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} />
                      {upiId.trim() && <button type="button" onClick={() => setUpiId("")} className="bg-gray-100 border-none text-gray-500 hover:text-gray-700 font-bold cursor-pointer px-4 rounded-xl transition-colors">Clear</button>}
                    </div>
                    <p className="text-gray-500 text-xs flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" /> 100% Secure & encrypted by Razorpay
                    </p>
                  </div>
                )}
                {paymentMethod === "cod" && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-5 py-4 text-emerald-800 text-sm mb-6 flex gap-3 animate-in fade-in zoom-in-95 duration-200">
                    <Banknote className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="m-0 leading-relaxed font-medium">Your order will be processed and dispatched. Please keep exact change ready at the time of delivery.</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center py-5 border-t border-b border-gray-100 mb-6 bg-gray-50/50 -mx-6 md:-mx-8 px-6 md:px-8">
                  <span className="font-black text-gray-900 text-lg">Total Amount to Pay</span>
                  <span className="text-red-700 font-black text-2xl">₹{total.toLocaleString()}</span>
                </div>
                
                <div className="flex gap-4 justify-between mt-6">
                  <button onClick={() => setStep(3)} className="bg-white border-2 border-gray-200 text-gray-700 px-6 py-3.5 rounded-xl font-bold text-base cursor-pointer hover:bg-gray-50 hover:border-gray-300 transition-all">Back</button>
                  <button onClick={handlePayNow} disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 bg-red-700 hover:bg-red-800 text-white px-8 py-3.5 rounded-xl font-bold text-base border-none cursor-pointer transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 ${loading ? "opacity-60 cursor-not-allowed transform-none" : ""}`}>
                    {loading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                    ) : paymentMethod === "razorpay" ? (
                      <><ShieldCheck className="w-5 h-5" /> Pay ₹{total.toLocaleString()} Securely</>
                    ) : (
                      <><Package className="w-5 h-5" /> Place COD Order</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="w-full lg:w-[320px] bg-transparent p-6 lg:sticky lg:top-28 shrink-0">
            <h3 className="font-black text-gray-900 text-lg mb-5 flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" /> Summary
            </h3>
            
            <div className="flex flex-col gap-3 mb-5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((item) => (
                <div key={makeCartKey(item._id, item.size)} className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-800 text-sm font-semibold truncate m-0">{item.name}</p>
                    <p className="text-gray-500 text-xs mt-0.5">Qty: {item.quantity}{item.size ? ` · Size ${item.size}` : ""}</p>
                  </div>
                  <span className="text-gray-900 font-bold text-sm shrink-0">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="h-px bg-gray-100 my-4" />
            
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Subtotal</span>
                <span className="text-gray-900 font-bold text-sm">₹{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm font-medium">Shipping</span>
                <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">FREE</span>
              </div>
              {step >= 4 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm font-medium">Payment Mode</span>
                  <span className={`font-bold text-xs px-2 py-1 rounded border ${paymentMethod === "razorpay" ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-gray-100 text-gray-700 border-gray-200"}`}>
                    {paymentMethod === "razorpay" ? "Online Pay" : "COD"}
                  </span>
                </div>
              )}
            </div>
            
            <div className="h-px bg-gray-100 my-4" />
            
            <div className="flex justify-between items-center mb-2">
              <span className="font-black text-gray-900 text-base">Total</span>
              <span className="text-red-700 font-black text-xl">₹{total.toLocaleString()}</span>
            </div>
            
            {step >= 2 && shipping.city && (
              <div className="mt-6 pt-5 border-t border-gray-100 bg-gray-50 rounded-2xl p-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Delivering to</p>
                <p className="text-gray-900 text-sm font-bold mb-1">{shipping.fullName}</p>
                <p className="text-gray-500 text-xs leading-relaxed m-0">{shipping.city}, {shipping.state} {shipping.pincode}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
