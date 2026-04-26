import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { placeOrder, resetOrderState } from "../features/orders/orderSlice";
import { clearCart, selectCartTotal, setItemImage } from "../features/cart/cartSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import api from "../utils/api";

export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items } = useSelector((state) => state.cart);
  const total = useSelector(selectCartTotal);
  const { loading, success, error } = useSelector((state) => state.orders);

  const [shipping, setShipping] = useState({ fullName: "", phone: "", address: "", city: "", pincode: "" });
  const [note, setNote] = useState("");
  const [uploadingFor, setUploadingFor] = useState(null);
  const [step, setStep] = useState(1); // 1=shipping, 2=images, 3=review

  useEffect(() => {
    if (success) {
      toast.success("🎉 Order placed successfully!");
      dispatch(clearCart());
      dispatch(resetOrderState());
      navigate("/orders");
    }
  }, [success, dispatch, navigate]);

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  // Items that REQUIRE a custom image
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

  const handlePlaceOrder = (e) => {
    e.preventDefault();

    // 🔒 BLOCK if any required-image item is missing its image
    if (missingImages.length > 0) {
      toast.error(`Please upload custom image for: ${missingImages.map((i) => i.name).join(", ")}`);
      setStep(2); // jump to image step
      return;
    }

    const orderItems = items.map((item) => ({
      product: item._id,
      quantity: item.quantity,
      uploadedImage: item.uploadedImage || "",
    }));

    dispatch(placeOrder({ items: orderItems, shippingAddress: shipping, customerNote: note }));
  };

  if (items.length === 0) {
    return (
      <div style={s.empty}>
        <p style={{ color: "#666" }}>Your cart is empty.</p>
        <Link to="/products" style={s.backBtn}>Shop Now</Link>
      </div>
    );
  }

  const STEPS = ["Shipping Details", "Upload Designs", "Review & Place"];

  return (
    <div style={s.page}>
      <h1 style={s.title}>Checkout</h1>

      {/* Step indicator */}
      <div style={s.stepBar}>
        {STEPS.map((label, i) => (
          <div key={i} style={s.stepItem}>
            <div style={{ ...s.stepCircle, background: step > i ? "#c41230" : step === i + 1 ? "#c41230" : "#e0e0e0", color: step >= i + 1 ? "#fff" : "#999" }}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span style={{ ...s.stepLabel, color: step >= i + 1 ? "#c41230" : "#999", fontWeight: step === i + 1 ? "700" : "400" }}>{label}</span>
            {i < STEPS.length - 1 && <div style={{ ...s.stepLine, background: step > i + 1 ? "#c41230" : "#e0e0e0" }} />}
          </div>
        ))}
      </div>

      <form onSubmit={handlePlaceOrder} style={s.layout}>
        <div style={s.left}>

          {/* ── STEP 1: Shipping ───────────────────── */}
          {step === 1 && (
            <div style={s.card}>
              <h2 style={s.cardTitle}>📦 Shipping Details</h2>
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>Full Name *</label>
                  <input style={s.input} placeholder="Enter your full name" value={shipping.fullName} onChange={(e) => setShipping({ ...shipping, fullName: e.target.value })} required />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Phone Number *</label>
                  <input style={s.input} placeholder="10-digit mobile number" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} required />
                </div>
              </div>
              <div style={s.formGroup}>
                <label style={s.label}>Full Address *</label>
                <textarea style={{ ...s.input, height: "72px", resize: "vertical" }} placeholder="House no, street, area..." value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} required />
              </div>
              <div style={s.formGrid}>
                <div style={s.formGroup}>
                  <label style={s.label}>City *</label>
                  <input style={s.input} placeholder="City" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} required />
                </div>
                <div style={s.formGroup}>
                  <label style={s.label}>Pincode *</label>
                  <input style={s.input} placeholder="6-digit pincode" value={shipping.pincode} onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })} required />
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

          {/* ── STEP 2: Image Upload ────────────────── */}
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
                        <input
                          type="file"
                          accept="image/*"
                          id={`upload-${item._id}`}
                          style={{ display: "none" }}
                          onChange={(e) => handleImageUpload(e, item._id)}
                        />
                        <label htmlFor={`upload-${item._id}`} style={s.uploadLabel}>
                          {uploadingFor === item._id ? "Uploading..." : item.uploadedImage ? "Change Image" : "📁 Choose Image"}
                        </label>
                        {item.uploadedImage && (
                          <div style={s.uploadedPreview}>
                            <img src={item.uploadedImage} alt="preview" style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px" }} />
                            <span style={{ color: "#2e7d32", fontSize: "0.82rem", fontWeight: "600" }}>✅ Image uploaded</span>
                          </div>
                        )}
                        {item.requiresCustomImage && !item.uploadedImage && (
                          <p style={s.requiredNote}>⚠️ This product requires a custom image to place the order.</p>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: "#999", fontSize: "0.82rem" }}>No custom image needed for this product</p>
                    )}
                  </div>
                </div>
              ))}

              {missingImages.length > 0 && (
                <div style={s.blockWarning}>
                  🚫 You cannot place this order until you upload custom images for: <strong>{missingImages.map((i) => i.name).join(", ")}</strong>
                </div>
              )}

              <div style={s.stepNavRow}>
                <button type="button" style={s.backBtn2} onClick={() => setStep(1)}>← Back</button>
                <button
                  type="button"
                  style={{ ...s.nextBtn, opacity: missingImages.length > 0 ? 0.5 : 1 }}
                  onClick={() => {
                    if (missingImages.length > 0) {
                      toast.error("Upload required images first");
                      return;
                    }
                    setStep(3);
                  }}
                >
                  Review Order →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ─────────────────────── */}
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

              <div style={s.stepNavRow}>
                <button type="button" style={s.backBtn2} onClick={() => setStep(2)}>← Back</button>
                <button type="submit" style={s.placeBtn} disabled={loading || missingImages.length > 0}>
                  {loading ? "Placing Order..." : "Place Order"}
                </button>
              </div>
              <p style={s.payNote}>💵 Payment: Cash on Delivery / Pay at Pickup</p>
            </div>
          )}
        </div>

        {/* Order Summary (sticky) */}
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
        </div>
      </form>
    </div>
  );
}

