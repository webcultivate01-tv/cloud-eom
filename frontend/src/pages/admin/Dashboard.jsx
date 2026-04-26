import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDashboardStats } from "../../features/orders/orderSlice";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { stats, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  const statCards = stats
    ? [
        { label: "Total Orders", value: stats.totalOrders, icon: "📦", color: "#87ceeb" },
        { label: "Total Users", value: stats.totalUsers, icon: "👤", color: "#a8d8a8" },
        { label: "Total Products", value: stats.totalProducts, icon: "🛍️", color: "#ffd700" },
        { label: "Revenue (₹)", value: `₹${stats.totalRevenue.toLocaleString()}`, icon: "💰", color: "#e94560" },
      ]
    : [];

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Admin Dashboard</h1>

      {loading ? (
        <p style={{ color: "#aaa" }}>Loading stats...</p>
      ) : (
        <>
          <div style={styles.statsGrid}>
            {statCards.map((s) => (
              <div key={s.label} style={{ ...styles.statCard, borderLeft: `4px solid ${s.color}` }}>
                <span style={{ fontSize: "2rem" }}>{s.icon}</span>
                <div style={{ marginTop: "8px" }}>
                  <p style={{ color: s.color, fontWeight: "bold", fontSize: "1.8rem", margin: 0 }}>{s.value}</p>
                  <p style={{ color: "#aaa", margin: "4px 0 0" }}>{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Order status breakdown */}
          {stats?.statusCounts && (
            <div style={styles.section}>
              <h2 style={styles.sectionTitle}>Orders by Status</h2>
              <div style={styles.statusGrid}>
                {stats.statusCounts.map((s) => (
                  <div key={s._id} style={styles.statusCard}>
                    <p style={{ color: "#ffd700", fontSize: "1.6rem", fontWeight: "bold", margin: 0 }}>{s.count}</p>
                    <p style={{ color: "#ccc", margin: "4px 0 0" }}>{s._id}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick Links */}
      <div style={styles.quickLinks}>
        <Link to="/admin/products" style={styles.qlBtn}>🛍️ Manage Products</Link>
        <Link to="/admin/orders" style={styles.qlBtn}>📦 Manage Orders</Link>
      </div>
    </div>
  );
}

const styles = {
  page: { background: "#0f3460", minHeight: "100vh", padding: "32px" },
  title: { color: "#fff", fontSize: "1.8rem", marginBottom: "24px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" },
  statCard: { background: "#16213e", borderRadius: "10px", padding: "20px", display: "flex", flexDirection: "column" },
  section: { background: "#16213e", borderRadius: "10px", padding: "20px", marginBottom: "24px" },
  sectionTitle: { color: "#fff", marginBottom: "16px" },
  statusGrid: { display: "flex", gap: "16px", flexWrap: "wrap" },
  statusCard: { background: "#0f3460", borderRadius: "8px", padding: "16px", minWidth: "120px", textAlign: "center" },
  quickLinks: { display: "flex", gap: "16px", flexWrap: "wrap" },
  qlBtn: { background: "#e94560", color: "#fff", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold" },
};
