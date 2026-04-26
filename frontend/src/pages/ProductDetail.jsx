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

  // Reset slide index when product loads
  useEffect(() => {
    setActiveIdx(0);
  }, [product?._id]);

  // Derive the full images list
  const images = product
    ? product.images?.length
      ? product.images
      : product.image
      ? [product.image]
      : []
    : [];

  // Auto-slide every 2 seconds when multiple images exist
  const advance = useCallback(() => {
    if (images.length > 1) {
      setActiveIdx((i) => (i + 1) % images.length);
    }
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

  const currentImage =
    images[activeIdx] ||
    "https://placehold.co/500x500/f5f5f5/999?text=Product";

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

            {/* Slide arrows */}
            {images.length > 1 && (
              <>
                <button
                  style={{ ...s.slideArrow, left: "10px" }}
                  onClick={() => setActiveIdx((i) => (i - 1 + images.length) % images.length)}
                >‹</button>
                <button
                  style={{ ...s.slideArrow, right: "10px" }}
                  onClick={() => setActiveIdx((i) => (i + 1) % images.length)}
                >›</button>

                {/* Dot indicators */}
                <div style={s.dots}>
                  {images.map((_, i) => (
                    <span
                      key={i}
                      style={{ ...s.dot, ...(i === activeIdx ? s.dotActive : {}) }}
                      onClick={() => setActiveIdx(i)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div style={s.thumbRow}>
              {images.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`view-${i}`}
                  style={{
                    ...s.thumb,
                    border: i === activeIdx ? "2px solid #c41230" : "2px solid #e0e0e0",
                  }}
                  onClick={() => setActiveIdx(i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Info Panel ────────────────────────────── */}
        <div style={s.infoSide}>
          <span style={s.categoryTag}>{product.category}</span>

          <div style={s.nameRow}>
            <h1 style={s.name}>{product.name}</h1>
            {/* Favourite heart button */}
            <button style={s.favBtn} onClick={handleFavourite} title={isFav ? "Remove from favourites" : "Add to favourites"}>
              <span style={{ fontSize: "1.6rem", lineHeight: 1 }}>{isFav ? "❤️" : "🤍"}</span>
            </button>
          </div>

          <div style={s.priceRow}>
            <span style={s.price}>₹{product.price.toLocaleString()}</span>
          </div>

          {/* Custom image notices */}
          {product.requiresCustomImage && (
            <div style={s.customNotice}>
              <span style={s.customNoticeIcon}>🎨</span>
              <div>
                <p style={{ fontWeight: "700", color: "#c41230", margin: "0 0 4px" }}>Custom Design Required</p>
                <p style={{ color: "#555", fontSize: "0.85rem", margin: 0 }}>
                  You must upload your custom image or design during checkout.
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

          <p style={{ ...s.stockStatus, color: product.stock > 0 ? "#2e7d32" : "#c41230" }}>
            {product.stock > 0 ? `✅ In Stock (${product.stock} available)` : "❌ Out of Stock"}
          </p>

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
            <button style={s.addBtn} onClick={handleAddToCart} disabled={product.stock === 0}>
              Add to Cart
            </button>
            <button style={s.buyBtn} onClick={handleBuyNow} disabled={product.stock === 0}>
              Buy Now
            </button>
          </div>

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
  mainImg: { width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.3s ease" },
  customOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(196,18,48,0.85)", color: "#fff", textAlign: "center", padding: "12px", fontWeight: "700", fontSize: "0.9rem" },

  slideArrow: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(0,0,0,0.45)", color: "#fff", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "1.4rem", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 },
  dots: { position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "6px" },
  dot: { width: "8px", height: "8px", borderRadius: "50%", background: "rgba(255,255,255,0.5)", cursor: "pointer", transition: "background 0.2s" },
  dotActive: { background: "#fff" },

  thumbRow: { display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" },
  thumb: { width: "70px", height: "70px", objectFit: "cover", borderRadius: "6px", cursor: "pointer", transition: "border-color 0.2s" },

  infoSide: { flex: 1, minWidth: "300px" },
  categoryTag: { background: "#f0f0f0", color: "#666", padding: "4px 12px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" },

  nameRow: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", margin: "12px 0 8px" },
  name: { color: "#1a1a1a", fontSize: "1.8rem", fontWeight: "800", lineHeight: 1.2, flex: 1 },
  favBtn: { background: "none", border: "none", cursor: "pointer", padding: "4px", flexShrink: 0, marginTop: "4px" },

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
  addBtn: { flex: 1, padding: "14px", border: "2px solid #c41230", color: "#c41230", background: "#fff", borderRadius: "6px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", letterSpacing: "0.5px" },
  buyBtn: { flex: 1, padding: "14px", border: "2px solid #c41230", color: "#fff", background: "#c41230", borderRadius: "6px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", letterSpacing: "0.5px" },
  highlights: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" },
  highlight: { background: "#f7f7f7", padding: "10px 12px", borderRadius: "6px", fontSize: "0.82rem", color: "#555" },
  tabs: { borderTop: "1px solid #e0e0e0", paddingTop: "32px" },
  tabNav: { display: "flex", gap: "0", borderBottom: "2px solid #e0e0e0", marginBottom: "24px" },
  tabBtn: { padding: "10px 24px", border: "none", background: "transparent", color: "#666", fontWeight: "600", fontSize: "0.9rem", cursor: "pointer", borderBottom: "2px solid transparent", marginBottom: "-2px" },
  tabBtnActive: { color: "#c41230", borderBottom: "2px solid #c41230" },
  tabContent: { maxWidth: "800px" },
  desc: { color: "#555", lineHeight: "1.8", fontSize: "0.92rem" },
};
