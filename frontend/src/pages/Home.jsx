import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { fetchActiveEvents } from "../features/events/eventSlice";
import { fetchCategories } from "../features/categories/categorySlice";
import { fetchApprovedReviews, submitReview } from "../features/review/reviewSlice";
import ProductCard from "../components/ProductCard";
import HeroSlider from "../components/HeroSlider";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const CAT_COLORS = ["#fff3e0","#e8f5e9","#e3f2fd","#fce4ec","#f3e5f5","#e0f7fa","#fff8e1","#fafafa"];
const REVIEW_EMPTY = { name: "", email: "", rating: 0, message: "" };

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "4px", marginTop: "4px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: "none", border: "none", cursor: "pointer", padding: "2px",
            fontSize: "1.6rem", lineHeight: 1,
            color: star <= (hovered || value) ? "#f59e0b" : "#d1d5db",
            transition: "color 0.15s, transform 0.1s",
            transform: star <= (hovered || value) ? "scale(1.15)" : "scale(1)",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }) {
  return (
    <span style={{ display: "inline-flex", gap: "1px" }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} style={{ color: star <= rating ? "#f59e0b" : "#d1d5db", fontSize: "0.95rem" }}>★</span>
      ))}
    </span>
  );
}

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
  const { approvedReviews, loading: reviewLoading } = useSelector((state) => state.review);

  const [reviewForm, setReviewForm]       = useState(REVIEW_EMPTY);
  const [reviewErrors, setReviewErrors]   = useState({});
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showReviewForm, setShowReviewForm]   = useState(false);

  useEffect(() => {
    dispatch(fetchProducts());
    dispatch(fetchActiveEvents());
    dispatch(fetchCategories());
    dispatch(fetchApprovedReviews());
  }, [dispatch]);

  const featured = products.slice(0, 8);
  const customize = products.filter((p) => p.requiresCustomImage).slice(0, 4);

  const validateReview = () => {
    const e = {};
    if (!reviewForm.name.trim())    e.name    = "Name is required";
    if (!reviewForm.email.trim())   e.email   = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reviewForm.email)) e.email = "Enter a valid email";
    if (!reviewForm.rating)         e.rating  = "Please select a rating";
    if (!reviewForm.message.trim()) e.message = "Review message is required";
    else if (reviewForm.message.trim().length < 10) e.message = "At least 10 characters required";
    return e;
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const errs = validateReview();
    if (Object.keys(errs).length) { setReviewErrors(errs); return; }
    const result = await dispatch(submitReview(reviewForm));
    if (!result.error) {
      setReviewSubmitted(true);
      setReviewForm(REVIEW_EMPTY);
      setReviewErrors({});
      setShowReviewForm(false);
      toast.success("Review submitted! It will appear after approval.");
    } else {
      toast.error(result.payload || "Failed to submit. Please try again.");
    }
  };

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

      {/* ── Customer Reviews ──────────────────────────────── */}
      <section style={s.reviewsSection}>
        <div style={s.reviewsInner}>

          {/* Section header */}
          <div style={s.reviewsHeader}>
            <div>
              <h2 style={s.sectionTitle}>⭐ Customer Reviews</h2>
              <p style={{ color: "#666", fontSize: "0.9rem", marginTop: "4px" }}>
                What our customers say about us
              </p>
            </div>
            <button
              onClick={() => { setShowReviewForm((v) => !v); setReviewSubmitted(false); }}
              style={s.writeReviewBtn}
            >
              {showReviewForm ? "✕ Cancel" : "✍️ Write a Review"}
            </button>
          </div>

          {/* Write a Review form */}
          {showReviewForm && (
            <div style={s.reviewFormCard}>
              <h3 style={s.reviewFormTitle}>Share Your Experience</h3>
              {reviewSubmitted ? (
                <div style={s.reviewThanks}>
                  ✅ Thank you! Your review has been submitted and will be visible after approval.
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} noValidate style={s.reviewForm}>
                  <div style={s.reviewFormRow}>
                    <div style={s.reviewField}>
                      <label style={s.reviewLabel}>Your Name *</label>
                      <input
                        style={{ ...s.reviewInput, ...(reviewErrors.name ? s.reviewInputErr : {}) }}
                        placeholder="John Doe"
                        value={reviewForm.name}
                        onChange={(e) => { setReviewForm({ ...reviewForm, name: e.target.value }); setReviewErrors({ ...reviewErrors, name: "" }); }}
                      />
                      {reviewErrors.name && <span style={s.reviewErrMsg}>{reviewErrors.name}</span>}
                    </div>
                    <div style={s.reviewField}>
                      <label style={s.reviewLabel}>Email Address *</label>
                      <input
                        type="email"
                        style={{ ...s.reviewInput, ...(reviewErrors.email ? s.reviewInputErr : {}) }}
                        placeholder="you@example.com"
                        value={reviewForm.email}
                        onChange={(e) => { setReviewForm({ ...reviewForm, email: e.target.value }); setReviewErrors({ ...reviewErrors, email: "" }); }}
                      />
                      {reviewErrors.email && <span style={s.reviewErrMsg}>{reviewErrors.email}</span>}
                    </div>
                  </div>

                  <div style={s.reviewField}>
                    <label style={s.reviewLabel}>Your Rating *</label>
                    <StarPicker
                      value={reviewForm.rating}
                      onChange={(v) => { setReviewForm({ ...reviewForm, rating: v }); setReviewErrors({ ...reviewErrors, rating: "" }); }}
                    />
                    {reviewErrors.rating && <span style={s.reviewErrMsg}>{reviewErrors.rating}</span>}
                  </div>

                  <div style={s.reviewField}>
                    <label style={s.reviewLabel}>Your Review *</label>
                    <textarea
                      rows={4}
                      style={{ ...s.reviewInput, ...s.reviewTextarea, ...(reviewErrors.message ? s.reviewInputErr : {}) }}
                      placeholder="Tell us about your experience with our products and service…"
                      value={reviewForm.message}
                      onChange={(e) => { setReviewForm({ ...reviewForm, message: e.target.value }); setReviewErrors({ ...reviewErrors, message: "" }); }}
                    />
                    {reviewErrors.message && <span style={s.reviewErrMsg}>{reviewErrors.message}</span>}
                  </div>

                  <button
                    type="submit"
                    disabled={reviewLoading}
                    style={{ ...s.submitReviewBtn, ...(reviewLoading ? s.submitReviewBtnDisabled : {}) }}
                  >
                    {reviewLoading ? "Submitting…" : "Submit Review"}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Reviews grid */}
          {reviewLoading && approvedReviews.length === 0 ? (
            <div style={s.reviewsLoadingGrid}>
              {[...Array(3)].map((_, i) => <div key={i} style={s.reviewSkeleton} />)}
            </div>
          ) : approvedReviews.length === 0 ? (
            <div style={s.reviewsEmpty}>
              <p>No reviews yet. Be the first to share your experience!</p>
            </div>
          ) : (
            <div style={s.reviewsGrid}>
              {approvedReviews.slice(0, 6).map((review) => (
                <div key={review._id} style={s.reviewCard}>
                  <div style={s.reviewCardTop}>
                    <div style={s.reviewAvatar}>{review.name[0].toUpperCase()}</div>
                    <div>
                      <p style={s.reviewerName}>{review.name}</p>
                      <StarDisplay rating={review.rating} />
                    </div>
                  </div>
                  <p style={s.reviewMessage}>"{review.message}"</p>
                  <p style={s.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
              ))}
            </div>
          )}
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

  // Customer Reviews
  reviewsSection: { background: "#fff", padding: "60px 0", borderTop: "1px solid #f0f0f0" },
  reviewsInner:   { maxWidth: "1200px", margin: "0 auto", padding: "0 60px" },
  reviewsHeader:  { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "12px" },
  writeReviewBtn: {
    background: "#c41230", color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 20px", fontSize: "0.88rem", fontWeight: "700", cursor: "pointer",
    whiteSpace: "nowrap",
  },
  reviewFormCard: {
    background: "#fafafa", border: "1px solid #e8e8e8", borderRadius: "14px",
    padding: "28px 32px", marginBottom: "36px",
  },
  reviewFormTitle: { fontSize: "1rem", fontWeight: "800", color: "#1a1a1a", marginBottom: "20px" },
  reviewForm:  { display: "flex", flexDirection: "column", gap: "16px" },
  reviewFormRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  reviewField: { display: "flex", flexDirection: "column", gap: "5px" },
  reviewLabel: { fontSize: "0.8rem", fontWeight: "700", color: "#555" },
  reviewInput: {
    border: "1.5px solid #e0e0e0", borderRadius: "8px", padding: "10px 14px",
    fontSize: "0.9rem", color: "#1a1a1a", background: "#fff", outline: "none",
    fontFamily: "inherit", boxSizing: "border-box", width: "100%",
  },
  reviewInputErr: { borderColor: "#c41230", background: "#fff9f9" },
  reviewTextarea: { resize: "vertical", minHeight: "96px" },
  reviewErrMsg:  { color: "#c41230", fontSize: "0.77rem", fontWeight: "600" },
  submitReviewBtn: {
    background: "#c41230", color: "#fff", border: "none", borderRadius: "8px",
    padding: "12px 24px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer",
    width: "fit-content",
  },
  submitReviewBtnDisabled: { background: "#e0a0ab", cursor: "not-allowed" },
  reviewThanks: {
    background: "#f1f8e9", border: "1px solid #c8e6c9", borderRadius: "8px",
    padding: "16px 20px", color: "#2e7d32", fontWeight: "600", fontSize: "0.9rem",
  },
  reviewsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" },
  reviewCard: {
    background: "#fff", border: "1px solid #f0f0f0", borderRadius: "14px", padding: "24px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: "12px",
  },
  reviewCardTop:  { display: "flex", alignItems: "center", gap: "12px" },
  reviewAvatar:   {
    width: "42px", height: "42px", borderRadius: "50%", background: "#c41230",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: "700", fontSize: "1rem", flexShrink: 0,
  },
  reviewerName:   { fontWeight: "700", color: "#1a1a1a", fontSize: "0.9rem", marginBottom: "3px" },
  reviewMessage:  { color: "#555", fontSize: "0.88rem", lineHeight: "1.65", fontStyle: "italic", flex: 1 },
  reviewDate:     { color: "#bbb", fontSize: "0.76rem" },
  reviewsLoadingGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" },
  reviewSkeleton: { height: "160px", background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)", borderRadius: "14px" },
  reviewsEmpty:   { textAlign: "center", padding: "40px", color: "#999", fontSize: "0.9rem" },

  // Features
  featuresStrip: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "#1a1a1a", padding: "28px 60px", gap: "0" },
  feature: { display: "flex", alignItems: "flex-start", gap: "14px", padding: "8px 24px", borderRight: "1px solid #333" },
  featureIcon: { fontSize: "1.8rem", flexShrink: 0 },
  featureTitle: { color: "#fff", fontWeight: "700", fontSize: "0.88rem", marginBottom: "4px" },
  featureDesc: { color: "#999", fontSize: "0.78rem", lineHeight: 1.5 },
};
