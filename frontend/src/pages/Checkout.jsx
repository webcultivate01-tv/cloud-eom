import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { placeOrder, resetOrderState } from "../features/orders/orderSlice";
import { createRazorpayOrder, verifyAndPlaceOrder, resetPayment } from "../features/payment/paymentSlice";
import { clearCart, selectCartTotal, setItemImage } from "../features/cart/cartSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const total = useSelector(selectCartTotal);
  const { loading: orderLoading, success: orderSuccess, error: orderError } = useSelector((state) => state.orders);
  const { loading: payLoading, success: paySuccess, error: payError } = useSelector((state) => state.payment);
  const { user } = useSelector((state) => state.auth);

  const [shipping, setShipping] = useState({ fullName: "", phone: "", address: "", city: "", pincode: "" });
  const [note, setNote] = useState("");
  const [uploadingFor, setUploadingFor] = useState(null);
  const [step, setStep] = useState(1); // 1=shipping 2=images 3=review 4=payment
  const [paymentMethod, setPaymentMethod] = useState("razorpay");
  const [upiId, setUpiId] = useState("");

  const loading = orderLoading || payLoading;

  // Navigate to orders on success (COD or Razorpay verified)
  useEffect(() => {
    if (orderSuccess || paySuccess) {
      toast.success("🎉 Order placed successfully!");
      dispatch(clearCart());
      dispatch(resetOrderState());
      dispatch(resetPayment());
      navigate("/orders");
    }
  }, [orderSuccess, paySuccess, dispatch, navigate]);

  useEffect(() => {
    if (orderError) toast.error(orderError);
    if (payError) toast.error(payError);
  }, [orderError, payError]);

  const requiredImageItems = items.filter((i) => i.requiresCustomImage);
  const missingImages = requiredImageItems.filter((i) => !i.uploadedImage);

  const handleImageUpload = async (e, itemId) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingFor(itemId);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const { data } = await api.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      dispatch(setItemImage({ id: itemId, imageUrl: data.imageUrl }));
      toast.success("Image uploaded ✅");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploadingFor(null);
    }
  };

  const buildOrderItems = () =>
    items.map((item) => ({
      product: item._id,
      quantity: item.quantity,
      uploadedImage: item.uploadedImage || "",
    }));

  // COD flow
  const handleCOD = () => {
    if (missingImages.length > 0) {
      toast.error(`Upload image for: ${missingImages.map((i) => i.name).join(", ")}`);
      return;
    }
    dispatch(placeOrder({
      items: buildOrderItems(),
      shippingAddress: shipping,
      customerNote: note,
      paymentMethod: "cod",
    }));
  };

  // Razorpay flow
  const handleRazorpay = async () => {
    if (missingImages.length > 0) {
      toast.error(`Upload image for: ${missingImages.map((i) => i.name).join(", ")}`);
      return;
    }

    // 1. Create Razorpay order on backend
    const result = await dispatch(createRazorpayOrder(total));
    if (result.error) return; // toast already shown via useEffect

    const { razorpayOrderId, amount, currency, keyId } = result.payload;

    // 2. Open Razorpay modal
    const options = {
      key: keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount,
      currency,
      name: "Cloud Graphics Amravati",
      description: "Custom Print Products",
      order_id: razorpayOrderId,
      prefill: {
        name: user?.name || shipping.fullName,
        email: user?.email || "",
        contact: shipping.phone,
        // Prefill UPI ID if the user entered one
        vpa: upiId.trim() || undefined,
      },
      // If user entered UPI ID, open directly on UPI tab
      ...(upiId.trim() && { method: { upi: true } }),
      config: {
        display: {
          // Always show UPI as top option
          preferences: { show_default_blocks: true },
          blocks: {
            upi_block: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
          },
          sequence: ["block.upi_block"],
        },
      },
      theme: { color: "#c41230" },
      handler: async (response) => {
        // 3. Verify on backend and create DB order
        await dispatch(verifyAndPlaceOrder({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          items: buildOrderItems(),
          shippingAddress: shipping,
          customerNote: note,
        }));
      },
      modal: {
        ondismiss: () => toast.info("Payment cancelled. You can try again."),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (resp) => {
      toast.error(`Payment failed: ${resp.error.description}`);
    });
    rzp.open();
  };

  const handlePayNow = () => {
    if (paymentMethod === "cod") handleCOD();
    else handleRazorpay();
  };

  if (items.length === 0) {
    return (
      <div style={s.empty}>
        <p style={{ color: "#666" }}>Your cart is empty.</p>
        <Link to="/products" style={s.shopLink}>Shop Now</Link>
      </div>
    );
  }

  const STEPS = ["Shipping", "Designs", "Review", "Payment"];

  return (
    <div style={s.page}>
      <h1 style={s.title}>Checkout</h1>

      {/* Step indicator */}
      <div style={s.stepBar}>
        {STEPS.map((label, i) => (
          <div key={i} style={s.stepItem}>
            <div style={{ ...s.stepCircle, background: step >= i + 1 ? "#c41230" : "#e0e0e0", color: step >= i + 1 ? "#fff" : "#999" }}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span style={{ ...s.stepLabel, color: step >= i + 1 ? "#c41230" : "#999", fontWeight: step === i + 1 ? "700" : "400" }}>{label}</span>
            {i < STEPS.length - 1 && <div style={{ ...s.stepLine, background: step > i + 1 ? "#c41230" : "#e0e0e0" }} />}
          </div>
        ))}
      </div>

      <div style={s.layout}>
        <div style={s.left}>

          {/* ── STEP 1: Shipping ─────────────────────────── */}
          {step === 1 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>📦 Shipping Details</h2>
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>Full Name *</label>
                  <input style={s.input} placeholder="Your full name" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Phone *</label>
                  <input style={s.input} placeholder="10-digit mobile" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} />
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Full Address *</label>
                <textarea style={{ ...s.input, height: "72px", resize: "vertical" }} placeholder="House no, street, area..." value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />
              </div>
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>City *</label>
                  <input style={s.input} placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Pincode *</label>
                  <input style={s.input} placeholder="6-digit pincode" value={shipping.pincode} onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })} />
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Order Note (optional)</label>
                <textarea style={{ ...s.input, height: "60px", resize: "vertical" }} placeholder="Special instructions..." value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <button
                type="button"
                style={s.nextBtn}
                onClick={() => {
                  if (!shipping.fullName || !shipping.phone || !shipping.address || !shipping.city || !shipping.pincode) {
                    toast.error("Please fill all required shipping fields");
                    return;
                  }
                  setStep(2);
                }}
              >
                Continue to Upload Designs →
              </button>
            </div>
          )}

          {/* ── STEP 2: Image Upload ─────────────────────── */}
          {step === 2 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>🎨 Upload Custom Designs</h2>
              {items.map((item) => (
                <div key={item._id} style={s.uploadRow}>
                  <img src={item.image || "https://placehold.co/60x60/f5f5f5/999"} alt={item.name} style={s.uploadThumb} />
                  <div style={{ flex: 1 }}>
                    <p style={s.uploadItemName}>
                      {item.name}
                      {item.requiresCustomImage && <span style={s.requiredTag}>Required *</span>}
                    </p>
                    {item.requiresCustomImage || item.allowCustomImage ? (
                      <div style={s.uploadArea}>
                        <input type="file" accept="image/*" id={`upload-${item._id}`} style={{ display: "none" }} onChange={(e) => handleImageUpload(e, item._id)} />
                        <label htmlFor={`upload-${item._id}`} style={s.uploadLabel}>
                          {uploadingFor === item._id ? "Uploading..." : item.uploadedImage ? "Change Image" : "📁 Choose Image"}
                        </label>
                        {item.uploadedImage && (
                          <div style={s.uploadedPreview}>
                            <img src={item.uploadedImage} alt="preview" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px" }} />
                            <span style={{ color: "#2e7d32", fontSize: "0.82rem", fontWeight: "600" }}>✅ Uploaded</span>
                          </div>
                        )}
                        {item.requiresCustomImage && !item.uploadedImage && (
                          <p style={s.requiredNote}>⚠️ This product requires a custom image.</p>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: "#999", fontSize: "0.82rem" }}>No custom image needed</p>
                    )}
                  </div>
                </div>
              ))}
              {missingImages.length > 0 && (
                <div style={s.blockWarning}>
                  🚫 Upload images for: <strong>{missingImages.map((i) => i.name).join(", ")}</strong>
                </div>
              )}
              <div style={s.navRow}>
                <button type="button" style={s.backBtn} onClick={() => setStep(1)}>← Back</button>
                <button type="button" style={{ ...s.nextBtn, opacity: missingImages.length > 0 ? 0.5 : 1 }}
                  onClick={() => { if (missingImages.length > 0) { toast.error("Upload required images first"); return; } setStep(3); }}>
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ───────────────────────────── */}
          {step === 3 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>✅ Review Your Order</h2>
              <div style={s.reviewSection}>
                <h3 style={s.reviewLabel}>Shipping To</h3>
                <p style={s.reviewText}>{shipping.fullName} · {shipping.phone}</p>
                <p style={s.reviewText}>{shipping.address}, {shipping.city} – {shipping.pincode}</p>
              </div>
              <div style={s.reviewSection}>
                <h3 style={s.reviewLabel}>Items ({items.length})</h3>
                {items.map((item) => (
                  <div key={item._id} style={s.reviewItem}>
                    <span style={{ color: "#555" }}>{item.name} × {item.quantity}</span>
                    <span style={{ fontWeight: "700" }}>₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div style={s.navRow}>
                <button type="button" style={s.backBtn} onClick={() => setStep(2)}>← Back</button>
                <button type="button" style={s.nextBtn} onClick={() => setStep(4)}>Choose Payment →</button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Payment ──────────────────────────── */}
          {step === 4 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>💳 Choose Payment Method</h2>

              <div style={s.payOptions}>
                {/* Razorpay option */}
                <label style={{ ...s.payOption, ...(paymentMethod === "razorpay" ? s.payOptionActive : {}) }}>
                  <input type="radio" name="payment" value="razorpay" checked={paymentMethod === "razorpay"}
                    onChange={() => setPaymentMethod("razorpay")} style={{ display: "none" }} />
                  <div style={s.payIcon}>💳</div>
                  <div>
                    <p style={s.payName}>Pay Online (Razorpay)</p>
                    <p style={s.payDesc}>UPI · Cards · Net Banking · Wallets — Instant &amp; Secure</p>
                  </div>
                  <div style={{ ...s.payRadio, ...(paymentMethod === "razorpay" ? s.payRadioActive : {}) }} />
                </label>

                {/* COD option */}
                <label style={{ ...s.payOption, ...(paymentMethod === "cod" ? s.payOptionCOD : {}) }}>
                  <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")} style={{ display: "none" }} />
                  <div style={s.payIcon}>💵</div>
                  <div>
                    <p style={s.payName}>Cash on Delivery (COD)</p>
                    <p style={s.payDesc}>Pay when your order arrives · Available for all areas</p>
                  </div>
                  <div style={{ ...s.payRadio, ...(paymentMethod === "cod" ? s.payRadioCOD : {}) }} />
                </label>
              </div>

              {paymentMethod === "razorpay" && (
                <div style={s.razorpayBox}>
                  {/* UPI ID quick-pay input */}
                  <p style={s.upiLabel}>⚡ Pay instantly with UPI ID <span style={{ color: "#888", fontWeight: "400" }}>(optional)</span></p>
                  <div style={s.upiRow}>
                    <input
                      style={s.upiInput}
                      placeholder="yourname@upi  (e.g. 9876543210@paytm)"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                    {upiId.trim() && (
                      <button type="button" style={s.upiClearBtn} onClick={() => setUpiId("")}>✕</button>
                    )}
                  </div>
                  <p style={s.razorpayNote}>
                    🔒 Powered by Razorpay — UPI · Cards · Net Banking · Wallets. 100% secure &amp; encrypted.
                  </p>
                </div>
              )}
              {paymentMethod === "cod" && (
                <div style={s.codNote}>
                  📦 Your order will be processed and delivered to you. Pay in cash at the time of delivery.
                </div>
              )}

              <div style={s.orderTotal}>
                <span>Total Amount</span>
                <span style={s.totalAmt}>₹{total.toLocaleString()}</span>
              </div>

              <div style={s.navRow}>
                <button type="button" style={s.backBtn} onClick={() => setStep(3)}>← Back</button>
                <button
                  type="button"
                  style={{ ...s.placeBtn, opacity: loading ? 0.7 : 1 }}
                  disabled={loading}
                  onClick={handlePayNow}
                >
                  {loading ? "Processing..." : paymentMethod === "razorpay" ? "Pay ₹" + total.toLocaleString() + " →" : "Place COD Order →"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary sidebar */}
        <div style={s.summary}>
          <h3 style={s.summaryTitle}>Order Summary</h3>
          {items.map((item) => (
            <div key={item._id} style={s.summaryRow}>
              <span style={s.summaryLabel}>{item.name} × {item.quantity}</span>
              <span style={s.summaryVal}>₹{(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
          <div style={s.divider} />
          <div style={s.summaryRow}>
            <span style={{ fontWeight: "800", color: "#1a1a1a" }}>Total</span>
            <span style={s.totalVal}>₹{total.toLocaleString()}</span>
          </div>
          <div style={{ ...s.summaryRow, marginTop: "8px" }}>
            <span style={{ color: "#999", fontSize: "0.75rem" }}>Payment</span>
            <span style={{ color: paymentMethod === "razorpay" ? "#c41230" : "#2e7d32", fontWeight: "700", fontSize: "0.8rem" }}>
              {paymentMethod === "razorpay" ? "💳 Online" : "💵 COD"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { background: "#fff", maxWidth: "1100px", margin: "0 auto", padding: "32px 40px 60px" },
  title: { fontSize: "1.6rem", fontWeight: "800", color: "#1a1a1a", marginBottom: "24px" },

  stepBar: { display: "flex", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "4px" },
  stepItem: { display: "flex", alignItems: "center", gap: "8px" },
  stepCircle: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem", flexShrink: 0 },
  stepLabel: { fontSize: "0.82rem", whiteSpace: "nowrap" },
  stepLine: { width: "48px", height: "2px", margin: "0 4px" },

  layout: { display: "flex", gap: "28px", alignItems: "flex-start", flexWrap: "wrap" },
  left: { flex: 1, minWidth: "300px" },
  card: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px", marginBottom: "16px" },
  cardTitle: { fontSize: "1rem", fontWeight: "700", color: "#1a1a1a", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #f0f0f0" },

  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", color: "#555", fontSize: "0.82rem", fontWeight: "600", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "0.9rem", background: "#fafafa", boxSizing: "border-box" },

  navRow: { display: "flex", gap: "12px", justifyContent: "space-between", marginTop: "20px" },
  nextBtn: { background: "#c41230", color: "#fff", border: "none", borderRadius: "6px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", fontSize: "0.9rem" },
  backBtn: { background: "#fff", color: "#c41230", border: "1px solid #c41230", borderRadius: "6px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", fontSize: "0.9rem" },
  placeBtn: { background: "#c41230", color: "#fff", border: "none", borderRadius: "6px", padding: "13px 32px", fontWeight: "700", cursor: "pointer", fontSize: "0.95rem" },

  // Image upload
  uploadRow: { display: "flex", gap: "14px", padding: "14px 0", borderBottom: "1px solid #f0f0f0", alignItems: "flex-start" },
  uploadThumb: { width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px", background: "#f5f5f5" },
  uploadItemName: { fontWeight: "700", color: "#1a1a1a", marginBottom: "8px", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "8px" },
  requiredTag: { background: "#fff5f6", color: "#c41230", border: "1px solid #f5c6cb", padding: "2px 8px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700" },
  uploadArea: { display: "flex", flexDirection: "column", gap: "8px" },
  uploadLabel: { display: "inline-block", background: "#f0f0f0", border: "1px solid #e0e0e0", borderRadius: "6px", padding: "7px 14px", cursor: "pointer", fontSize: "0.82rem", fontWeight: "600", color: "#333", width: "fit-content" },
  uploadedPreview: { display: "flex", alignItems: "center", gap: "10px" },
  requiredNote: { color: "#e65100", fontSize: "0.78rem", fontWeight: "600" },
  blockWarning: { background: "#fff5f6", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "12px 16px", color: "#c41230", fontSize: "0.85rem", marginTop: "12px" },

  // Review
  reviewSection: { marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid #f0f0f0" },
  reviewLabel: { color: "#999", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" },
  reviewText: { color: "#333", fontSize: "0.88rem", lineHeight: "1.6" },
  reviewItem: { display: "flex", justifyContent: "space-between", fontSize: "0.88rem", marginBottom: "6px" },

  // Payment
  payOptions: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" },
  payOption: { display: "flex", alignItems: "center", gap: "14px", border: "2px solid #e0e0e0", borderRadius: "10px", padding: "16px", cursor: "pointer", transition: "border-color 0.2s" },
  payOptionActive: { borderColor: "#c41230", background: "#fff5f6" },
  payOptionCOD: { borderColor: "#2e7d32", background: "#f1f8e9" },
  payIcon: { fontSize: "1.8rem", flexShrink: 0 },
  payName: { fontWeight: "700", color: "#1a1a1a", fontSize: "0.95rem", marginBottom: "2px" },
  payDesc: { color: "#888", fontSize: "0.78rem" },
  payRadio: { width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #ccc", marginLeft: "auto", flexShrink: 0 },
  payRadioActive: { border: "6px solid #c41230", background: "#fff" },
  payRadioCOD: { border: "6px solid #2e7d32", background: "#fff" },
  razorpayBox: { background: "#fff5f6", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "14px", marginBottom: "16px" },
  upiLabel: { color: "#c41230", fontWeight: "700", fontSize: "0.85rem", marginBottom: "8px" },
  upiRow: { display: "flex", gap: "8px", alignItems: "center", marginBottom: "10px" },
  upiInput: { flex: 1, padding: "9px 12px", border: "1px solid #e0a0aa", borderRadius: "6px", fontSize: "0.9rem", background: "#fff", outline: "none" },
  upiClearBtn: { background: "none", border: "none", color: "#c41230", fontSize: "1rem", cursor: "pointer", padding: "4px 8px", fontWeight: "700" },
  razorpayNote: { color: "#c41230", fontSize: "0.78rem", margin: 0 },
  codNote: { background: "#f1f8e9", border: "1px solid #c8e6c9", borderRadius: "8px", padding: "10px 14px", color: "#2e7d32", fontSize: "0.8rem", marginBottom: "16px" },
  orderTotal: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderTop: "1px solid #f0f0f0", marginBottom: "8px", fontWeight: "600", color: "#1a1a1a" },
  totalAmt: { color: "#c41230", fontWeight: "800", fontSize: "1.2rem" },

  // Summary sidebar
  summary: { width: "260px", background: "#f7f7f7", borderRadius: "12px", padding: "20px", position: "sticky", top: "120px", flexShrink: 0 },
  summaryTitle: { fontWeight: "800", color: "#1a1a1a", marginBottom: "16px", fontSize: "0.95rem" },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  summaryLabel: { color: "#666", fontSize: "0.82rem" },
  summaryVal: { color: "#1a1a1a", fontWeight: "600", fontSize: "0.82rem" },
  divider: { height: "1px", background: "#e0e0e0", margin: "12px 0" },
  totalVal: { color: "#c41230", fontWeight: "800", fontSize: "1.1rem" },

  empty: { textAlign: "center", padding: "80px", background: "#fff" },
  shopLink: { background: "#c41230", color: "#fff", padding: "10px 24px", borderRadius: "6px", fontWeight: "700", display: "inline-block", marginTop: "12px" },
};
