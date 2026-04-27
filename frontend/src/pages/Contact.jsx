import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { submitInquiry } from "../features/inquiry/inquirySlice";
import { toast } from "react-toastify";

const EMPTY = { name: "", email: "", phone: "", subject: "", message: "" };

const SUBJECTS = [
  "Order / Delivery Issue",
  "Custom Printing Query",
  "Bulk Order Enquiry",
  "Product Information",
  "Payment / Refund",
  "Other",
];

export default function Contact() {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.inquiry);

  const [form, setForm]       = useState(EMPTY);
  const [errors, setErrors]   = useState({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim())                          e.name    = "Name is required";
    if (!form.email.trim())                         e.email   = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim())                         e.phone   = "Phone number is required";
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(form.phone))      e.phone = "Enter a valid phone number";
    if (!form.subject)                              e.subject = "Please select a subject";
    if (!form.message.trim())                       e.message = "Message is required";
    else if (form.message.trim().length < 10)       e.message = "Message must be at least 10 characters";
    return e;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = await dispatch(submitInquiry(form));
    if (!result.error) {
      toast.success("Inquiry submitted! Check your email for confirmation.");
      setForm(EMPTY);
      setErrors({});
      setSubmitted(true);
    } else {
      toast.error(result.payload || "Failed to submit. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div style={s.page}>
        <div style={s.successBox}>
          <div style={s.successIcon}>✅</div>
          <h2 style={s.successTitle}>Inquiry Sent!</h2>
          <p style={s.successText}>
            Thank you for reaching out. We've received your inquiry and sent a confirmation to your
            email. Our team will get back to you within <strong>24–48 hours</strong>.
          </p>
          <button style={s.backBtn} onClick={() => setSubmitted(false)}>
            Send Another Inquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* ── Hero ─────────────────────────────────────── */}
      <div style={s.hero}>
        <h1 style={s.heroTitle}>Contact Us</h1>
        <p style={s.heroSub}>
          Have a question or need help? Drop us a message and we'll get back to you shortly.
        </p>
      </div>

      <div style={s.container}>
        <div style={s.grid}>

          {/* ── Info Panel ──────────────────────────── */}
          <aside style={s.infoPanel}>
            <h2 style={s.infoTitle}>Get in Touch</h2>
            <p style={s.infoText}>
              We're here to help with any questions about our products, custom printing, bulk orders,
              or anything else. Reach out using the form or via the details below.
            </p>

            {[
              { icon: "📍", label: "Address",   value: "Cloud Graphics Amravati, Maharashtra, India" },
              { icon: "📞", label: "Phone",      value: "+91 XXXXX XXXXX" },
              { icon: "📧", label: "Email",      value: "cloudgraphics@example.com" },
              { icon: "🕐", label: "Hours",      value: "Mon – Sat: 10 AM – 7 PM" },
            ].map(({ icon, label, value }) => (
              <div key={label} style={s.infoItem}>
                <span style={s.infoItemIcon}>{icon}</span>
                <div>
                  <p style={s.infoItemLabel}>{label}</p>
                  <p style={s.infoItemValue}>{value}</p>
                </div>
              </div>
            ))}

            <div style={s.divider} />
            <p style={s.responseNote}>
              ⚡ We typically respond within <strong>24–48 hours</strong> on business days.
            </p>
          </aside>

          {/* ── Form ────────────────────────────────── */}
          <div style={s.formCard}>
            <h2 style={s.formTitle}>Send Us a Message</h2>

            <form onSubmit={handleSubmit} noValidate style={s.form}>

              {/* Name + Email */}
              <div style={s.row}>
                <Field
                  label="Full Name *"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange}
                  error={errors.name}
                />
                <Field
                  label="Email Address *"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                />
              </div>

              {/* Phone + Subject */}
              <div style={s.row}>
                <Field
                  label="Phone Number *"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={handleChange}
                  error={errors.phone}
                />
                <div style={s.fieldWrap}>
                  <label style={s.label}>Subject *</label>
                  <select
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    style={{ ...s.input, ...(errors.subject ? s.inputError : {}) }}
                  >
                    <option value="">— Select a subject —</option>
                    {SUBJECTS.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  {errors.subject && <span style={s.errorMsg}>{errors.subject}</span>}
                </div>
              </div>

              {/* Message */}
              <div style={s.fieldWrap}>
                <label style={s.label}>Message / Inquiry Description *</label>
                <textarea
                  name="message"
                  rows={5}
                  placeholder="Describe your inquiry in detail..."
                  value={form.message}
                  onChange={handleChange}
                  style={{ ...s.input, ...s.textarea, ...(errors.message ? s.inputError : {}) }}
                />
                {errors.message && <span style={s.errorMsg}>{errors.message}</span>}
                <span style={s.charCount}>{form.message.length} characters</span>
              </div>

              <button type="submit" disabled={loading} style={{ ...s.submitBtn, ...(loading ? s.submitBtnDisabled : {}) }}>
                {loading ? "Sending…" : "Send Inquiry ✉️"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, type, placeholder, value, onChange, error }) {
  return (
    <div style={s.fieldWrap}>
      <label style={s.label}>{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{ ...s.input, ...(error ? s.inputError : {}) }}
      />
      {error && <span style={s.errorMsg}>{error}</span>}
    </div>
  );
}

