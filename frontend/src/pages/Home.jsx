import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { fetchActiveEvents } from "../features/events/eventSlice";
import { fetchCategories } from "../features/categories/categorySlice";
import { fetchApprovedReviews, submitReview } from "../features/review/reviewSlice";
import ProductCard from "../components/ProductCard";
import HeroSlider from "../components/HeroSlider";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { Truck, Palette, Star, IndianRupee, ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const REVIEW_EMPTY = { name: "", email: "", rating: 0, message: "" };
const FEATURES = [
  { icon: <Truck size={28} className="text-red-700" />, title: "Fast Delivery", desc: "Quick delivery across Amravati & Maharashtra" },
  { icon: <Palette size={28} className="text-red-700" />, title: "100% Custom Designs", desc: "Upload your photo or design — we print it" },
  { icon: <Star size={28} className="text-red-700" />, title: "Premium Quality", desc: "Durable prints that last for years" },
  { icon: <IndianRupee size={28} className="text-red-700" />, title: "Best Prices", desc: "Affordable prices with bulk discounts" },
];

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1 mt-1">
      {[1,2,3,4,5].map((star) => (
        <button key={star} type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className={`bg-transparent border-none cursor-pointer p-0.5 text-3xl leading-none transition-transform duration-100 ${star <= (hovered || value) ? "text-amber-400 scale-110" : "text-gray-300"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ rating }) {
  return (
    <span className="inline-flex gap-px">
      {[1,2,3,4,5].map((star) => (
        <span key={star} className={`text-base ${star <= rating ? "text-amber-400" : "text-gray-300"}`}>★</span>
      ))}
    </span>
  );
}

export default function Home() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((s) => s.products);
  const { events } = useSelector((s) => s.events);
  const { items: categories } = useSelector((s) => s.categories);
  const { approvedReviews, loading: reviewLoading } = useSelector((s) => s.review);

  const [reviewForm, setReviewForm] = useState(REVIEW_EMPTY);
  const [reviewErrors, setReviewErrors] = useState({});
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const catRailRef = useRef(null);
  const [catArrows, setCatArrows] = useState({ left: false, right: false });
  const [catOverflow, setCatOverflow] = useState(false);
  const [showAllCats, setShowAllCats] = useState(false);

  const syncCatArrows = () => {
    const el = catRailRef.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth + 8;
    setCatOverflow(overflowing);
    setCatArrows({
      left: overflowing && el.scrollLeft > 8,
      right: overflowing && el.scrollLeft + el.clientWidth < el.scrollWidth - 8,
    });
  };

  const scrollCatRail = (dir) => {
    const el = catRailRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  useEffect(() => {
    dispatch(fetchProducts()); dispatch(fetchActiveEvents());
    dispatch(fetchCategories()); dispatch(fetchApprovedReviews());
  }, [dispatch]);

  useEffect(() => {
    syncCatArrows();
    window.addEventListener("resize", syncCatArrows);
    return () => window.removeEventListener("resize", syncCatArrows);
  }, [categories, catOverflow]);

  const featured = products.slice(0, 8);
  const customize = products.filter((p) => p.requiresCustomImage).slice(0, 4);

  const validateReview = () => {
    const e = {};
    if (!reviewForm.name.trim()) e.name = "Name is required";
    if (!reviewForm.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reviewForm.email)) e.email = "Enter a valid email";
    if (!reviewForm.rating) e.rating = "Please select a rating";
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
      setReviewSubmitted(true); setReviewForm(REVIEW_EMPTY); setReviewErrors({}); setShowReviewForm(false);
      toast.success("Review submitted! It will appear after approval.");
    } else { toast.error(result.payload || "Failed to submit. Please try again."); }
  };

  const inputCls = (err) => `w-full border rounded-lg px-3.5 py-2.5 text-sm outline-none font-[inherit] transition-colors ${err ? "border-red-600 bg-red-50" : "border-gray-200 bg-white focus:border-red-600"}`;

  return (
    <div className="bg-white">
      <HeroSlider />

      {/* Events ticker (compact) */}
      {events.length > 0 && (
        <div className="bg-red-50 border-b border-pink-100">
          <div className="max-w-7xl mx-auto flex overflow-x-auto">
            {events.slice(0, 3).map((ev) => (
              <div key={ev._id} className="flex items-center gap-2 px-6 py-2.5 border-r border-pink-100 whitespace-nowrap">
                <span className="bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded">{ev.badge}</span>
                <span className="text-gray-800 text-xs font-medium">{ev.title}</span>
                {ev.link && <Link to={ev.link} className="text-red-700 text-xs font-semibold">View →</Link>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category rail */}
      {categories.length > 0 && (
        <section className="max-w-[1800px] mx-auto px-4 md:px-8 lg:px-10 py-10 md:py-14">
          <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              Shop by Category
            </h2>
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/products" className="text-gray-500 hover:text-red-700 font-medium text-sm mr-1 transition-colors">
                View all
              </Link>
              <button
                type="button"
                aria-label="Previous categories"
                onClick={() => scrollCatRail(-1)}
                disabled={!catArrows.left}
                className="w-9 h-9 rounded-full bg-gray-900 text-white hidden md:flex items-center justify-center transition-all duration-300 hover:bg-red-700 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                aria-label="Next categories"
                onClick={() => scrollCatRail(1)}
                disabled={!catArrows.right}
                className="w-9 h-9 rounded-full bg-gray-900 text-white hidden md:flex items-center justify-center transition-all duration-300 hover:bg-red-700 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <div
            ref={catRailRef}
            onScroll={syncCatArrows}
            className={`grid grid-cols-3 gap-x-3 gap-y-5 md:flex md:gap-y-0 md:overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1 ${
              catOverflow
                ? "md:gap-5 lg:gap-8 md:justify-start md:snap-x md:snap-mandatory"
                : "md:gap-6 md:justify-between"
            }`}
          >
            {categories.map((cat, idx) => (
              <Link
                key={cat._id}
                to={`/products?category=${cat.name}`}
                className={`group md:snap-start no-underline w-full min-w-0 ${
                  !showAllCats && idx >= 6 ? "hidden md:block" : ""
                } ${
                  catOverflow
                    ? "md:shrink-0 md:w-[124px]"
                    : "md:flex-1 md:min-w-[92px] md:max-w-[170px]"
                }`}
              >
                <div className="aspect-square flex items-center justify-center overflow-hidden">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="max-w-full max-h-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.07]"
                    />
                  ) : (
                    <span className="text-4xl opacity-30">{cat.icon || "🏷️"}</span>
                  )}
                </div>
                <p className="mt-3 text-center text-[13px] md:text-sm font-medium text-gray-800 group-hover:text-red-700 transition-colors duration-300 truncate">
                  {cat.name}
                </p>
              </Link>
            ))}
          </div>

          {categories.length > 6 && (
            <div className="mt-6 flex justify-center md:hidden">
              <button
                type="button"
                onClick={() => setShowAllCats((v) => !v)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-gray-300 text-sm font-semibold text-gray-800 bg-white hover:border-red-700 hover:text-red-700 transition-colors duration-300 cursor-pointer"
              >
                {showAllCats ? "Show Less" : "View More Categories"}
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${showAllCats ? "rotate-180" : ""}`}
                />
              </button>
            </div>
          )}
        </section>
      )}

      {/* Events Showcase — visible on website */}
      {events.length > 0 && (
        <section className="bg-gradient-to-b from-red-50/40 to-white px-4 md:px-12 py-12 md:py-16 border-y border-red-100/60">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-red-700 mb-3">
                Latest Updates
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-gray-900 -tracking-wide mb-3"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                Offers & Announcements
              </h2>
              <p className="text-gray-500 text-sm leading-relaxed">
                Stay up to date with our latest offers, flash sales, and important announcements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.slice(0, 6).map((ev) => {
                const Card = ev.link ? Link : "div";
                const cardProps = ev.link ? { to: ev.link } : {};
                return (
                  <Card
                    key={ev._id}
                    {...cardProps}
                    className="group bg-white rounded-2xl overflow-hidden border border-red-100/60 hover:border-red-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col no-underline"
                  >
                    {ev.image ? (
                      <div className="aspect-[16/9] overflow-hidden bg-gray-100">
                        <img
                          src={ev.image}
                          alt={ev.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/9] bg-gradient-to-br from-red-50 via-pink-50 to-amber-50 flex items-center justify-center">
                        <span className="text-5xl opacity-30">📣</span>
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <span className="inline-flex items-center w-fit bg-red-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
                        {ev.badge || "Announcement"}
                      </span>
                      <h3 className="font-black text-gray-900 text-lg leading-snug mb-2 group-hover:text-red-700 transition-colors">
                        {ev.title}
                      </h3>
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 flex-1">
                        {ev.description}
                      </p>
                      {ev.expiresAt && (
                        <p className="text-xs text-amber-600 mt-3 flex items-center gap-1 font-semibold">
                          ⏳ Valid till {new Date(ev.expiresAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </p>
                      )}
                      {ev.link && (
                        <p className="text-red-700 font-bold text-sm mt-3 flex items-center gap-1">
                          Learn more <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="bg-[#f7f6f3] px-4 md:px-12 py-12 md:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="font-display text-3xl md:text-[40px] font-bold text-gray-900 tracking-tight leading-none">Featured Products</h2>
              <span className="block w-12 h-[3px] bg-red-700 rounded-full mt-3" />
            </div>
            <Link to="/products" className="text-red-700 font-semibold text-sm whitespace-nowrap pt-2">View All →</Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
              {[...Array(4)].map((_, i) => <div key={i} className="aspect-[4/6.2] bg-gradient-to-r from-gray-100 via-gray-200 to-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : featured.length === 0 ? (
            <p className="text-gray-400 text-center py-10">No products yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
              {featured.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Design Your Own */}
      {customize.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-12 py-10 md:py-12">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="font-display text-3xl md:text-[40px] font-bold text-gray-900 tracking-tight leading-none">Design Your Own</h2>
              <span className="block w-12 h-[3px] bg-red-700 rounded-full mt-3" />
            </div>
            <Link to="/products?type=customize" className="text-red-700 font-semibold text-sm whitespace-nowrap pt-2">View All →</Link>
          </div>
          <p className="text-gray-500 text-sm mb-7 mt-4">Upload your photo and get it printed on premium products</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-5">
            {customize.map((p) => <ProductCard key={p._id} product={p} badge="Customize" />)}
          </div>
        </section>
      )}

      {/* How It Works */}
<section className="bg-white py-24">

  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">

    {/* ───────── Header ───────── */}
<div className="text-center max-w-4xl mx-auto mb-24">

  {/* Top Label */}
  <div className="flex items-center justify-center gap-4 mb-6">

    <div
      className="w-12 h-[1px]"
      style={{ background: "#e3cfc7" }}
    />

    <span
      className="text-xs font-semibold uppercase tracking-[0.35em]"
      style={{ color: "#B51D0F" }}
    >
      How It Works
    </span>

    <div
      className="w-12 h-[1px]"
      style={{ background: "#e3cfc7" }}
    />

  </div>

  {/* Heading */}
  <h4
    style={{
      fontFamily: "'Playfair Display', serif",
      fontWeight: 900,
      fontSize: "clamp(2rem,5vw,4.3rem)",
      color: "#181818",
      letterSpacing: "-0.05em",
      lineHeight: "1.08",
    }}
  >
    Create Your Personalized Product
    <span style={{ color: "#B51D0F" }}> In Just 4 Simple Steps</span>
  </h4>

  {/* Description */}
  <p className="mt-7 text-[15px] leading-[2] text-gray-500 max-w-2xl mx-auto">

    From selecting your product to doorstep delivery,
    we make the customization process smooth, fast, and hassle-free.

  </p>

  {/* Bottom Text */}
  <div className="flex items-center justify-center gap-3 mt-10">

    <div
      className="w-10 h-[1px]"
      style={{ background: "#e5d6d0" }}
    />

    <p className="text-sm text-gray-500">
      Premium Printing • Fast Delivery • Trusted Quality
    </p>

    <div
      className="w-10 h-[1px]"
      style={{ background: "#e5d6d0" }}
    />

  </div>

</div>

    {/* ───────── Steps ───────── */}
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-7">

      {[
        {
          step: "01",
          title: "Choose Product",
          desc: "Pick your favorite custom product.",
        },
        {
          step: "02",
          title: "Upload Design",
          desc: "Add your photo or artwork.",
        },
        {
          step: "03",
          title: "We Print",
          desc: "Premium quality printing process.",
        },
        {
          step: "04",
          title: "Fast Delivery",
          desc: "Delivered safely to your doorstep.",
        },
      ].map((item, index) => (

        <div
          key={item.step}
          className="group relative rounded-[30px] p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_45px_rgba(181,29,15,0.08)]"
          style={{
            border: "1px solid #f1e5df",
            background: "#fff",
            boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#e8c9bf";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#f1e5df";
          }}
        >

          {/* Step Number */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold mb-10"
            style={{
              background:
                "linear-gradient(135deg,#B51D0F 0%, #d55444 100%)",
            }}
          >
            {item.step}
          </div>

          {/* Content */}
          <h3
            className="text-[22px] leading-tight"
            style={{
              color: "#181818",
              fontWeight: 700,
            }}
          >
            {item.title}
          </h3>

          <p className="mt-4 text-[14.5px] leading-[1.9] text-gray-500">
            {item.desc}
          </p>

          {/* Arrow */}
          {index !== 3 && (
            <div
              className="hidden xl:flex absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center text-sm font-semibold z-20"
              style={{
                background: "#fff",
                color: "#B51D0F",
                border: "1px solid #f1e5df",
                boxShadow: "0 8px 20px rgba(0,0,0,0.04)",
              }}
            >
              →
            </div>
          )}

        </div>

      ))}

    </div>

  </div>

</section>

      {/* Customer Reviews */}
     <section
  className="relative py-20 overflow-hidden"
  style={{ background: "#f8f5f2" }}
>

  {/* Background Glow */}
  <div
    className="absolute top-0 right-0 w-[420px] h-[420px] rounded-full blur-3xl opacity-40"
    style={{ background: "#f1d9d3" }}
  />

  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">

    {/* ───────────────── Header ───────────────── */}
<div className="text-center max-w-3xl mx-auto mb-16">

  {/* Top Label */}
  <div className="flex items-center justify-center gap-3 mb-5">

    <div
      className="w-10 h-[1px]"
      style={{ background: "#d7b6af" }}
    />

    <span
      className="text-xs font-bold uppercase tracking-[0.3em]"
      style={{ color: "#B51D0F" }}
    >
      Customer Reviews
    </span>

    <div
      className="w-10 h-[1px]"
      style={{ background: "#d7b6af" }}
    />

  </div>

  {/* Heading */}
  <h2
    className="leading-[1.15]"
    style={{
      fontFamily: "'Playfair Display', serif",
      fontWeight: 900,
      fontSize: "clamp(2.5rem,5vw,4.3rem)",
      color: "#1a1a1a",
      letterSpacing: "-0.03em",
    }}
  >
    Loved By Customers <br />

    <span style={{ color: "#B51D0F" }}>
      Across Amravati
    </span>

  </h2>

  {/* Description */}
  <p className="mt-6 text-gray-600 text-[15px] leading-[2] max-w-2xl mx-auto">

    From custom photo gifts to premium printing services,
    Cloud Graphics has become a trusted choice for customers
    looking for quality, creativity, and memorable gifting experiences.

  </p>

  {/* Bottom Stats */}
  <div className="flex flex-wrap items-center justify-center gap-6 mt-8">

    <div
      className="flex items-center gap-2 px-4 py-2 rounded-full"
      style={{
        background: "#fffdfc",
        border: "1px solid #eadfd8",
      }}
    >

      <span
        className="text-sm font-bold"
        style={{ color: "#B51D0F" }}
      >
        ★ 4.9
      </span>

      <span className="text-sm text-gray-500">
        Customer Rating
      </span>

    </div>

    <div
      className="w-[1px] h-5 hidden sm:block"
      style={{ background: "#ddd0c8" }}
    />

    <div className="text-sm text-gray-500">
      Trusted by <span className="font-semibold text-gray-800">500+</span> Happy Customers
    </div>

  </div>

</div>

    {/* ───────────────── Loading State ───────────────── */}
    {reviewLoading && approvedReviews.length === 0 ? (

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {[...Array(3)].map((_, i) => (

          <div
            key={i}
            className="h-[260px] rounded-[24px] animate-pulse"
            style={{
              background: "#fffdfc",
              border: "1px solid #ebe1db",
            }}
          />

        ))}

      </div>

    ) : approvedReviews.length === 0 ? (

      /* ───────────────── Empty State ───────────────── */
      <div className="text-center py-16">

        <div
          className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-4xl"
          style={{ background: "#fff0ed" }}
        >
          ⭐
        </div>

        <h3
          className="text-3xl"
          style={{
            fontFamily: "'Playfair Display', serif",
            fontWeight: 800,
            color: "#181818",
          }}
        >
          No Reviews Yet
        </h3>

        <p className="text-gray-500 mt-3">
          Be the first customer to share your experience.
        </p>

      </div>

    ) : (

      /* ───────────────── Reviews Grid ───────────────── */
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-7">

  {approvedReviews.slice(0, 6).map((review) => (

    <div
      key={review._id}
      className="group relative overflow-hidden rounded-[26px] p-7 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "#fffdfc",
        border: "1px solid #ebe1db",
        boxShadow: "0 10px 30px rgba(0,0,0,0.04)",
      }}
    >

      {/* Top Accent */}
      <div
        className="w-16 h-[3px] rounded-full mb-6"
        style={{ background: "#B51D0F" }}
      />

      {/* Customer */}
      <div className="flex items-center gap-4 mb-5">

        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{
            background:
              "linear-gradient(135deg,#B51D0F 0%, #cf4c3d 100%)",
          }}
        >
          {review.name[0].toUpperCase()}
        </div>

        {/* Name & Rating */}
        <div>

          <h4 className="text-[17px] font-semibold text-gray-900">
            {review.name}
          </h4>

          <div className="mt-1 flex items-center gap-2">

            <StarDisplay rating={review.rating} />

            <span className="text-xs text-gray-400">
              {review.rating}.0 Rating
            </span>

          </div>

        </div>

      </div>

      {/* Review */}
      <p className="text-[15px] text-gray-600 leading-[2]">

        "{review.message}"

      </p>

      {/* Quote Icon */}
      <div
        className="absolute top-5 right-5 text-6xl leading-none pointer-events-none"
        style={{
          color: "#f3dfda",
          fontFamily: "'Playfair Display', serif",
        }}
      >
        ”
      </div>

    </div>

  ))}

</div>

    )}

    {/* ───────────────── Bottom CTA ───────────────── */}
    <div className="flex justify-center mt-14">

      <button
        onClick={() => {
          setShowReviewForm((v) => !v);
          setReviewSubmitted(false);
        }}
        className="group relative overflow-hidden px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-[2px]"
        style={{
          background: "#B51D0F",
          color: "#fff",
          boxShadow: "0 14px 35px rgba(181,29,15,0.18)",
        }}
      >

        <span className="relative z-10 flex items-center gap-2">
          {showReviewForm ? "Close Review Form" : "✍ Write A Review"}
        </span>

        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

      </button>

    </div>

    {/* ───────────────── Review Form ───────────────── */}
  {showReviewForm && (

  <div className="mt-16 flex justify-center">

    <div
      className="relative overflow-hidden w-full max-w-4xl rounded-[34px]"
      style={{
        background:
          "linear-gradient(180deg,#fffdfc 0%, #fff7f4 100%)",
        border: "1px solid #efe2db",
        boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
      }}
    >

      {/* Top Decorative */}
      <div
        className="h-2 w-full"
        style={{
          background:
            "linear-gradient(90deg,#B51D0F 0%, #d55a4b 50%, #B51D0F 100%)",
        }}
      />

      {/* Background Glow */}
      <div
        className="absolute top-0 right-0 w-60 h-60 rounded-full blur-3xl opacity-40"
        style={{ background: "#f5d7d0" }}
      />

      <div className="relative p-7 md:p-11">

        {/* Header */}
        <div className="text-center mb-10">

          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.25em] mb-4"
            style={{ color: "#B51D0F" }}
          >
            Share Feedback
          </span>

          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 900,
              fontSize: "clamp(2rem,4vw,3rem)",
              color: "#181818",
              letterSpacing: "-0.03em",
            }}
          >
            Share Your Experience
          </h3>

          <p className="text-gray-500 text-[15px] leading-[1.9] mt-4 max-w-xl mx-auto">
            Your review helps other customers trust our quality
            and service.
          </p>

        </div>

        {reviewSubmitted ? (

          <div
            className="rounded-2xl px-6 py-5 text-center"
            style={{
              background: "#f4faf4",
              border: "1px solid #d9ead7",
            }}
          >

            <div className="text-4xl mb-3">✅</div>

            <h4 className="text-lg font-semibold text-green-700">
              Review Submitted Successfully
            </h4>

            <p className="text-sm text-green-600 mt-2">
              Thank you for sharing your valuable feedback.
            </p>

          </div>

        ) : (

          <form
            onSubmit={handleReviewSubmit}
            noValidate
            className="flex flex-col gap-7"
          >

            {/* Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Name */}
              <div>

                <label
                  className="block text-[13px] font-semibold mb-3"
                  style={{ color: "#3f3f3f" }}
                >
                  Full Name
                </label>

                <input
                  placeholder="Enter your full name"
                  value={reviewForm.name}
                  onChange={(e) => {
                    setReviewForm({
                      ...reviewForm,
                      name: e.target.value,
                    });

                    setReviewErrors({
                      ...reviewErrors,
                      name: "",
                    });
                  }}
                  className="w-full h-14 px-5 rounded-2xl border text-[15px] transition-all duration-300 outline-none"
                  style={{
                    borderColor: "#eaded8",
                    background: "#ffffff",
                  }}
                />

                {reviewErrors.name && (
                  <span className="text-xs text-red-600 mt-2 block">
                    {reviewErrors.name}
                  </span>
                )}

              </div>

              {/* Email */}
              <div>

                <label
                  className="block text-[13px] font-semibold mb-3"
                  style={{ color: "#3f3f3f" }}
                >
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={reviewForm.email}
                  onChange={(e) => {
                    setReviewForm({
                      ...reviewForm,
                      email: e.target.value,
                    });

                    setReviewErrors({
                      ...reviewErrors,
                      email: "",
                    });
                  }}
                  className="w-full h-14 px-5 rounded-2xl border text-[15px] transition-all duration-300 outline-none"
                  style={{
                    borderColor: "#eaded8",
                    background: "#ffffff",
                  }}
                />

                {reviewErrors.email && (
                  <span className="text-xs text-red-600 mt-2 block">
                    {reviewErrors.email}
                  </span>
                )}

              </div>

            </div>

            {/* Rating */}
            <div>

              <label
                className="block text-[13px] font-semibold mb-3"
                style={{ color: "#3f3f3f" }}
              >
                Your Rating
              </label>

              <div
                className="rounded-2xl px-5 py-4 border"
                style={{
                  borderColor: "#eaded8",
                  background: "#fff",
                }}
              >
                <StarPicker
                  value={reviewForm.rating}
                  onChange={(v) => {
                    setReviewForm({
                      ...reviewForm,
                      rating: v,
                    });

                    setReviewErrors({
                      ...reviewErrors,
                      rating: "",
                    });
                  }}
                />
              </div>

            </div>

            {/* Review */}
            <div>

              <label
                className="block text-[13px] font-semibold mb-3"
                style={{ color: "#3f3f3f" }}
              >
                Your Review
              </label>

              <textarea
                rows={6}
                placeholder="Tell us about your experience with Cloud Graphics..."
                value={reviewForm.message}
                onChange={(e) => {
                  setReviewForm({
                    ...reviewForm,
                    message: e.target.value,
                  });

                  setReviewErrors({
                    ...reviewErrors,
                    message: "",
                  });
                }}
                className="w-full rounded-2xl border p-5 text-[15px] leading-[1.9] resize-none transition-all duration-300 outline-none"
                style={{
                  borderColor: "#eaded8",
                  background: "#ffffff",
                }}
              />

              {reviewErrors.message && (
                <span className="text-xs text-red-600 mt-2 block">
                  {reviewErrors.message}
                </span>
              )}

            </div>

            {/* Submit */}
            <div className="flex justify-center pt-2">

              <button
                type="submit"
                disabled={reviewLoading}
                className="group relative overflow-hidden px-10 py-4 rounded-2xl text-sm font-semibold transition-all duration-300 hover:-translate-y-1"
                style={{
                  background: reviewLoading
                    ? "#d7c7c2"
                    : "linear-gradient(135deg,#B51D0F 0%, #d55444 100%)",
                  color: "#fff",
                  boxShadow: "0 15px 35px rgba(181,29,15,0.22)",
                }}
              >

                <span className="relative z-10">
                  {reviewLoading
                    ? "Submitting..."
                    : "Submit Review"}
                </span>

                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300" />

              </button>

            </div>

          </form>

        )}

      </div>

    </div>

  </div>

)}

  </div>

     </section>

      {/* CTA Section */}
      <section className="w-full relative overflow-hidden" style={{ background: "#1a0a08" }}>

        {/* Background collage */}
        <div className="absolute inset-0 grid grid-cols-3 opacity-75">
          <div className="bg-cover bg-center" style={{ backgroundImage: "url('/hero_mug.png')" }} />
          <div className="bg-cover bg-center" style={{ backgroundImage: "url('/hero_shirt.png')" }} />
          <div className="bg-cover bg-center" style={{ backgroundImage: "url('/hero_diary.png')" }} />
        </div>
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.38)" }} />

        <div className="relative max-w-4xl mx-auto py-16 px-4 sm:py-20 text-center" style={{ zIndex: 2 }}>
          <div className="inline-flex items-end justify-center w-full mb-8">
            {[
              "https://randomuser.me/api/portraits/men/47.jpg",
              "https://randomuser.me/api/portraits/women/46.jpg",
              "https://randomuser.me/api/portraits/women/43.jpg",
              "https://randomuser.me/api/portraits/men/48.jpg",
              "https://randomuser.me/api/portraits/men/49.jpg",
            ].map((src, i) => {
              const offsets = ["-translate-x-8", "-translate-x-4", "", "translate-x-4", "translate-x-8"];
              const sizes = ["w-10 h-10", "w-12 h-12", "w-14 h-14", "w-12 h-12", "w-10 h-10"];
              return (
                <img key={i} src={src} alt="customer"
                  className={`absolute rounded-full border-4 border-white object-cover ${sizes[i]} transform ${offsets[i]}`}
                />
              );
            })}
          </div>
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#B51D0F", fontFamily: "'Montserrat', sans-serif" }}>
            500+ Happy Customers in Amravati
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif", textShadow: "0 2px 20px rgba(0,0,0,0.5)" }}>
            Print Your Memories,<br />
            <span style={{ color: "#B51D0F" }}>Gift Something Special</span>
          </h2>
          <p className="text-white text-base max-w-xl mx-auto mb-8" style={{ opacity: 0.85, fontFamily: "'Montserrat', sans-serif" }}>
            Custom mugs, t-shirts, diaries & more — personalized with your photos and designs. Order today, delivered fast.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
            <Link to="/products"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-200 no-underline"
              style={{ background: "#fff", color: "#B51D0F", fontFamily: "'Montserrat', sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}
              onMouseOver={e => e.currentTarget.style.background = "#fef2f2"}
              onMouseOut={e => e.currentTarget.style.background = "#fff"}
            >
              Shop Now →
            </Link>
            <Link to="/contact"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-200 no-underline"
              style={{ border: "2px solid rgba(255,255,255,0.7)", color: "#fff", fontFamily: "'Montserrat', sans-serif", background: "transparent" }}
              onMouseOver={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseOut={e => e.currentTarget.style.background = "transparent"}
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <div className="bg-red-50 grid grid-cols-2 md:grid-cols-4 border-t border-red-100">
        {FEATURES.map((f, i) => (
          <div key={f.title} className={`flex items-start gap-3 px-6 py-6 ${i < 3 ? "md:border-r border-red-200" : ""}`}>
            <div className="shrink-0 mt-1">{f.icon}</div>
            <div>
              <p className="text-gray-900 font-bold text-sm mb-1">{f.title}</p>
              <p className="text-gray-600 text-xs leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
