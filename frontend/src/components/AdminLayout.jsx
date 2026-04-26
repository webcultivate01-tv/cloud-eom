import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { clearCart } from "../features/cart/cartSlice";
import { toast } from "react-toastify";

const NAV_LINKS = [
  { to: "/admin/dashboard",  icon: "📊", label: "Dashboard" },
  { to: "/admin/products",   icon: "🛍️", label: "Products" },
  { to: "/admin/orders",     icon: "📦", label: "Orders" },
  { to: "/admin/users",      icon: "👥", label: "Users" },
  { to: "/admin/admins",     icon: "🔐", label: "Admin Management" },
  { to: "/admin/events",      icon: "📢", label: "Events" },
  { to: "/admin/categories", icon: "🏷️", label: "Categories" },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    toast.success("Logged out");
    navigate("/login");
  };

  return (
    <div style={styles.wrapper}>
      {/* ── Sidebar ──────────────────���────────────────── */}
      <aside style={{ ...styles.sidebar, width: sidebarOpen ? "240px" : "64px" }}>
        {/* Logo / Toggle */}
        <div style={styles.sidebarHeader}>
          {sidebarOpen && (
            <span style={styles.brandText}>☁️ Cloud Graphics</span>
          )}
          <button style={styles.toggleBtn} onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "◀" : "▶"}
          </button>
        </div>

        {/* Admin badge */}
        {sidebarOpen && user && (
          <div style={styles.adminBadge}>
            <div style={styles.avatar}>{user.name?.[0]?.toUpperCase()}</div>
            <div>
              <p style={styles.adminName}>{user.name}</p>
              <p style={styles.adminRole}>{user.adminRole || "Admin"}</p>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav style={styles.nav}>
          {NAV_LINKS.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                ...styles.navLink,
                background: isActive ? "#e94560" : "transparent",
                color: isActive ? "#fff" : "#bbb",
                justifyContent: sidebarOpen ? "flex-start" : "center",
              })}
              title={!sidebarOpen ? label : ""}
            >
              <span style={styles.navIcon}>{icon}</span>
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: Back to Site + Logout */}
        <div style={styles.sidebarBottom}>
          <NavLink to="/" style={{ ...styles.navLink, color: "#aaa", justifyContent: sidebarOpen ? "flex-start" : "center" }}>
            <span style={styles.navIcon}>🏠</span>
            {sidebarOpen && <span>Back to Site</span>}
          </NavLink>
          <button
            style={{ ...styles.navLink, border: "none", cursor: "pointer", background: "transparent", width: "100%", justifyContent: sidebarOpen ? "flex-start" : "center" }}
            onClick={handleLogout}
          >
            <span style={styles.navIcon}>🚪</span>
            {sidebarOpen && <span style={{ color: "#e94560" }}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────── */}
      <main style={styles.main}>
        {/* Top bar */}
        <div style={styles.topbar}>
          <h2 style={styles.topbarTitle}>Admin Panel</h2>
          <div style={styles.topbarRight}>
            <span style={styles.topbarUser}>👤 {user?.name}</span>
            <span style={{ ...styles.rolePill, background: user?.adminRole === "superAdmin" ? "#ffd700" : "#87ceeb", color: "#1a1a2e" }}>
              {user?.adminRole || "Admin"}
            </span>
          </div>
        </div>

        {/* Page content */}
        <div style={styles.content}>{children}</div>
      </main>
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    minHeight: "100vh",
    background: "#0d0d1a",
  },
  sidebar: {
    background: "#12122a",
    display: "flex",
    flexDirection: "column",
    transition: "width 0.25s ease",
    overflow: "hidden",
    position: "sticky",
    top: 0,
    height: "100vh",
    borderRight: "1px solid #1e1e3a",
    flexShrink: 0,
  },
  sidebarHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 12px",
    borderBottom: "1px solid #1e1e3a",
  },
  brandText: {
    color: "#e94560",
    fontWeight: "bold",
    fontSize: "0.95rem",
    whiteSpace: "nowrap",
  },
  toggleBtn: {
    background: "#1e1e3a",
    border: "none",
    color: "#fff",
    borderRadius: "4px",
    padding: "4px 8px",
    cursor: "pointer",
    fontSize: "0.75rem",
    flexShrink: 0,
  },
  adminBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 12px",
    borderBottom: "1px solid #1e1e3a",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#e94560",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "1rem",
    flexShrink: 0,
  },
  adminName: { color: "#fff", margin: 0, fontSize: "0.85rem", fontWeight: "bold", whiteSpace: "nowrap" },
  adminRole: { color: "#ffd700", margin: 0, fontSize: "0.72rem", whiteSpace: "nowrap" },
  nav: {
    flex: 1,
    padding: "12px 8px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    overflowY: "auto",
  },
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "0.88rem",
    fontWeight: "500",
    transition: "background 0.15s",
    whiteSpace: "nowrap",
    color: "#bbb",
  },
  navIcon: { fontSize: "1.1rem", flexShrink: 0 },
  sidebarBottom: {
    padding: "8px",
    borderTop: "1px solid #1e1e3a",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  topbar: {
    background: "#12122a",
    borderBottom: "1px solid #1e1e3a",
    padding: "12px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },
  topbarTitle: { color: "#fff", margin: 0, fontSize: "1rem" },
  topbarRight: { display: "flex", alignItems: "center", gap: "10px" },
  topbarUser: { color: "#ccc", fontSize: "0.85rem" },
  rolePill: {
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "0.75rem",
    fontWeight: "bold",
  },
  content: {
    padding: "24px",
    flex: 1,
    overflowY: "auto",
    background: "#0d0d1a",
  },
};
