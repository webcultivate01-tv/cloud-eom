import { Link } from "react-router-dom";

const CATEGORIES = ["Cup", "T-Shirt", "Diary", "Pen", "ID Card", "Frame", "Keychain"];

export default function Footer() {
  return (
    <footer style={s.footer}>
      <div style={s.top}>
        {/* Brand */}
        <div style={s.col}>
          <div style={s.brand}>
            <span style={{ fontSize: "1.8rem" }}>🖨️</span>
            <div>
              <p style={s.brandName}>CLOUD GRAPHICS</p>
              <p style={s.brandSub}>AMRAVATI</p>
            </div>
          </div>
          <p style={s.desc}>
            Premium custom gift printing in Amravati. Personalize cups, t-shirts, diaries, and more with your photos and designs.
          </p>
          <p style={{ ...s.desc, marginTop: "12px" }}>
            📍 Amravati, Maharashtra<br />
            📞 +91 00000 00000<br />
            ✉️ info@cloudgraphics.in
          </p>
        </div>

        {/* Quick Links */}
        <div style={s.col}>
          <h4 style={s.colTitle}>Quick Links</h4>
          {[["Home", "/"], ["Products", "/products"], ["My Orders", "/orders"], ["Cart", "/cart"], ["Login", "/login"]].map(([label, to]) => (
            <Link key={to} to={to} style={s.footLink}>{label}</Link>
          ))}
        </div>

        {/* Categories */}
        <div style={s.col}>
          <h4 style={s.colTitle}>Categories</h4>
          {CATEGORIES.map((cat) => (
            <Link key={cat} to={`/products?category=${cat}`} style={s.footLink}>{cat}</Link>
          ))}
        </div>

        {/* Info */}
        <div style={s.col}>
          <h4 style={s.colTitle}>Information</h4>
          {["About Us", "Privacy Policy", "Terms & Conditions", "Shipping Policy", "Return Policy"].map((item) => (
            <span key={item} style={{ ...s.footLink, cursor: "default" }}>{item}</span>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={s.bottom}>
        <p style={s.copy}>© {new Date().getFullYear()} Cloud Graphics Amravati. All rights reserved.</p>
        <div style={s.paymentIcons}>
          {["💳 UPI", "🏦 Net Banking", "💵 COD"].map((m) => (
            <span key={m} style={s.payIcon}>{m}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}

const s = {
  footer: { background: "#1a1a1a", color: "#ccc", marginTop: "auto" },
  top: { display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "40px", padding: "48px 60px", maxWidth: "1400px", margin: "0 auto" },
  col: { display: "flex", flexDirection: "column", gap: "8px" },
  brand: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" },
  brandName: { color: "#fff", fontWeight: "800", fontSize: "1.1rem", letterSpacing: "1px" },
  brandSub: { color: "#c41230", fontSize: "0.65rem", letterSpacing: "3px" },
  desc: { fontSize: "0.83rem", lineHeight: "1.7", color: "#aaa" },
  colTitle: { color: "#fff", fontWeight: "700", fontSize: "0.88rem", letterSpacing: "0.5px", marginBottom: "8px", textTransform: "uppercase" },
  footLink: { color: "#aaa", fontSize: "0.83rem", textDecoration: "none", lineHeight: "1.8", transition: "color 0.2s" },
  bottom: { borderTop: "1px solid #333", padding: "16px 60px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", maxWidth: "1400px", margin: "0 auto" },
  copy: { fontSize: "0.8rem", color: "#777" },
  paymentIcons: { display: "flex", gap: "12px" },
  payIcon: { background: "#333", padding: "4px 10px", borderRadius: "4px", fontSize: "0.75rem", color: "#ccc" },
};