const s = {
  page: { background: "#f8f8f8", minHeight: "80vh" },

  hero: {
    background: "linear-gradient(135deg, #c41230 0%, #8b0d22 100%)",
    color: "#fff",
    textAlign: "center",
    padding: "60px 24px 40px",
  },
  heroTitle: { fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: "900", margin: "0 0 12px", letterSpacing: "-0.5px" },
  heroSub:   { fontSize: "1rem", opacity: 0.9, margin: 0, maxWidth: "540px", marginLeft: "auto", marginRight: "auto" },

  container: { maxWidth: "1100px", margin: "0 auto", padding: "40px 20px 60px" },
  grid:      { display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: "32px", alignItems: "start" },

  /* Info panel */
  infoPanel: { background: "#fff", borderRadius: "14px", padding: "32px 28px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0" },
  infoTitle: { fontSize: "1.2rem", fontWeight: "800", color: "#1a1a1a", margin: "0 0 12px" },
  infoText:  { color: "#666", fontSize: "0.9rem", lineHeight: "1.7", margin: "0 0 24px" },
  infoItem:  { display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "18px" },
  infoItemIcon: { fontSize: "1.2rem", lineHeight: 1, marginTop: "2px", flexShrink: 0 },
  infoItemLabel: { fontSize: "0.75rem", fontWeight: "700", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 2px" },
  infoItemValue: { fontSize: "0.9rem", color: "#333", margin: 0, fontWeight: "500" },
  divider:   { borderTop: "1px solid #f0f0f0", margin: "24px 0" },
  responseNote: { fontSize: "0.85rem", color: "#777", lineHeight: "1.6", margin: 0 },

  /* Form card */
  formCard:  { background: "#fff", borderRadius: "14px", padding: "36px 32px", boxShadow: "0 2px 12px rgba(0,0,0,0.07)", border: "1px solid #f0f0f0" },
  formTitle: { fontSize: "1.2rem", fontWeight: "800", color: "#1a1a1a", margin: "0 0 24px" },
  form:      { display: "flex", flexDirection: "column", gap: "18px" },
  row:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },

  fieldWrap: { display: "flex", flexDirection: "column", gap: "5px", flex: 1 },
  label:     { fontSize: "0.8rem", fontWeight: "700", color: "#555", letterSpacing: "0.2px" },
  input: {
    border: "1.5px solid #e0e0e0",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "0.92rem",
    color: "#1a1a1a",
    outline: "none",
    transition: "border-color 0.2s",
    background: "#fff",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  inputError: { borderColor: "#c41230", background: "#fff9f9" },
  textarea:   { resize: "vertical", minHeight: "110px" },
  errorMsg:   { color: "#c41230", fontSize: "0.78rem", fontWeight: "600" },
  charCount:  { color: "#bbb", fontSize: "0.75rem", textAlign: "right", marginTop: "-2px" },

  submitBtn: {
    background: "#c41230",
    color: "#fff",
    border: "none",
    borderRadius: "9px",
    padding: "13px 28px",
    fontSize: "0.95rem",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "6px",
    transition: "background 0.2s, transform 0.1s",
    letterSpacing: "0.3px",
  },
  submitBtnDisabled: { background: "#e0a0ab", cursor: "not-allowed" },

  /* Success */
  successBox: {
    maxWidth: "500px", margin: "80px auto", textAlign: "center",
    background: "#fff", borderRadius: "16px", padding: "48px 40px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)", border: "1px solid #f0f0f0",
  },
  successIcon:  { fontSize: "3.5rem", marginBottom: "16px" },
  successTitle: { fontSize: "1.6rem", fontWeight: "900", color: "#1a1a1a", margin: "0 0 12px" },
  successText:  { color: "#666", fontSize: "0.95rem", lineHeight: "1.7", margin: "0 0 28px" },
  backBtn: {
    background: "#c41230", color: "#fff", border: "none", borderRadius: "8px",
    padding: "12px 24px", fontSize: "0.9rem", fontWeight: "700", cursor: "pointer",
  },
};
