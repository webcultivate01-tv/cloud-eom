import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById, clearSelectedProduct } from "../features/products/productSlice";
import { addToCart } from "../features/cart/cartSlice";
import { toast } from "react-toastify";

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct: product, loading } = useSelector((state) => state.products);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");

  useEffect(() => {
    dispatch(fetchProductById(id));
    return () => dispatch(clearSelectedProduct());
  }, [dispatch, id]);

  if (loading || !product) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e0e0e0", borderTopColor: "#c41230", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        <p style={{ color: "#999", marginTop: "16px" }}>Loading product...</p>
      </div>
    );
  }

  const handleAddToCart = () => {
    dispatch(addToCart({ ...product, quantity: qty }));
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    dispatch(addToCart({ ...product, quantity: qty }));
    navigate("/cart");
  };

  return (
    <div style={s.page}>
      {/* Breadcrumb */}
      <div style={s.breadcrumb}>
        <Link to="/" style={s.bcLink}>Home</Link> /
        <Link to="/products" style={s.bcLink}> Products</Link> /
        <Link to={`/products?category=${product.category}`} style={s.bcLink}> {product.category}</Link> /
        <span style={{ color: "#333" }}> {product.name}</span>
      </div>

      <div style={s.layout}>
        {/* Image */}
        <div style={s.imgSide}>
          <div style={s.mainImgWrap}>
            <img
              src={product.image || "https://placehold.co/500x500/f5f5f5/999?text=Product"}
              alt={product.name}
              style={s.mainImg}
            />
            {product.requiresCustomImage && (
              <div style={s.customOverlay}>🎨 Upload Your Design</div>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={s.infoSide}>
          <span style={s.categoryTag}>{product.category}</span>
          <h1 style={s.name}>{product.name}</h1>

          <div style={s.priceRow}>
            <span style={s.price}>₹{product.price.toLocaleString()}</span>
          </div>

          {/* Custom Image Notice */}
          {product.requiresCustomImage && (
            <div style={s.customNotice}>
              <span style={s.customNoticeIcon}>🎨</span>
              <div>
                <p style={{ fontWeight: "700", color: "#c41230", margin: "0 0 4px" }}>Custom Design Required</p>
                <p style={{ color: "#555", fontSize: "0.85rem", margin: 0 }}>
                  You must upload your custom image or design during checkout. Order cannot be placed without it.
                </p>
              </div>
            </div>
          )}
          {product.allowCustomImage && !product.requiresCustomImage && (
            <div style={{ ...s.customNotice, background: "#e8f5e9", borderColor: "#a5d6a7" }}>
              <span style={s.customNoticeIcon}>✏️</span>
              <div>
                <p style={{ fontWeight: "700", color: "#2e7d32", margin: "0 0 4px" }}>Custom Design Optional</p>
                <p style={{ color: "#555", fontSize: "0.85rem", margin: 0 }}>
                  You can upload a custom image during checkout, or proceed without one.
                </p>
              </div>
            </div>
          )}

          {/* Stock */}
          <p style={{ ...s.stockStatus, color: product.stock > 0 ? "#2e7d32" : "#c41230" }}>
            {product.stock > 0 ? `✅ In Stock (${product.stock} available)` : "❌ Out of Stock"}
          </p>

          {/* Quantity */}
          {product.stock > 0 && (
            <div style={s.qtyRow}>
              <span style={s.label}>Quantity:</span>
              <div style={s.qtyControl}>
                <button style={s.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span style={s.qtyVal}>{qty}</span>
                <button style={s.qtyBtn} onClick={() => setQty(Math.min(product.stock, qty + 1))}>+</button>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={s.actions}>
            <button style={s.addBtn} onClick={handleAddToCart} disabled={product.stock === 0}>
              Add to Cart
            </button>
            <button style={s.buyBtn} onClick={handleBuyNow} disabled={product.stock === 0}>
              Buy Now
            </button>
          </div>

          {/* Highlights */}
          <div style={s.highlights}>
            {["🖨️ Premium quality printing", "📦 Secure packaging", "🚚 Fast local delivery", "💯 100% satisfaction guaranteed"].map((h) => (
              <div key={h} style={s.highlight}>{h}</div>
            ))}
          </div>
        </div>
      </div>

      {/* Description Tabs */}
      <div style={s.tabs}>
        <div style={s.tabNav}>
          {["desc", "delivery"].map((t) => (
            <button key={t} style={{ ...s.tabBtn, ...(tab === t ? s.tabBtnActive : {}) }} onClick={() => setTab(t)}>
              {t === "desc" ? "Description" : "Delivery & Returns"}
            </button>
          ))}
        </div>
        <div style={s.tabContent}>
          {tab === "desc" ? (
            <p style={s.desc}>{product.description}</p>
          ) : (
            <div style={s.desc}>
              <p>🚚 <strong>Delivery:</strong> 3–5 business days in Amravati. 5–7 days for other Maharashtra locations.</p>
              <p style={{ marginTop: "10px" }}>↩️ <strong>Returns:</strong> Custom printed products are non-returnable unless defective. Standard products can be returned within 7 days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { background: "#fff", maxWidth: "1400px", margin: "0 auto", padding: "24px 60px 60px" },
  breadcrumb: { fontSize: "0.8rem", color: "#999", marginBottom: "24px" },
  bcLink: { color: "#999", marginRight: "4px" },
  layout: { display: "flex", gap: "60px", marginBottom: "48px", flexWrap: "wrap" },
  imgSide: { flex: "0 0 480px" },
  mainImgWrap: { position: "relative", background: "#f7f7f7", borderRadius: "12px", overflow: "hidden", aspectRatio: "1" },
  mainImg: { width: "100%", height: "100%", objectFit: "cover" },
  customOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(196,18,48,0.85)", color: "#fff", textAlign: "center", padding: "12px", fontWeight: "700", fontSize: "0.9rem" },
  infoSide: { flex: 1, minWidth: "300px" },
  categoryTag: { background: "#f0f0f0", color: "#666", padding: "4px 12px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
  name: { color: "#1a1a1a", fontSize: "1.8rem", fontWeight: "800", margin: "12px 0 8px", lineHeight: 1.2 },
  priceRow: { display: "flex", alignItems: "center", gap: "12px", margin: "16px 0" },
  price: { color: "#c41230", fontSize: "2rem", fontWeight: "800" },
  customNotice: { background: "#fff5f6", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "14px 16px", display: "flex", gap: "12px", marginBottom: "16px" },
  customNoticeIcon: { fontSize: "1.4rem", flexShrink: 0 },
  stockStatus: { fontSize: "0.88rem", fontWeight: "600", marginBottom: "20px" },
  label: { color: "#555", fontWeight: "600", fontSize: "0.88rem" },
  qtyRow: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  qtyControl: { display: "flex", alignItems: "center", border: "1px solid #e0e0e0", borderRadius: "6px", overflow: "hidden" },
  qtyBtn: { background: "#f5f5f5", border: "none", width: "36px", height: "36px", fontSize: "1.2rem", cursor: "pointer", color: "#333" },
  qtyVal: { padding: "0 20px", fontWeight: "700", fontSize: "1rem" },
  actions: { display: "flex", gap: "12px", marginBottom: "24px" },
  addBtn: { flex: 1, padding: "14px", border: "2px solid #c41230", color: "#c41230", background: "#fff", borderRadius: "6px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.5px" },
  buyBtn: { flex: 1, padding: "14px", border: "2px solid #c41230", color: "#fff", background: "#c41230", borderRadius: "6px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", transition: "all 0.2s", letterSpacing: "0.5px" },
  highlights: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  highlight: { background: "#f7f7f7", padding: "10px 12px", borderRadius: "6px", fontSize: "0.82rem", color: "#555" },
  tabs: { borderTop: "1px solid #e0e0e0", paddingTop: "32px" },
  tabNav: { display: "flex", gap: "0", borderBottom: "2px solid #e0e0e0", marginBottom: "24px" },
  tabBtn: { padding: "10px 24px", border: "none", background: "transparent", color: "#666", fontWeight: "600", fontSize: "0.9rem", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: "-2px", transition: "all 0.2s" },
  tabBtnActive: { color: "#c41230", borderBottom: "2px solid #c41230" },
  tabContent: { maxWidth: "800px" },
  desc: { color: "#555", lineHeight: "1.8", fontSize: "0.92rem" },
};