const s = {
  page: { background: "#fff", maxWidth: "1100px", margin: "0 auto", padding: "32px 40px 60px" },
  title: { fontSize: "1.6rem", fontWeight: "800", color: "#1a1a1a", marginBottom: "24px" },
  stepBar: { display: "flex", alignItems: "center", marginBottom: "32px" },
  stepItem: { display: "flex", alignItems: "center", gap: "8px" },
  stepCircle: { width: "32px", height: "32px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem", flexShrink: 0 },
  stepLabel: { fontSize: "0.82rem", whiteSpace: "nowrap" },
  stepLine: { width: "60px", height: "2px", margin: "0 8px" },
  layout: { display: "flex", gap: "28px", alignItems: "flex-start" },
  left: { flex: 1 },
  card: { background: "#fff", border: "1px solid #e0e0e0", borderRadius: "12px", padding: "24px", marginBottom: "16px" },
  cardTitle: { fontSize: "1rem", fontWeight: "700", color: "#1a1a1a", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid #f0f0f0" },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", color: "#555", fontSize: "0.82rem", fontWeight: "600", marginBottom: "6px" },
  input: { width: "100%", padding: "10px 12px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "0.9rem", background: "#fafafa", boxSizing: "border-box" },
  nextBtn: { background: "#c41230", color: "#fff", border: "none", borderRadius: "6px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", fontSize: "0.9rem" },
  backBtn2: { background: "#fff", color: "#c41230", border: "1px solid #c41230", borderRadius: "6px", padding: "12px 24px", fontWeight: "700", cursor: "pointer", fontSize: "0.9rem" },
  placeBtn: { background: "#c41230", color: "#fff", border: "none", borderRadius: "6px", padding: "12px 32px", fontWeight: "700", cursor: "pointer", fontSize: "0.95rem" },
  payNote: { color: "#999", fontSize: "0.78rem", textAlign: "center", marginTop: "10px" },
  stepNavRow: { display: "flex", gap: "12px", justifyContent: "space-between", marginTop: "20px" },

  // Upload
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

  // Summary sidebar
  summary: { width: "280px", background: "#f7f7f7", borderRadius: "12px", padding: "20px", position: "sticky", top: "120px", flexShrink: 0 },
  summaryTitle: { fontWeight: "800", color: "#1a1a1a", marginBottom: "16px", fontSize: "0.95rem" },
  summaryRow: { display: "flex", justifyContent: "space-between", marginBottom: "8px" },
  summaryLabel: { color: "#666", fontSize: "0.82rem" },
  summaryVal: { color: "#1a1a1a", fontWeight: "600", fontSize: "0.82rem" },
  divider: { height: "1px", background: "#e0e0e0", margin: "12px 0" },
  totalVal: { color: "#c41230", fontWeight: "800", fontSize: "1.1rem" },

  empty: { textAlign: "center", padding: "80px", background: "#fff" },
  backBtn: { background: "#c41230", color: "#fff", padding: "10px 24px", borderRadius: "6px", fontWeight: "700", display: "inline-block", marginTop: "12px" },
};
