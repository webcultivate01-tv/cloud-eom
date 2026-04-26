import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCart } from "../features/cart/cartSlice";
import { toggleFavorite, selectFavoriteIds } from "../features/favorites/favoritesSlice";
import { toast } from "react-toastify";

export default function ProductCard({ product, badge }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const favoriteIds = useSelector(selectFavoriteIds);
  const [hovered, setHovered] = useState(false);

  const isFav = favoriteIds.has(product._id);
  const cardImage = product.images?.[0] || product.image || null;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    dispatch(addToCart({ ...product, quantity: 1 }));
    toast.success(`${product.name} added to cart!`);
  };

  const handleFav = (e) => {
    e.stopPropagation();
    dispatch(toggleFavorite(product));
    toast.success(isFav ? "Removed from favourites" : "Added to favourites ❤️");
  };

  return (
    <div
      className="product-card"
      style={{ ...s.card, boxShadow: hovered ? "0 6px 24px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.07)" }}
      onClick={() => navigate(`/products/${product._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image container */}
      <div style={s.imgWrap}>
        <img
          src={cardImage || "https://placehold.co/300x300/f5f5f5/999?text=No+Image"}
          alt={product.name}
          style={{ ...s.img, transform: hovered ? "scale(1.04)" : "scale(1)" }}
        />

        {/* Favourite heart */}
        <button style={s.favBtn} onClick={handleFav} title={isFav ? "Remove from favourites" : "Add to favourites"}>
          {isFav ? "❤️" : "🤍"}
        </button>

        {/* Badges */}
        <div style={s.badges}>
          {badge && <span style={{ ...s.badge, background: "#c41230" }}>{badge}</span>}
          {product.requiresCustomImage && (
            <span style={{ ...s.badge, background: "#1a1a2e" }}>🎨 Custom Print</span>
          )}
          {!product.isAvailable && (
            <span style={{ ...s.badge, background: "#999" }}>Out of Stock</span>
          )}
        </div>

        {/* Quick Add button (shows on hover) */}
        {product.isAvailable && !product.requiresCustomImage && (
          <button
            style={{ ...s.quickAdd, opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(8px)" }}
            onClick={handleAddToCart}
          >
            + Add to Cart
          </button>
        )}
        {product.isAvailable && product.requiresCustomImage && (
          <button
            style={{ ...s.quickAdd, opacity: hovered ? 1 : 0, transform: hovered ? "translateY(0)" : "translateY(8px)", background: "#1a1a2e" }}
            onClick={(e) => { e.stopPropagation(); navigate(`/products/${product._id}`); }}
          >
            🎨 Customize Now
          </button>
        )}
      </div>

      {/* Info */}
      <div style={s.info}>
        <p style={s.category}>{product.category}</p>
        <h3 style={s.name}>{product.name}</h3>
        <div style={s.priceRow}>
          <span style={s.price}>₹{product.price.toLocaleString()}</span>
          {product.requiresCustomImage && (
            <span style={s.customTag}>Upload Design</span>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  card: { background: "#fff", borderRadius: "10px", overflow: "hidden", cursor: "pointer", border: "1px solid #f0f0f0", transition: "box-shadow 0.2s, transform 0.2s" },
  imgWrap: { position: "relative", overflow: "hidden", aspectRatio: "1 / 1", background: "#f7f7f7" },
  favBtn: { position: "absolute", top: "8px", right: "8px", background: "rgba(255,255,255,0.88)", border: "none", borderRadius: "50%", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: "0.9rem", zIndex: 5, boxShadow: "0 1px 4px rgba(0,0,0,0.15)" },
  img: { width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.4s ease" },
  badges: { position: "absolute", top: "10px", left: "10px", display: "flex", flexDirection: "column", gap: "4px" },
  badge: { color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" },
  quickAdd: { position: "absolute", bottom: 0, left: 0, right: 0, background: "#c41230", color: "#fff", border: "none", padding: "12px", fontWeight: "700", fontSize: "0.82rem", cursor: "pointer", transition: "opacity 0.2s, transform 0.2s", letterSpacing: "0.5px" },
  info: { padding: "12px 14px 16px" },
  category: { color: "#999", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" },
  name: { color: "#1a1a1a", fontSize: "0.9rem", fontWeight: "600", marginBottom: "8px", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  priceRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" },
  price: { color: "#c41230", fontSize: "1.05rem", fontWeight: "700" },
  customTag: { background: "#f5e6e9", color: "#c41230", fontSize: "0.68rem", padding: "2px 6px", borderRadius: "4px", fontWeight: "600" },
};
