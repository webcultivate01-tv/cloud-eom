import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../features/auth/authSlice";
import { toast } from "react-toastify";

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.auth);

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwSection, setShowPwSection] = useState(false);

  // Keep fields in sync if user changes in Redux (e.g., after save)
  useEffect(() => {
    setName(user?.name || "");
    setPhone(user?.phone || "");
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    if (phone && !/^\d{10}$/.test(phone.trim())) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    const payload = { name: name.trim(), phone: phone.trim() };

    if (showPwSection) {
      if (!currentPassword) {
        toast.error("Enter your current password");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("New password must be at least 6 characters");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match");
        return;
      }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    const result = await dispatch(updateProfile(payload));
    if (!result.error) {
      toast.success("Profile updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPwSection(false);
    } else {
      toast.error(result.payload || "Update failed");
    }
  };

  const initial = user?.name?.[0]?.toUpperCase() || "U";

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Avatar + heading */}
        <div style={s.avatarRow}>
          <div style={s.avatar}>{initial}</div>
          <div>
            <h1 style={s.title}>My Profile</h1>
            <p style={s.subtitle}>{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={s.form}>
          {/* ── Personal Info ─────────────────────────── */}
          <div style={s.section}>
            <h2 style={s.sectionTitle}>Personal Information</h2>

            <div style={s.fieldGroup}>
              <label style={s.label}>Full Name *</label>
              <input
                style={s.input}
                placeholder="Your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Email Address</label>
              <input
                style={{ ...s.input, ...s.inputReadonly }}
                value={user?.email || ""}
                readOnly
                title="Email cannot be changed"
              />
              <p style={s.hint}>Email address cannot be changed.</p>
            </div>

            <div style={s.fieldGroup}>
              <label style={s.label}>Phone Number</label>
              <input
                style={s.input}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={10}
              />
            </div>
          </div>

          {/* ── Password Change ───────────────────────── */}
          <div style={s.section}>
            <div style={s.pwHeader}>
              <h2 style={s.sectionTitle}>Password</h2>
              <button
                type="button"
                style={s.togglePwBtn}
                onClick={() => setShowPwSection((v) => !v)}
              >
                {showPwSection ? "Cancel" : "Change Password"}
              </button>
            </div>

            {showPwSection && (
              <div style={s.pwFields}>
                <div style={s.fieldGroup}>
                  <label style={s.label}>Current Password *</label>
                  <input
                    style={s.input}
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div style={s.grid2}>
                  <div style={s.fieldGroup}>
                    <label style={s.label}>New Password *</label>
                    <input
                      style={s.input}
                      type="password"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div style={s.fieldGroup}>
                    <label style={s.label}>Confirm New Password *</label>
                    <input
                      style={{
                        ...s.input,
                        borderColor:
                          confirmPassword && confirmPassword !== newPassword
                            ? "#e53935"
                            : undefined,
                      }}
                      type="password"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {confirmPassword && confirmPassword !== newPassword && (
                      <p style={{ ...s.hint, color: "#e53935" }}>Passwords do not match</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Save Button ───────────────────────────── */}
          <div style={s.footer}>
            <button type="submit" style={{ ...s.saveBtn, opacity: loading ? 0.7 : 1 }} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: {
    background: "#f7f7f7",
    minHeight: "80vh",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: "40px 16px 60px",
  },
  container: {
    background: "#fff",
    borderRadius: "14px",
    border: "1px solid #e0e0e0",
    padding: "36px 40px",
    width: "100%",
    maxWidth: "600px",
    boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  },

  avatarRow: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "32px",
    paddingBottom: "24px",
    borderBottom: "1px solid #f0f0f0",
  },
  avatar: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    background: "#c41230",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.6rem",
    fontWeight: "800",
    flexShrink: 0,
  },
  title: { fontSize: "1.4rem", fontWeight: "800", color: "#1a1a1a", margin: 0 },
  subtitle: { color: "#888", fontSize: "0.85rem", marginTop: "4px" },

  form: {},
  section: {
    marginBottom: "28px",
    paddingBottom: "24px",
    borderBottom: "1px solid #f5f5f5",
  },
  sectionTitle: {
    fontSize: "0.85rem",
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    marginBottom: "18px",
  },

  fieldGroup: { marginBottom: "16px" },
  label: {
    display: "block",
    color: "#555",
    fontSize: "0.82rem",
    fontWeight: "600",
    marginBottom: "6px",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "0.9rem",
    background: "#fafafa",
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  },
  inputReadonly: { background: "#f0f0f0", color: "#999", cursor: "not-allowed" },
  hint: { color: "#aaa", fontSize: "0.76rem", marginTop: "4px" },

  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },

  pwHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "16px",
  },
  togglePwBtn: {
    background: "none",
    border: "1px solid #c41230",
    color: "#c41230",
    borderRadius: "6px",
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "0.82rem",
    fontWeight: "600",
  },
  pwFields: { display: "flex", flexDirection: "column" },

  footer: { display: "flex", justifyContent: "flex-end", marginTop: "8px" },
  saveBtn: {
    background: "#c41230",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    padding: "13px 36px",
    fontWeight: "700",
    fontSize: "0.95rem",
    cursor: "pointer",
  },
};
