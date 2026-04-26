import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchProductById, clearSelectedProduct } from "../features/products/productSlice";
import { addToCart } from "../features/cart/cartSlice";
import { toggleFavorite, selectFavoriteIds } from "../features/favorites/favoritesSlice";
import { toast } from "react-toastify";

export default function ProductDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedProduct: product, loading } = useSelector((state) => state.products);
  const favoriteIds = useSelector(selectFavoriteIds);

  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState("desc");
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    dispatch(fetchProductById(id));
    return () => dispatch(clearSelectedProduct());
  }, [dispatch, id]);

  useEffect(() => { setActiveIdx(0); }, [product?._id]);

  const images = product
    ? product.images?.length ? product.images : product.image ? [product.image] : []
    : [];

  const advance = useCallback(() => {
    if (images.length > 1) setActiveIdx((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(advance, 2000);
    return () => clearInterval(timer);
  }, [advance, images.length]);

  if (loading || !product) {
    return (
      <div style={{ padding: "60px", textAlign: "center" }}>
        <div style={{ width: "40px", height: "40px", border: "3px solid #e0e0e0", borderTopColor: "#c41230", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
        <p style={{ color: "#999", marginTop: "16px" }}>Loading product...</p>
      </div>
    );
  }

  const isFav = favoriteIds.has(product._id);

  const handleAddToCart = () => {
    dispatch(addToCart({ ...product, quantity: qty }));
    toast.success(`${product.name} added to cart!`);
  };

  const handleBuyNow = () => {
    dispatch(addToCart({ ...product, quantity: qty }));
    navigate("/cart");
  };

  const handleFavourite = () => {
    dispatch(toggleFavorite(product));
    toast.success(isFav ? "Removed from favourites" : "Added to favourites ❤️");
  };

  const currentImage = images[activeIdx] || "https://placehold.co/500x500/f5f5f5/999?text=Product";

  const hasDiscount = product.originalPrice > 0 && product.originalPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const hasSpecs = product.specifications?.length > 0;
  const TABS = [
    { key: "desc", label: "Description" },
    ...(hasSpecs ? [{ key: "specs", label: "Specifications" }] : []),
    { key: "delivery", label: "Delivery & Returns" },
  ];

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
        {/* ── Image Gallery ─────────────────────────── */}
        <div style={s.imgSide}>
          <div style={s.mainImgWrap}>
            <img key={currentImage} src={currentImage} alt={product.name} style={s.mainImg} />
            {product.requiresCustomImage && (
              <div style={s.customOverlay}>🎨 Upload Your Design</div>
            )}
            {hasDiscount && (
              <div style={s.discountBadge}>{discountPct}% OFF</div>
            )}

            {images.length > 1 && (
              <>
                <button style={{ ...s.slideArrow, left: "10px" }}
                  onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}>‹</button>
                <button style={{ ...s.slideArrow, right: "10px" }}
                  onClick={() => setActiveIdx((i) => (i + 1) % images.length)}>›</button>
                <div style={s.dots}>
                  {images.map((_, i) => (
                    <span key={i} style={{ ...s.dot, ...(i === activeIdx ? s.dotActive : {}) }} onClick={() => setActiveIdx(i)} />
                  ))}
                </div>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div style={s.thumbRow}>
              {images.map((img, i) => (
                <img key={i} src={img} alt={`view-${i}`}
                  style={{ ...s.thumb, border: i === activeIdx ? "2px solid #c41230" : "2px solid #e0e0e0" }}
                  onClick={() => setActiveIdx(i)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Info Panel ────────────────────────────── */}
        <div style={s.infoSide}>
          <div style={s.topMeta}>
            <span style={s.categoryTag}>{product.category}</span>
            {product.brand && <span style={s.brandTag}>by {product.brand}</span>}
            {product.sku && <span style={s.skuTag}>SKU: {product.sku}</span>}
          </div>

          <div style={s.nameRow}>
            <h1 style={s.name}>{product.name}</h1>
            <button style={s.favBtn} onClick={handleFavourite} title={isFav ? "Remove from favourites" : "Add to favourites"}>
              <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{isFav ? "❤️" : "🤍"}</span>
            </button>
          </div>

          {/* Price block */}
          <div style={s.priceRow}>
            <span style={s.price}>₹{product.price.toLocaleString()}</span>
            {hasDiscount && (
              <>
                <span style={s.originalPrice}>₹{product.originalPrice.toLocaleString()}</span>
                <span style={s.discountLabel}>{discountPct}% off</span>
              </>
            )}
          </div>

          {/* Custom image notices */}
          {product.requiresCustomImage && (
            <div style={s.customNotice}>
              <span style={s.customNoticeIcon}>🎨</span>
              <div>
                <p style={{ fontWeight: "700", color: "#c41230", margin: "0 0 4px" }}>Custom Design Required</p>
                <p style={{ color: "#555", fontSize: "0.85rem", margin: 0 }}>You must upload your custom image or design during checkout.</p>
              </div>
            </div>
          )}
          {product.allowCustomImage && !product.requiresCustomImage && (
            <div style={{ ...s.customNotice, background: "#e8f5e9", borderColor: "#a5d6a7" }}>
              <span style={s.customNoticeIcon}>✏️</span>
              <div>
                <p style={{ fontWeight: "700", color: "#2e7d32", margin: "0 0 4px" }}>Custom Design Optional</p>
                <p style={{ color: "#555", fontSize: "0.85rem", margin: 0 }}>You can upload a custom image during checkout, or proceed without one.</p>
              </div>
            </div>
          )}

          <p style={{ ...s.stockStatus, color: product.stock > 0 ? "#2e7d32" : "#c41230" }}>
            {product.stock > 0 ? `✅ In Stock (${product.stock} available)` : "❌ Out of Stock"}
          </p>

          {/* Key Highlights */}
          {product.highlights?.length > 0 && (
            <ul style={s.highlightList}>
              {product.highlights.map((h, i) => (
                <li key={i} style={s.highlightItem}>
                  <span style={s.hlCheck}>✓</span> {h}
                </li>
              ))}
            </ul>
          )}

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

          <div style={s.actions}>
            <button style={s.addBtn} onClick={handleAddToCart} disabled={product.stock === 0}>Add to Cart</button>
            <button style={s.buyBtn} onClick={handleBuyNow} disabled={product.stock === 0}>Buy Now</button>
          </div>

          {/* Service badges */}
          <div style={s.badges}>
            {["🖨️ Premium printing", "📦 Secure packaging", "🚚 Fast delivery", "↩️ Easy returns"].map((b) => (
              <div key={b} style={s.badge}>{b}</div>
            ))}
          </div>

          {/* Weight */}
          {product.weight && (
            <p style={s.metaLine}>⚖️ Weight: <strong>{product.weight}</strong></p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        <div style={s.tabNav}>
          {TABS.map(({ key, label }) => (
            <button key={key} style={{ ...s.tabBtn, ...(tab === key ? s.tabBtnActive : {}) }} onClick={() => setTab(key)}>
              {label}
            </button>
          ))}
        </div>

        <div style={s.tabContent}>
          {tab === "desc" && (
            <p style={s.desc}>{product.description}</p>
          )}

          {tab === "specs" && (
            <table style={s.specTable}>
              <tbody>
                {product.specifications.map((sp, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "#f7f7f7" : "#fff" }}>
                    <td style={s.specKey}>{sp.key}</td>
                    <td style={s.specVal}>{sp.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "delivery" && (
            <div style={s.desc}>
              <p>🚚 <strong>Delivery:</strong> 3–5 business days in Amravati. 5–7 days for other Maharashtra locations.</p>
              {product.returnPolicy ? (
                <p style={{ marginTop: "10px" }}>↩️ <strong>Returns:</strong> {product.returnPolicy}</p>
              ) : (
                <p style={{ marginTop: "10px" }}>↩️ <strong>Returns:</strong> Custom printed products are non-returnable unless defective. Standard products can be returned within 7 days.</p>
              )}
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
  mainImg: { width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s ease" },
  customOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(196,18,48,0.85)", color: "#fff", textAlign: "center", padding: "12px", fontWeight: "700", fontSize: "0.9rem" },
  discountBadge: { position: "absolute", top: "12px", left: "12px", background: "#e53935", color: "#fff", fontWeight: "900", fontSize: "0.8rem", padding: "4px 10px", borderRadius: "4px", letterSpacing: "0.5px" },

  slideArrow: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "1.4rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 },
  dots: { position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "background 0.2s" },
  dotActive: { background: "#fff" },

  thumbRow: { display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" },
  thumb: { width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px", cursor: "pointer", transition: "border-color 0.2s" },

  infoSide: { flex: 1, minWidth: "300px" },
  topMeta: { display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" },
  categoryTag: { background: "#f0f0f0", color: "#666", padding: "4px 12px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },
  brandTag: { color: "#c41230", fontSize: "0.82rem", fontWeight: "600" },
  skuTag: { color: "#aaa", fontSize: "0.75rem" },

  nameRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", margin: "4px 0 8px" },
  name: { color: "#1a1a1a", fontSize: "1.8rem", fontWeight: "800", lineHeight: 1.2, flex: 1 },
  favBtn: { background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0, marginTop: "4px" },

  priceRow: { display: "flex", alignItems: "center", gap: "12px", margin: "12px 0 16px", flexWrap: "wrap" },
  price: { color: "#c41230", fontSize: "2rem", fontWeight: "800" },
  originalPrice: { color: "#aaa", fontSize: "1.1rem", textDecoration: "line-through" },
  discountLabel: { background: "#e8f5e9", color: "#2e7d32", fontWeight: "700", fontSize: "0.82rem", padding: "4px 10px", borderRadius: "4px" },

  customNotice: { background: "#fff5f6", border: "1px solid #f5c6cb", borderRadius: "8px", padding: "14px 16px", display: "flex", gap: "12px", marginBottom: "16px" },
  customNoticeIcon: { fontSize: "1.4rem", flexShrink: 0 },
  stockStatus: { fontSize: "0.88rem", fontWeight: "600", marginBottom: "16px" },

  highlightList: { listStyle: "none", padding: 0, margin: "0 0 20px", display: "flex", flexDirection: "column", gap: "6px" },
  highlightItem: { color: "#333", fontSize: "0.88rem", display: "flex", alignItems: "center", gap: "8px" },
  hlCheck: { color: "#2e7d32", fontWeight: "900", fontSize: "0.9rem", flexShrink: 0 },

  label: { color: "#555", fontWeight: "600", fontSize: "0.88rem" },
  qtyRow: { display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" },
  qtyControl: { display: "flex", alignItems: "center", border: "1px solid #e0e0e0", borderRadius: "6px", overflow: "hidden" },
  qtyBtn: { background: "#f5f5f5", border: "none", width: "36px", height: "36px", fontSize: "1.2rem", cursor: "pointer", color: "#333" },
  qtyVal: { padding: "0 20px", fontWeight: "700", fontSize: "1rem" },

  actions: { display: "flex", gap: "12px", marginBottom: "20px" },
  addBtn: { flex: 1, padding: "14px", border: "2px solid #c41230", color: "#c41230", background: "#fff", borderRadius: "6px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", letterSpacing: "0.5px" },
  buyBtn: { flex: 1, padding: "14px", border: "2px solid #c41230", color: "#fff", background: "#c41230", borderRadius: "6px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", letterSpacing: "0.5px" },

  badges: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "16px" },
  badge: { background: "#f7f7f7", padding: "10px 12px", borderRadius: "6px", fontSize: "0.82rem", color: "#555" },
  metaLine: { color: "#666", fontSize: "0.82rem", marginTop: "4px" },

  tabs: { borderTop: "1px solid #e0e0e0", paddingTop: "32px" },
  tabNav: { display: "flex", gap: "0", borderBottom: "2px solid #e0e0e0", marginBottom: "24px" },
  tabBtn: { padding: "10px 24px", border: "none", background: "transparent", color: "#666", fontWeight: "600", fontSize: "0.9rem", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: "-2px" },
  tabBtnActive: { color: "#c41230", borderBottom: "2px solid #c41230" },
  tabContent: { maxWidth: "800px" },
  desc: { color: "#555", lineHeight: "1.8", fontSize: "0.92rem" },

  specTable: { width: "100%", borderCollapse: "collapse", borderRadius: "8px", overflow: "hidden", border: "1px solid #e0e0e0" },
  specKey: { padding: "10px 16px", color: "#555", fontWeight: "700", fontSize: "0.88rem", width: "200px", borderRight: "1px solid #e0e0e0" },
  specVal: { padding: "10px 16px", color: "#333", fontSize: "0.88rem" },
};
