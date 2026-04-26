import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((state) => state.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (user) navigate(user.role === "admin" ? "/admin/dashboard" : "/");
  }, [user, navigate]);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
  }, [error, dispatch]);

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
        <h2 style={s.tagline}>Custom Gift Printing<br />Made Easy</h2>
        <p style={s.desc}>Login to browse, order and track your personalized gifts and merchandise.</p>
        <div style={s.features}>
          {["🎨 Upload your design", "🚚 Fast delivery", "💯 Premium quality"].map((f) => (
            <div key={f} style={s.feat}>{f}</div>
          ))}
        </div>
      </div>

      <div style={s.right}>
        <div style={s.card}>
          <h1 style={s.title}>Welcome Back</h1>
          <p style={s.subtitle}>Sign in to your account</p>

          <form onSubmit={(e) => { e.preventDefault(); dispatch(loginUser(form)); }}>
            <div style={s.formGroup}>
              <label style={s.label}>Email Address</label>
              <input
                style={s.input}
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div style={s.formGroup}>
              <label style={s.label}>Password</label>
              <div style={s.passWrap}>
                <input
                  style={{ ...s.input, paddingRight: "48px" }}
                  type={showPass ? "text" : "password"}
                  placeholder="Your password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button type="button" style={s.eyeBtn} onClick={() => setShowPass(!showPass)}>
                  {showPass ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button style={s.submitBtn} type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p style={s.switchText}>
            Don't have an account?{" "}
            <Link to="/register" style={s.switchLink}>Create one</Link>
          </p>

          <div style={s.divider}><span>or</span></div>
          <Link to="/products" style={s.guestLink}>Continue as Guest →</Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: "flex", minHeight: "calc(100vh - 120px)", background: "#fff" },
  left: { flex: 1, background: "linear-gradient(135deg, #c41230 0%, #8b0a21 100%)", padding: "60px 48px", display: "flex", flexDirection: "column", justifyContent: "center" },
  brand: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "40px" },
  brandName: { color: "#fff", fontWeight: "800", fontSize: "1.2rem", letterSpacing: "1px" },
  brandSub: { color: "rgba(255,255,255,0.7)", fontSize: "0.65rem", letterSpacing: "3px" },
  tagline: { color: "#fff", fontSize: "2.2rem", fontWeight: "900", lineHeight: 1.2, marginBottom: "16px" },
  desc: { color: "rgba(255,255,255,0.8)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "32px" },
  features: { display: "flex", flexDirection: "column", gap: "12px" },
  feat: { color: "rgba(255,255,255,0.9)", fontSize: "0.9rem", fontWeight: "600" },
  right: { flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 32px" },
  card: { width: "100%", maxWidth: "420px" },
  title: { fontSize: "1.8rem", fontWeight: "800", color: "#1a1a1a", marginBottom: "6px" },
  subtitle: { color: "#999", fontSize: "0.9rem", marginBottom: "32px" },
  formGroup: { marginBottom: "18px" },
  label: { display: "block", color: "#555", fontWeight: "600", fontSize: "0.82rem", marginBottom: "6px" },
  input: { width: "100%", padding: "12px 14px", border: "1px solid #e0e0e0", borderRadius: "6px", fontSize: "0.95rem", background: "#fafafa", boxSizing: "border-box", transition: "border-color 0.2s" },
  passWrap: { position: "relative" },
  eyeBtn: { position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem" },
  submitBtn: { width: "100%", padding: "13px", background: "#c41230", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "700", fontSize: "0.95rem", cursor: "pointer", marginTop: "8px", letterSpacing: "0.5px" },
  switchText: { textAlign: "center", color: "#666", fontSize: "0.85rem", marginTop: "20px" },
  switchLink: { color: "#c41230", fontWeight: "700" },
  divider: { textAlign: "center", color: "#ccc", fontSize: "0.8rem", margin: "20px 0", position: "relative", borderTop: "1px solid #e0e0e0", paddingTop: "16px" },
  guestLink: { display: "block", textAlign: "center", color: "#c41230", fontWeight: "600", fontSize: "0.88rem" },
};
