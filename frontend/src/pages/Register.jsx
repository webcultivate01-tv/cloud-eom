import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    dispatch(registerUser(form));
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.brand}>
          <span style={{ fontSize: "2rem" }}>🖨️</span>
          <div>
            <p style={s.brandName}>CLOUD GRAPHICS</p>
            <p style={s.brandSub}>AMRAVATI</p>
          </div>
        </div>
        <h2 style={s.tagline}>Join Cloud Graphics<br />Today</h2>
        <p style={s.desc}>Create your free account and start ordering personalized gifts, merchandise, and more.</p>
        <div style={s.perks}>
          {["📦 Track all your orders", "🎨 Upload custom designs", "🏷️ Exclusive member offers", "🚚 Free delivery on orders"].map((p) => (
            <div key={p} style={s.perk}><span style={{ color: "#ffd700" }}>✓</span> {p}</div>
          ))}
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <h1 style={s.title}>Create Account</h1>
          <p style={s.subtitle}>It's free and takes only a minute</p>

          <form onSubmit={handleSubmit}>
            {[
              { key: "name", label: "Full Name", type: "text", ph: "Your full name" },
              { key: "email", label: "Email Address", type: "email", ph: "you@example.com" },
              { key: "phone", label: "Phone Number (optional)", type: "tel", ph: "+91 00000 00000" },
              { key: "password", label: "Password (min 6 chars)", type: "password", ph: "Create a strong password" },
            ].map(({ key, label, type, ph }) => (
              <div key={key} style={s.formGroup}>
                <label style={s.label}>{label}</label>
                <input
                  style={s.input}
                  type={type}
                  placeholder={ph}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={key !== "phone"}
                />
              </div>
            ))}

            <button style={s.submitBtn} type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p style={s.terms}>
            By registering, you agree to our <span style={{ color: "#c41230" }}>Terms & Conditions</span> and <span style={{ color: "#c41230" }}>Privacy Policy</span>
          </p>

          <p style={s.switchText}>
            Already have an account?{" "}
            <Link to="/login" style={s.switchLink}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", minHeight: "calc(100vh - 120px)", background: "#fff" },
  left: { flex: 1, background: "linear-gradient(135deg, #1a1a2e 0%, #c41230 100%)", padding: "60px 48px", display: "flex", flexDirection: "column", justifyContent: "center" },
  brand: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "32px" },
  brandName: { color: "#fff", fontWeight: "800", fontSize: "1.2rem", letterSpacing: "1px" },
  brandSub: { color: "rgba(255,255,255,0.7)", fontSize: "0.65rem", letterSpacing: "3px" },
  tagline: { color: "#fff", fontSize: "2rem", fontWeight: "900", lineHeight: 1.2, marginBottom: "16px" },
  desc: { color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", lineHeight: 1.7, marginBottom: "32px" },
  perks: { display: "flex", flexDirection: "column", gap: "10px" },
  perk: { color: "rgba(255,255,255,0.9)", fontSize: "0.88rem" },
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" },
  card: { width: "100%", maxWidth: "420px" },
  title: { fontSize: "1.8rem", fontWeight: "800", color: "#1a1a1a", marginBottom: "6px" },
  subtitle: { color: "#999", fontSize: "0.9rem", marginBottom: "28px" },
  formGroup: { marginBottom: "16px" },
  label: { display: "block", color: "#555", fontWeight: "600", fontSize: "0.82rem", marginBottom: "6px" },
  input: { width: "100%", padding: "11px 14px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "0.9rem", background: "#fafafa", boxSizing: "border-box" },
  submitBtn: { width: "100%", padding: "13px", background: "#c41230", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", marginTop: "8px" },
  terms: { color: "#aaa", fontSize: "0.75rem", textAlign: "center", marginTop: "14px", lineHeight: 1.5 },
  switchText: { textAlign: "center", color: "#666", fontSize: "0.85rem", marginTop: "16px" },
  switchLink: { color: "#c41230", fontWeight: "700" },
};
