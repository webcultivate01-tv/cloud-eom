import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllEventsAdmin,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../../features/events/eventSlice";
import { toast } from "react-toastify";

const BADGE_OPTIONS = ["Announcement", "New Offer", "Flash Sale", "Order Update", "Holiday", "Info"];
const EMPTY_FORM = { title: "", description: "", link: "", badge: "Announcement", isActive: true, expiresAt: "" };

export default function ManageEvents() {
  const dispatch = useDispatch();
  const { events, loading } = useSelector((state) => state.events);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    dispatch(fetchAllEventsAdmin());
  }, [dispatch]);

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false); };

  const handleEdit = (event) => {
    setEditId(event._id);
    setForm({
      title: event.title,
      description: event.description,
      link: event.link || "",
      badge: event.badge || "Announcement",
      isActive: event.isActive,
      expiresAt: event.expiresAt ? event.expiresAt.split("T")[0] : "",
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, expiresAt: form.expiresAt || null };
    let result;
    if (editId) {
      result = await dispatch(updateEvent({ id: editId, eventData: payload }));
    } else {
      result = await dispatch(createEvent(payload));
    }
    if (!result.error) {
      toast.success(editId ? "Event updated!" : "Event created!");
      resetForm();
    } else {
      toast.error(result.payload);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete event "${title}"?`)) return;
    const result = await dispatch(deleteEvent(id));
    if (!result.error) toast.success("Event deleted");
    else toast.error(result.payload);
  };

  const BADGE_COLORS = {
    "New Offer": "#e94560",
    "Flash Sale": "#ff8c00",
    "Order Update": "#87ceeb",
    "Holiday": "#a8d8a8",
    "Info": "#aaa",
    "Announcement": "#ffd700",
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>📢 Events & Announcements</h1>
        <button style={styles.addBtn} onClick={() => { resetForm(); setShowForm((v) => !v); }}>
          {showForm ? "Cancel" : "+ Create Event"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.formTitle}>{editId ? "Edit Event" : "Create New Event / Announcement"}</h2>
          <input style={styles.input} placeholder="Event Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <textarea
            style={{ ...styles.input, height: "90px", resize: "vertical" }}
            placeholder="Description *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <div style={styles.row}>
            <input style={styles.input} placeholder="Link (optional, e.g. /products)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
            <select style={styles.input} value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}>
              {BADGE_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <input style={styles.input} type="date" title="Expiry date (leave blank for no expiry)" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <label style={styles.checkLabel}>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
            <span style={{ color: "#ccc" }}> Active (visible on website)</span>
          </label>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Saving..." : editId ? "Update Event" : "Create Event"}
          </button>
        </form>
      )}

      {/* Events Grid */}
      {loading && !showForm ? (
        <p style={styles.msg}>Loading events...</p>
      ) : events.length === 0 ? (
        <p style={styles.msg}>No events yet. Create your first announcement!</p>
      ) : (
        <div style={styles.grid}>
          {events.map((event) => (
            <div key={event._id} style={{ ...styles.card, opacity: event.isActive ? 1 : 0.5 }}>
              <div style={styles.cardHeader}>
                <span style={{ ...styles.badge, background: BADGE_COLORS[event.badge] || "#aaa", color: "#1a1a2e" }}>
                  {event.badge}
                </span>
                {!event.isActive && <span style={styles.inactivePill}>Hidden</span>}
              </div>
              <h3 style={styles.eventTitle}>{event.title}</h3>
              <p style={styles.eventDesc}>{event.description}</p>
              {event.link && (
                <p style={{ color: "#87ceeb", fontSize: "0.8rem", marginTop: "6px" }}>
                  🔗 {event.link}
                </p>
              )}
              {event.expiresAt && (
                <p style={{ color: "#aaa", fontSize: "0.78rem", marginTop: "4px" }}>
                  ⏳ Expires: {new Date(event.expiresAt).toLocaleDateString("en-IN")}
                </p>
              )}
              <p style={styles.createdDate}>
                Created by {event.createdBy?.name || "Admin"} · {new Date(event.createdAt).toLocaleDateString("en-IN")}
              </p>
              <div style={styles.cardActions}>
                <button style={{ ...styles.actionBtn, background: "#1a4a7a" }} onClick={() => handleEdit(event)}>Edit</button>
                <button style={{ ...styles.actionBtn, background: "#8b0000" }} onClick={() => handleDelete(event._id, event.title)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" },
  title: { color: "#fff", fontSize: "1.4rem", margin: 0 },
  addBtn: { background: "#e94560", border: "none", color: "#fff", padding: "9px 18px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" },
  form: { background: "#1a1a3a", borderRadius: "10px", padding: "20px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" },
  formTitle: { color: "#ffd700", margin: 0, fontSize: "1rem" },
  input: { padding: "9px 12px", borderRadius: "6px", border: "1px solid #333", background: "#0d0d1a", color: "#fff", fontSize: "0.9rem", width: "100%", boxSizing: "border-box" },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" },
  checkLabel: { display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" },
  submitBtn: { padding: "10px 24px", background: "#e94560", border: "none", color: "#fff", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", alignSelf: "flex-start" },
  msg: { color: "#aaa", textAlign: "center", padding: "40px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" },
  card: { background: "#1a1a3a", borderRadius: "10px", padding: "16px" },
  cardHeader: { display: "flex", gap: "8px", marginBottom: "10px", flexWrap: "wrap" },
  badge: { padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold" },
  inactivePill: { background: "#333", color: "#aaa", padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem" },
  eventTitle: { color: "#fff", margin: "0 0 6px", fontSize: "1rem" },
  eventDesc: { color: "#bbb", fontSize: "0.88rem", lineHeight: "1.5" },
  createdDate: { color: "#666", fontSize: "0.75rem", marginTop: "10px" },
  cardActions: { display: "flex", gap: "8px", marginTop: "12px" },
  actionBtn: { border: "none", color: "#fff", padding: "6px 14px", borderRadius: "4px", cursor: "pointer", fontSize: "0.82rem" },
};
