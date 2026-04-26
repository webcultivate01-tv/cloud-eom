import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllAdmins,
  createAdmin,
  updateAdminRole,
  removeAdmin,
} from "../../features/users/userSlice";
import { toast } from "react-toastify";

const EMPTY_FORM = { name: "", email: "", password: "", phone: "", adminRole: "subAdmin" };

export default function ManageAdmins() {
  const dispatch = useDispatch();
  const { admins, loading } = useSelector((state) => state.users);
  const { user: currentUser } = useSelector((state) => state.auth);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    dispatch(fetchAllAdmins());
  }, [dispatch]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    const result = await dispatch(createAdmin(form));
    if (!result.error) {
      toast.success(`Admin "${form.name}" created!`);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } else {
      toast.error(result.payload);
    }
  };

  const handleRoleChange = async (id, adminRole) => {
    const result = await dispatch(updateAdminRole({ id, adminRole }));
    if (!result.error) toast.success("Role updated");
    else toast.error(result.payload);
  };

  const handleRemove = async (admin) => {
    if (!window.confirm(`Remove "${admin.name}" from admins? They will become a regular user.`)) return;
    const result = await dispatch(removeAdmin(admin._id));
    if (!result.error) toast.success(`${admin.name} removed from admin`);
    else toast.error(result.payload);
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>🔐 Admin Management ({admins.length})</h1>
        <button style={styles.addBtn} onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Add Admin"}
        </button>
      </div>

      {/* Add Admin Form */}
      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <h2 style={styles.formTitle}>Create New Admin Account</h2>
          <div style={styles.formGrid}>
            <input style={styles.input} placeholder="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input style={styles.input} type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <input style={styles.input} type="password" placeholder="Password (min 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <input style={styles.input} placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={styles.label}>Admin Role:</label>
            <div style={styles.radioGroup}>
              {["subAdmin", "superAdmin"].map((role) => (
                <label key={role} style={styles.radioLabel}>
                  <input
                    type="radio"
                    value={role}
                    checked={form.adminRole === role}
                    onChange={() => setForm({ ...form, adminRole: role })}
                  />
                  <span style={{ color: role === "superAdmin" ? "#ffd700" : "#87ceeb" }}>
                    {role === "superAdmin" ? "⭐ Super Admin" : "👤 Sub Admin"}
                  </span>
                </label>
              ))}
            </div>
          </div>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Creating..." : "Create Admin"}
          </button>
        </form>
      )}

      {/* Role Legend */}
      <div style={styles.legend}>
        <span style={styles.legendItem}><span style={{ color: "#ffd700" }}>⭐ Super Admin</span> — Full access, can manage other admins</span>
        <span style={styles.legendItem}><span style={{ color: "#87ceeb" }}>👤 Sub Admin</span> — Limited access, cannot manage other admins</span>
      </div>

      {/* Admins Table */}
      {loading && !showForm ? (
        <p style={styles.msg}>Loading...</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Name", "Email", "Admin Role", "Joined", "Actions"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id} style={{ ...styles.tr, opacity: admin._id === currentUser?._id ? 0.6 : 1 }}>
                  <td style={styles.td}>
                    <div style={styles.nameCell}>
                      <div style={styles.avatar}>{admin.name[0]?.toUpperCase()}</div>
                      <div>
                        <p style={{ color: "#fff", margin: 0 }}>{admin.name}</p>
                        {admin._id === currentUser?._id && (
                          <p style={{ color: "#ffd700", fontSize: "0.75rem", margin: 0 }}>You</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>{admin.email}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.roleBadge, background: admin.adminRole === "superAdmin" ? "#ffd700" : "#87ceeb", color: "#1a1a2e" }}>
                      {admin.adminRole === "superAdmin" ? "⭐ Super Admin" : "👤 Sub Admin"}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(admin.createdAt).toLocaleDateString("en-IN")}</td>
                  <td style={styles.td}>
                    {admin._id !== currentUser?._id ? (
                      <div style={styles.actions}>
                        {/* Toggle role */}
                        <button
                          style={{ ...styles.actionBtn, background: "#1a4a7a" }}
                          onClick={() => handleRoleChange(admin._id, admin.adminRole === "superAdmin" ? "subAdmin" : "superAdmin")}
                        >
                          Make {admin.adminRole === "superAdmin" ? "Sub Admin" : "Super Admin"}
                        </button>
                        <button
                          style={{ ...styles.actionBtn, background: "#8b0000" }}
                          onClick={() => handleRemove(admin)}
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: "#888", fontSize: "0.8rem" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" },
  title: { color: "#fff", fontSize: "1.4rem", margin: 0 },
  addBtn: { background: "#e94560", border: "none", color: "#fff", padding: "9px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  form: { background: "#1a1a3a", borderRadius: "10px", padding: "20px", marginBottom: "24px" },
  formTitle: { color: "#ffd700", marginBottom: "16px", fontSize: "1rem" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" },
  input: { padding: "9px 12px", borderRadius: "6px", border: "1px solid #333", background: "#0d0d1a", color: "#fff", fontSize: "0.9rem" },
  label: { color: "#ccc", fontSize: "0.9rem", display: "block", marginBottom: "8px" },
  radioGroup: { display: "flex", gap: "20px" },
  radioLabel: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#ccc" },
  submitBtn: { padding: "10px 24px", background: "#e94560", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  legend: { display: "flex", gap: "24px", flexWrap: "wrap", marginBottom: "16px", padding: "12px 16px", background: "#1a1a3a", borderRadius: "8px" },
  legendItem: { color: "#aaa", fontSize: "0.85rem" },
  msg: { color: "#aaa", textAlign: "center", padding: "40px" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#1a1a3a", color: "#ffd700", padding: "12px 14px", textAlign: "left", fontSize: "0.82rem" },
  tr: { borderBottom: "1px solid #1a1a3a" },
  td: { color: "#ccc", padding: "12px 14px", verticalAlign: "middle" },
  nameCell: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#e94560", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.85rem", flexShrink: 0 },
  roleBadge: { padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "bold" },
  actions: { display: "flex", gap: "6px", flexWrap: "wrap" },
  actionBtn: { border: "none", color: "#fff", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.78rem" },
};
