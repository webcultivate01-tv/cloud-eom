import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { clearCart, selectCartCount } from "../features/cart/cartSlice";
import { toast } from "react-toastify";

const CATEGORIES = ["Sale", "New Arrivals", "Cup", "T-Shirt", "Diary", "Pen", "ID Card", "Frame", "Keychain"];

const OFFERS = [
  "Get EXTRA 10% OFF On Orders Above ₹499 | Code: CG10",
  "Free Delivery On All Orders Above ₹299",
  "Get EXTRA 15% OFF On Orders Above ₹999 | Code: CG15",
  "Custom Printing On All Products — Upload Your Design!",
];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const cartCount = useSelector(selectCartCount);

  const [offerIndex, setOfferIndex] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // Rotate offer bar text every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setOfferIndex((i) => (i + 1) % OFFERS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const isActive = (path) => location.pathname === path || location.search.includes(path);

  return (
    <header style={s.header}>
      {/* ── Offer Bar ─────────────────────────────────── */}
      <div style={s.offerBar}>
        <p style={s.offerText}>{OFFERS[offerIndex]}</p>
      </div>

      {/* ── Main Navbar ───────────────────────────────── */}
      <div style={s.mainNav}>
        {/* Left: Search */}
        <div style={s.leftGroup}>
          {!searchOpen ? (
            <button style={s.iconBtn} onClick={() => setSearchOpen(true)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span style={s.iconLabel}>Search</span>
            </button>
          ) : (
            <form onSubmit={handleSearch} style={s.searchForm}>
              <input
                autoFocus
                style={s.searchInput}
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" style={s.searchBtn}>Go</button>
              <button type="button" style={{ ...s.searchBtn, background: "#999" }} onClick={() => setSearchOpen(false)}>✕</button>
            </form>
          )}
        </div>

        {/* Center: Logo */}
        <Link to="/" style={s.logo}>
          <span style={s.logoIcon}>🖨️</span>
          <div>
            <span style={s.logoMain}>CLOUD GRAPHICS</span>
            <span style={s.logoSub}>AMRAVATI</span>
          </div>
        </Link>

        {/* Right: Icons */}
        <div style={s.rightGroup}>
          {user && (
            <Link to="/orders" style={s.iconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
                <polyline points="16 3 12 7 8 3"/>
              </svg>
              <span style={s.iconLabel}>Orders</span>
            </Link>
          )}

          <Link to="/cart" style={s.iconBtn}>
            <div style={{ position: "relative" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && <span style={s.cartBadge}>{cartCount}</span>}
            </div>
            <span style={s.iconLabel}>Cart</span>
          </Link>

          {user ? (
            <div style={{ position: "relative" }}>
              <button style={s.iconBtn} onClick={() => setMenuOpen(!menuOpen)}>
                <div style={s.userAvatar}>{user.name?.[0]?.toUpperCase()}</div>
                <span style={s.iconLabel}>{user.name.split(" ")[0]}</span>
              </button>
              {menuOpen && (
                <div style={s.dropdown}>
                  {user.role === "admin" && (
                    <Link to="/admin/dashboard" style={s.dropItem} onClick={() => setMenuOpen(false)}>
                      🛠️ Admin Panel
                    </Link>
                  )}
                  <Link to="/orders" style={s.dropItem} onClick={() => setMenuOpen(false)}>
                    📦 My Orders
                  </Link>
                  <button style={s.dropItem} onClick={handleLogout}>
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" style={s.iconBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span style={s.iconLabel}>Login</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Category Nav ──────────────────────────────── */}
      <nav style={s.categoryNav}>
        <div style={s.categoryInner}>
          {CATEGORIES.map((cat) => {
            const query = cat === "Sale" ? "?sale=true" : cat === "New Arrivals" ? "?sort=newest" : `?category=${cat}`;
            const active = location.search.includes(cat) || (cat === "Sale" && location.search.includes("sale"));
            return (
              <Link
                key={cat}
                to={`/products${query}`}
                style={{ ...s.catLink, ...(active ? s.catLinkActive : {}) }}
              >
                {cat.toUpperCase()}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}

const s = {
  header: { position: "sticky", top: 0, zIndex: 200, background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.1)" },

  // Offer bar
  offerBar: { background: "#c41230", padding: "8px 16px", textAlign: "center" },
  offerText: { color: "#fff", fontSize: "0.82rem", fontWeight: "500", letterSpacing: "0.3px", transition: "all 0.3s ease" },

  // Main nav
  mainNav: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 32px", borderBottom: "1px solid #e0e0e0" },
  leftGroup: { display: "flex", alignItems: "center", gap: "16px", flex: 1 },
  rightGroup: { display: "flex", alignItems: "center", gap: "20px", flex: 1, justifyContent: "flex-end" },

  // Logo
  logo: { display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" },
  logoIcon: { fontSize: "2rem" },
  logoMain: { display: "block", color: "#c41230", fontSize: "1.3rem", fontWeight: "800", letterSpacing: "1px", lineHeight: 1 },
  logoSub: { display: "block", color: "#666", fontSize: "0.65rem", letterSpacing: "3px" },

  // Icon buttons
  iconBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", background: "none", border: "none", cursor: "pointer", color: "#1a1a1a", fontSize: "0.68rem", padding: "4px", position: "relative" },
  iconLabel: { fontSize: "0.68rem", color: "#555", fontWeight: "500" },
  cartBadge: { position: "absolute", top: "-6px", right: "-8px", background: "#c41230", color: "#fff", borderRadius: "50%", width: "17px", height: "17px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: "bold" },
  userAvatar: { width: "22px", height: "22px", borderRadius: "50%", background: "#c41230", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.75rem" },

  // Search
  searchForm: { display: "flex", gap: "6px", alignItems: "center" },
  searchInput: { border: "2px solid #c41230", borderRadius: "4px", padding: "6px 12px", fontSize: "0.9rem", width: "240px" },
  searchBtn: { background: "#c41230", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 12px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold" },

  // Dropdown
  dropdown: { position: "absolute", top: "100%", right: 0, background: "#fff", border: "1px solid #e0e0e0", borderRadius: "8px", boxShadow: "0 4px 16px rgba(0,0,0,0.12)", minWidth: "160px", zIndex: 300, overflow: "hidden" },
  dropItem: { display: "block", padding: "11px 16px", color: "#1a1a1a", fontSize: "0.88rem", cursor: "pointer", background: "none", border: "none", width: "100%", textAlign: "left", textDecoration: "none", transition: "background 0.15s" },

  // Category nav
  categoryNav: { background: "#fff", borderTop: "1px solid #e0e0e0" },
  categoryInner: { display: "flex", overflowX: "auto", padding: "0 32px" },
  catLink: { display: "inline-block", padding: "12px 16px", color: "#333", fontSize: "0.78rem", fontWeight: "600", letterSpacing: "0.5px", whiteSpace: "nowrap", borderBottom: "2px solid transparent", transition: "all 0.2s" },
  catLinkActive: { color: "#c41230", borderBottom: "2px solid #c41230" },
};
