import { useDispatch, useSelector } from "react-redux";
import { clearFavorites } from "../features/favorites/favoritesSlice";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Favorites() {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.favorites);

  const handleClearAll = () => {
    if (!window.confirm("Remove all favourites?")) return;
    dispatch(clearFavorites());
    toast.success("Favourites cleared");
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <div>
          <h1 style={s.title}>
            ❤️ My Favourites
            {items.length > 0 && <span style={s.badge}>{items.length}</span>}
          </h1>
          <p style={s.subtitle}>Products you have saved for later</p>
        </div>
        {items.length > 0 && (
          <button style={s.clearBtn} onClick={handleClearAll}>
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div style={s.empty}>
          <span style={s.emptyIcon}>🤍</span>
          <p style={s.emptyText}>No favourites yet</p>
          <p style={s.emptyHint}>
            Tap the heart icon on any product to save it here.
          </p>
          <Link to="/products" style={s.shopBtn}>Browse Products</Link>
        </div>
      ) : (
        <div style={s.grid}>
          {items.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

const s = {
  page: { background: "#fff", minHeight: "80vh", maxWidth: "1400px", margin: "0 auto", padding: "32px 60px 60px" },
  header: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", flexWrap: "wrap", gap: "12px" },
  title: { fontSize: "1.6rem", fontWeight: "800", color: "#1a1a1a", display: "flex", alignItems: "center", gap: "10px", margin: 0 },
  badge: { background: "#c41230", color: "#fff", fontSize: "0.85rem", padding: "2px 10px", borderRadius: "20px", fontWeight: "700" },
  subtitle: { color: "#999", fontSize: "0.85rem", marginTop: "6px" },
  clearBtn: { background: "#fff", border: "1px solid #e0e0e0", color: "#c41230", padding: "8px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.85rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" },
  empty: { textAlign: "center", padding: "80px 20px" },
  emptyIcon: { fontSize: "4rem" },
  emptyText: { fontSize: "1.2rem", fontWeight: "700", color: "#1a1a1a", marginTop: "16px" },
  emptyHint: { color: "#999", fontSize: "0.88rem", marginTop: "8px", marginBottom: "24px" },
  shopBtn: { display: "inline-block", background: "#c41230", color: "#fff", padding: "12px 28px", borderRadius: "6px", fontWeight: "700", textDecoration: "none", fontSize: "0.9rem" },
};
