import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { fetchActiveEvents } from "../features/events/eventSlice";
import { fetchCategories } from "../features/categories/categorySlice";
import ProductCard from "../components/ProductCard";
import HeroSlider from "../components/HeroSlider";
import { Link } from "react-router-dom";

const CAT_COLORS = ["#fff3e0","#e8f5e9","#e3f2fd","#fce4ec","#f3e5f5","#e0f7fa","#fff8e1","#fafafa"];

const FEATURES = [
  { icon: "🚚", title: "Fast Delivery", desc: "Quick delivery across Amravati & Maharashtra" },
  { icon: "🎨", title: "100% Custom Designs", desc: "Upload your photo or design — we print it" },
  { icon: "⭐", title: "Premium Quality", desc: "Durable prints that last for years" },
  { icon: "💰", title: "Best Prices", desc: "Affordable prices with bulk discounts" },
];

export default function Home() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((state) => state.products);
  const { events } = useSelector((state) => state.events);
  const { items: categories } = useSelector((state) => state.categories);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchActiveEvents());
    dispatch(fetchCategories());
  }, [dispatch]);

  const featured = products.slice(0, 8);
  const customize = products.filter((p) => p.requiresCustomImage).slice(0, 4);

  return (
    <div style={s.page}>
      {/* Hero Slider */}
      <HeroSlider />

      {/* Announcement Events Banner */}
      {events.length > 0 && (
        <div style={s.eventsBanner}>
          <div style={s.eventsInner}>
            {events.slice(0, 3).map((ev) => (
              <div key={ev._id} style={s.eventChip}>
                <span style={s.eventBadge}>{ev.badge}</span>
                <span style={s.eventTitle}>{ev.title}</span>
                {ev.link && <Link to={ev.link} style={s.eventLink}>View →</Link>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Grid */}
      <section style={s.section}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Shop by Category</h2>
          <Link to="/products" style={s.viewAll}>View All →</Link>
        </div>
        <div style={s.catGrid}>
          {categories.map((cat, i) => (
            <Link key={cat._id} to={`/products?category=${cat.name}`} style={{ ...s.catCard, background: CAT_COLORS[i % CAT_COLORS.length] }}>
              <span style={s.catIcon}>{cat.icon || "🏷️"}</span>
              <p style={s.catName}>{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section style={{ ...s.section, background: "#f7f7f7", padding: "48px 60px" }}>
        <div style={s.sectionHeader}>
          <h2 style={s.sectionTitle}>Featured Products</h2>
          <Link to="/products" style={s.viewAll}>View All →</Link>
        </div>
        {loading ? (
          <div style={s.loadingGrid}>
            {[...Array(4)].map((_, i) => <div key={i} style={s.skeleton} />)}
          </div>
        ) : featured.length === 0 ? (
          <p style={s.emptyMsg}>No products yet. Check back soon!</p>
        ) : (
          <div style={s.productGrid}>
            {featured.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        )}
      </section>

      {/* Customize Section */}
      {customize.length > 0 && (
        <section style={s.section}>
          <div style={s.sectionHeader}>
            <h2 style={s.sectionTitle}>🎨 Design Your Own</h2>
            <Link to="/products?type=customize" style={s.viewAll}>View All →</Link>
          </div>
          <p style={s.sectionSub}>Upload your photo and get it printed on premium products</p>
          <div style={s.productGrid}>
            {customize.map((p) => <ProductCard key={p._id} product={p} badge="Customize" />)}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section style={s.howSection}>
        <h2 style={{ ...s.sectionTitle, textAlign: "center", marginBottom: "40px" }}>How It Works</h2>
        <div style={s.stepsGrid}>
          {[
            { step: "01", title: "Choose Product", desc: "Pick from our range of printable products" },
            { step: "02", title: "Upload Design", desc: "Upload your photo, logo or custom artwork" },
            { step: "03", title: "Place Order", desc: "Review and confirm your personalized order" },
            { step: "04", title: "Receive Delivery", desc: "Get your custom product delivered fast" },
          ].map((item) => (
            <div key={item.step} style={s.stepCard}>
              <div style={s.stepNum}>{item.step}</div>
              <h3 style={s.stepTitle}>{item.title}</h3>
              <p style={s.stepDesc}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Strip */}
      <div style={s.featuresStrip}>
        {FEATURES.map((f) => (
          <div key={f.title} style={s.feature}>
            <span style={s.featureIcon}>{f.icon}</span>
            <div>
              <p style={s.featureTitle}>{f.title}</p>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page: { background: "#fff" },

  // Events banner
  eventsBanner: { background: "#fff9f9", borderBottom: "1px solid #fce4ec" },
  eventsInner: { display: "flex", gap: "0", overflowX: "auto", maxWidth: "1400px", margin: "0 auto" },
  eventChip: { display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRight: "1px solid #fce4ec", whiteSpace: "nowrap" },
  eventBadge: { background: "#c41230", color: "#fff", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: "700" },
  eventTitle: { color: "#1a1a1a", fontSize: "0.82rem", fontWeight: "500" },
  eventLink: { color: "#c41230", fontSize: "0.78rem", fontWeight: "600" },

  // Sections
  section: { padding: "48px 60px", maxWidth: "1400px", margin: "0 auto" },
  sectionHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" },
  sectionTitle: { fontSize: "1.5rem", fontWeight: "800", color: "#1a1a1a", letterSpacing: "-0.3px" },
  sectionSub: { color: "#666", fontSize: "0.9rem", marginTop: "-20px", marginBottom: "24px" },
  viewAll: { color: "#c41230", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "0.5px" },

  // Category grid
  catGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "16px" },
  catCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "24px 12px", borderRadius: "12px", border: "1px solid #f0f0f0", transition: "transform 0.2s, box-shadow 0.2s", cursor: "pointer" },
  catIcon: { fontSize: "2rem" },
  catName: { color: "#1a1a1a", fontSize: "0.82rem", fontWeight: "700", textAlign: "center" },

  // Products grid
  productGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" },

  // Skeleton
  loadingGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" },
  skeleton: { height: "300px", background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)", borderRadius: "10px" },
  emptyMsg: { color: "#999", textAlign: "center", padding: "40px" },

  // How it works
  howSection: { padding: "60px", background: "#f7f7f7" },
  stepsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", maxWidth: "1200px", margin: "0 auto" },
  stepCard: { background: "#fff", borderRadius: "12px", padding: "28px 24px", textAlign: "center", border: "1px solid #e0e0e0" },
  stepNum: { width: "48px", height: "48px", borderRadius: "50%", background: "#c41230", color: "#fff", fontSize: "1.1rem", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" },
  stepTitle: { color: "#1a1a1a", fontWeight: "700", marginBottom: "8px", fontSize: "0.95rem" },
  stepDesc: { color: "#666", fontSize: "0.83rem", lineHeight: 1.6 },

  // Features
  featuresStrip: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "#1a1a1a", padding: "28px 60px", gap: "0" },
  feature: { display: "flex", alignItems: "flex-start", gap: "14px", padding: "8px 24px", borderRight: "1px solid #333" },
  featureIcon: { fontSize: "1.8rem", flexShrink: 0 },
  featureTitle: { color: "#fff", fontWeight: "700", fontSize: "0.88rem", marginBottom: "4px" },
  featureDesc: { color: "#999", fontSize: "0.78rem", lineHeight: 1.5 },
};
