import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const SLIDES = [
  {
    bg: "linear-gradient(135deg, #c41230 0%, #ff6b6b 100%)",
    tag: "New Collection",
    title: "Custom Printed\nGifts & Merchandise",
    sub: "Personalized Cups, T-Shirts, Diaries & More",
    cta: "Shop Now",
    link: "/products",
    accent: "#fff",
  },
  {
    bg: "linear-gradient(135deg, #1a1a2e 0%, #c41230 100%)",
    tag: "Best Sellers",
    title: "Photo Print\nOn Everything",
    sub: "Upload your photo — we'll print it on any product",
    cta: "Explore Products",
    link: "/products?category=Cup",
    accent: "#ffd700",
  },
  {
    bg: "linear-gradient(135deg, #2d1b69 0%, #c41230 100%)",
    tag: "Corporate Gifts",
    title: "Bulk Orders\nFor Businesses",
    sub: "ID Cards, Pens, Diaries with your company branding",
    cta: "View Corporate",
    link: "/products?category=ID+Card",
    accent: "#fff",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => go((current + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, [current]);

  const go = (idx) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => { setCurrent(idx); setAnimating(false); }, 200);
  };

  const slide = SLIDES[current];

  return (
    <div style={{ ...s.slider, background: slide.bg, opacity: animating ? 0.7 : 1, transition: "opacity 0.25s, background 0.5s" }}>
      {/* Content */}
      <div style={s.content}>
        <span style={{ ...s.tag, color: slide.accent }}>{slide.tag}</span>
        <h1 style={s.title}>
          {slide.title.split("\n").map((line, i) => (
            <span key={i} style={{ display: "block" }}>{line}</span>
          ))}
        </h1>
        <p style={s.sub}>{slide.sub}</p>
        <Link to={slide.link} style={{ ...s.cta, borderColor: slide.accent, color: slide.accent }}>
          {slide.cta} →
        </Link>
      </div>

      {/* Decorative circles */}
      <div style={s.deco}>
        <div style={{ ...s.circle, width: 280, height: 280, opacity: 0.15, top: -60, right: -60 }} />
        <div style={{ ...s.circle, width: 180, height: 180, opacity: 0.1, bottom: 20, right: 120 }} />
        <div style={{ ...s.circle, width: 80, height: 80, opacity: 0.2, top: 40, right: 200 }} />
      </div>

      {/* Prev / Next arrows */}
      <button style={{ ...s.arrow, left: 20 }} onClick={() => go((current - 1 + SLIDES.length) % SLIDES.length)}>‹</button>
      <button style={{ ...s.arrow, right: 20 }} onClick={() => go((current + 1) % SLIDES.length)}>›</button>

      {/* Dots */}
      <div style={s.dots}>
        {SLIDES.map((_, i) => (
          <button key={i} style={{ ...s.dot, background: i === current ? "#fff" : "rgba(255,255,255,0.4)", width: i === current ? 24 : 8 }} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  );
}

const s = {
  slider: { position: "relative", minHeight: "460px", display: "flex", alignItems: "center", overflow: "hidden", padding: "60px 80px" },
  content: { position: "relative", zIndex: 2, maxWidth: "600px" },
  tag: { fontSize: "0.85rem", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" },
  title: { color: "#fff", fontSize: "3rem", fontWeight: "900", lineHeight: 1.15, margin: "12px 0 16px", letterSpacing: "-1px" },
  sub: { color: "rgba(255,255,255,0.85)", fontSize: "1rem", marginBottom: "32px", lineHeight: 1.6 },
  cta: { display: "inline-block", border: "2px solid", padding: "13px 32px", borderRadius: "4px", fontWeight: "700", fontSize: "0.9rem", letterSpacing: "1px", transition: "all 0.2s", background: "rgba(255,255,255,0.15)" },
  deco: { position: "absolute", inset: 0, zIndex: 1, overflow: "hidden" },
  circle: { position: "absolute", borderRadius: "50%", background: "#fff" },
  arrow: { position: "absolute", top: "50%", transform: "translateY(-50%)", background: "rgba(255,255,255,0.2)", border: "none", color: "#fff", fontSize: "2rem", width: "44px", height: "44px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3, transition: "background 0.2s" },
  dots: { position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", gap: "8px", zIndex: 3 },
  dot: { height: "8px", borderRadius: "4px", border: "none", cursor: "pointer", transition: "all 0.3s", padding: 0 },
};
