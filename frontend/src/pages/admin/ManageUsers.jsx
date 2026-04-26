import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllUsers, toggleBlockUser, deleteUser } from "../../features/users/userSlice";
import { toast } from "react-toastify";

export default function ManageUsers() {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.users);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const handleToggleBlock = async (user) => {
    const action = user.isBlocked ? "Unblock" : "Block";
    if (!window.confirm(`${action} ${user.name}?`)) return;
    const result = await dispatch(toggleBlockUser(user._id));
    if (!result.error) toast.success(`User ${action.toLowerCase()}ed successfully`);
    else toast.error(result.payload);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete "${user.name}"? This cannot be undone.`)) return;
    const result = await dispatch(deleteUser(user._id));
    if (!result.error) toast.success("User deleted");
    else toast.error(result.payload);
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>👥 Users ({users.length})</h1>
        <input
          style={styles.search}
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p style={styles.msg}>Loading users...</p>
      ) : filtered.length === 0 ? (
        <p style={styles.msg}>No users found.</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["#", "Name", "Email", "Phone", "Status", "Joined", "Actions"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => (
                <tr key={user._id} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>
                    <div style={styles.nameCell}>
                      <div style={styles.avatar}>{user.name[0]?.toUpperCase()}</div>
                      {user.name}
                    </div>
                  </td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.phone || "—"}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.statusBadge, background: user.isBlocked ? "#e94560" : "#a8d8a8", color: "#1a1a2e" }}>
                      {user.isBlocked ? "Blocked" : "Active"}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actions}>
                      <button
                        style={{ ...styles.actionBtn, background: user.isBlocked ? "#2a7a2a" : "#b86000" }}
                        onClick={() => handleToggleBlock(user)}
                      >
                        {user.isBlocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        style={{ ...styles.actionBtn, background: "#8b0000" }}
                        onClick={() => handleDelete(user)}
                      >
                        Delete
                      </button>
                    </div>
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
  search: { padding: "8px 14px", borderRadius: "6px", border: "1px solid #333", background: "#12122a", color: "#fff", fontSize: "0.9rem", width: "280px" },
  msg: { color: "#aaa", textAlign: "center", padding: "40px" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#1a1a3a", color: "#ffd700", padding: "12px 14px", textAlign: "left", fontSize: "0.82rem", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #1a1a3a" },
  td: { color: "#ccc", padding: "12px 14px", verticalAlign: "middle", fontSize: "0.88rem" },
  nameCell: { display: "flex", alignItems: "center", gap: "10px" },
  avatar: { width: "32px", height: "32px", borderRadius: "50%", background: "#e94560", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.85rem", flexShrink: 0 },
  statusBadge: { padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "bold" },
  actions: { display: "flex", gap: "6px", flexWrap: "nowrap" },
  actionBtn: { border: "none", color: "#fff", padding: "5px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem", whiteSpace: "nowrap" },
};
