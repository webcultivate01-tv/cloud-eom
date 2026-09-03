import { Link } from "react-router-dom";
import logoImg from "../assets/Cloud Graphics Logo New White.png";

// Google Fonts — Playfair Display + Montserrat
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800;900&family=Montserrat:wght@700&display=swap";
fontLink.rel = "stylesheet";
if (!document.head.querySelector("[href*='Playfair+Display']")) document.head.appendChild(fontLink);

const CATEGORIES = ["Cup", "T-Shirt", "Diary", "Pen", "ID Card", "Frame", "Keychain", "Banner"];
const QUICK_LINKS = [["Home", "/"], ["Products", "/products"], ["My Orders", "/orders"], ["Cart", "/cart"], ["Contact Us", "/contact"], ["Login", "/login"]];
const INFO = [
  { label: "About Us", to: "/about" },
  { label: "Privacy Policy", to: "/contact" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Shipping Policy", to: "/shipping-policy" },
  { label: "Return Policy", to: "/return-policy" },
];

const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B51D0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconPhone = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B51D0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconMail = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B51D0F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconPrinter = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
    <rect x="6" y="14" width="12" height="8"/>
  </svg>
);
const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);
const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const IconFacebook = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);
const IconWhatsapp = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer style={{ background: "#f8f5f2", borderTop: "1px solid #e8e2db" }} className="mt-auto">

      {/* ── CTA Strip ── */}
      <div style={{ background: "linear-gradient(120deg, #B51D0F, #7a1208)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 46, height: 46, background: "rgba(255,255,255,0.16)" }}>
              <IconPrinter />
            </div>
            <div>
              <p className="m-0" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 15, color: "#fff" }}>
                Got a design in mind?
              </p>
              <p className="m-0 mt-0.5" style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12.5, color: "rgba(255,255,255,0.8)" }}>
                Custom printing on cups, tees, banners &amp; more — start today.
              </p>
            </div>
          </div>
          <Link
            to="/products"
            className="no-underline flex-shrink-0"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              color: "#B51D0F",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: 13,
              padding: "9px 20px",
              borderRadius: 24,
              whiteSpace: "nowrap",
            }}
          >
            Start Customizing <IconArrow />
          </Link>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-14">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-x-5 gap-y-7 sm:gap-8 lg:gap-10">

          {/* ── 1. Brand Column ── */}
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-5">
            <Link to="/" className="flex items-center gap-3 w-fit no-underline">
              <img src={logoImg} alt="Cloud Graphics" style={{ height: 48, width: "auto" }} />
              <div>
                <p className="m-0 leading-none" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: "18px", letterSpacing: "0.12em", color: "#B51D0F" }}>CLOUD GRAPHICS</p>
                <p className="m-0 mt-1" style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: "8px", letterSpacing: "0.5em", color: "#aaa" }}>AMRAVATI</p>
              </div>
            </Link>

            <p className="text-sm text-gray-500 leading-relaxed m-0">
              Premium custom gift printing in Amravati. Personalize cups, t-shirts, diaries & more with your photos and designs.
            </p>

            {/* Contact info */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-start gap-2.5 text-sm text-gray-500">
                <IconMapPin />
                <span className="leading-relaxed">Shivaji Chowk, Akoli Rd, Amravati, Maharashtra 444607</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-gray-500">
                <IconPhone />
                <span>093076 41746</span>
              </div>
              <div className="flex items-start gap-2.5 text-sm text-gray-500">
                <IconMail />
                <span>info@cloudgraphics.in</span>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-2 mt-1">
              {[
                { icon: <IconInstagram />, label: "Instagram" },
                { icon: <IconFacebook />, label: "Facebook" },
                { icon: <IconWhatsapp />, label: "WhatsApp" },
              ].map(({ icon, label }) => (
                <button key={label} aria-label={label}
                  className="w-8 h-8 rounded-lg border flex items-center justify-center transition-all"
                  style={{ borderColor: '#B51D0F', color: '#B51D0F', background: '#fff5f5' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='#B51D0F'; e.currentTarget.style.color='#fff';}}
                  onMouseLeave={e=>{e.currentTarget.style.background='#fff5f5'; e.currentTarget.style.color='#B51D0F';}}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* ── 2. Quick Links ── */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold tracking-widest text-gray-900 uppercase pb-2.5 border-b border-gray-100 m-0">
              Quick Links
            </h4>
            {QUICK_LINKS.map(([label, to]) => (
              <Link key={to} to={to}
                className="flex items-center gap-2 text-sm text-gray-500 transition-colors no-underline group"
                onMouseEnter={e=>e.currentTarget.style.color='#B51D0F'}
                onMouseLeave={e=>e.currentTarget.style.color=''}>
                <span className="text-gray-300 group-hover:text-red-400 transition-colors"><IconArrow /></span>
                {label}
              </Link>
            ))}
          </div>

          {/* ── 3. Categories ── */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-bold tracking-widest text-gray-900 uppercase pb-2.5 border-b border-gray-100 m-0">
              Categories
            </h4>
            {CATEGORIES.map((cat) => (
              <Link key={cat} to={`/products?category=${cat}`}
                className="flex items-center gap-2 text-sm text-gray-500 transition-colors no-underline group"
                onMouseEnter={e=>e.currentTarget.style.color='#B51D0F'}
                onMouseLeave={e=>e.currentTarget.style.color=''}>
                <span className="text-gray-300 group-hover:text-red-400 transition-colors"><IconArrow /></span>
                {cat}
              </Link>
            ))}
          </div>

          {/* ── 4. Information ── */}
          <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
            <h4 className="text-xs font-bold tracking-widest text-gray-900 uppercase pb-2.5 border-b border-gray-100 m-0">
              Information
            </h4>
            <div className="grid grid-cols-2 gap-x-5 gap-y-3 sm:flex sm:flex-col sm:gap-3">
            {INFO.map(({ label, to }) => (
              <Link key={to} to={to}
                className="flex items-center gap-2 text-sm text-gray-500 no-underline group transition-colors"
                onMouseEnter={e => e.currentTarget.style.color = '#B51D0F'}
                onMouseLeave={e => e.currentTarget.style.color = ''}>
                <span className="text-gray-300"><IconArrow /></span>
                {label}
              </Link>
            ))}
            </div>
          </div>

          {/* ── 5. Find Us ── */}
          <div className="col-span-2 lg:col-span-1 flex flex-col gap-4">
            {/* Google Map */}
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm w-full" style={{ height: 180 }}>
              <iframe
                title="Cloud Graphics Amravati"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3727.4449190429455!2d77.74044537471084!3d20.8944121923805!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bd6bb252ee3027d%3A0x8bcfbf0424a4bfb5!2sCloud%20Ghaphics!5e0!3m2!1sen!2sin!4v1778563342904!5m2!1sen!2sin"
                width="100%"
                height="180"
                style={{ border: 0, display: "block" }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div style={{ borderTop: "3px solid #B51D0F", background: "#231f1c" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-2">
          <p className="text-xs text-center sm:text-left m-0" style={{ color: "#a39d95" }}>
            © {new Date().getFullYear()} <span className="font-semibold" style={{ color: "#fff" }}>Cloud Graphics Amravati</span>. All rights reserved.
          </p>
          <p className="text-xs text-center sm:text-right m-0" style={{ color: "#a39d95" }}>
            Developed &amp; Manage By{" "}
            <a
              href="https://tejasmehar.in"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold no-underline transition-colors"
              style={{ color: "#fff" }}
              onMouseEnter={e => e.currentTarget.style.color = '#B51D0F'}
              onMouseLeave={e => e.currentTarget.style.color = '#fff'}
            >
              Tejas Mehar
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
