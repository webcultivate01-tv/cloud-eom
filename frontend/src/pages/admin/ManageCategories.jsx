import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../../features/categories/categorySlice";
import { toast } from "react-toastify";

const ICONS = ["🏷️","👕","☕","📓","✏️","🪪","🖼️","🔑","🎁","🛍️","📦","🎨","🧢","📱","💎"];
const EMPTY_CAT = { name: "", description: "", icon: "🏷️", sortOrder: "0" };

export default function ManageCategories() {
  const dispatch = useDispatch();
  const { items: categories, loading } = useSelector((s) => s.categories);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY_CAT);

  // Which category has its subcategories expanded
  const [expandedCat, setExpandedCat] = useState(null);

  // Subcategory add input per category
  const [subInputs, setSubInputs]   = useState({});   // { catId: newName }
  const [editSub, setEditSub]       = useState(null);  // { catId, subId, name }

  useEffect(() => { dispatch(fetchCategoriesAdmin()); }, [dispatch]);

  const resetForm = () => { setForm(EMPTY_CAT); setEditId(null); setShowForm(false); };

  const handleEdit = (cat) => {
    setEditId(cat._id);
    setForm({ name: cat.name, description: cat.description || "", icon: cat.icon || "🏷️", sortOrder: String(cat.sortOrder ?? 0) });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, sortOrder: Number(form.sortOrder) };
    const result = editId
      ? await dispatch(updateCategory({ id: editId, payload }))
      : await dispatch(createCategory(payload));

    if (!result.error) {
      toast.success(editId ? "Category updated!" : "Category created!");
      resetForm();
    } else {
      toast.error(result.payload || "Failed");
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}" and all its subcategories?`)) return;
    const result = await dispatch(deleteCategory(cat._id));
    if (!result.error) toast.success("Deleted");
    else toast.error(result.payload);
  };

  const handleToggleActive = async (cat) => {
    await dispatch(updateCategory({ id: cat._id, payload: { isActive: !cat.isActive } }));
  };

  // ── Subcategory handlers ──────────────────────────────────────

  const handleAddSub = async (catId) => {
    const name = (subInputs[catId] || "").trim();
    if (!name) return;
    const result = await dispatch(addSubcategory({ catId, name }));
    if (!result.error) {
      toast.success("Subcategory added");
      setSubInputs((p) => ({ ...p, [catId]: "" }));
    } else {
      toast.error(result.payload);
    }
  };

  const handleSaveSubEdit = async () => {
    if (!editSub) return;
    const result = await dispatch(updateSubcategory({
      catId: editSub.catId, subId: editSub.subId, payload: { name: editSub.name },
    }));
    if (!result.error) { toast.success("Updated"); setEditSub(null); }
    else toast.error(result.payload);
  };

  const handleToggleSub = async (catId, sub) => {
    await dispatch(updateSubcategory({ catId, subId: sub._id, payload: { isActive: !sub.isActive } }));
  };

  const handleDeleteSub = async (catId, sub) => {
    if (!window.confirm(`Delete subcategory "${sub.name}"?`)) return;
    const result = await dispatch(deleteSubcategory({ catId, subId: sub._id }));
    if (!result.error) toast.success("Deleted");
    else toast.error(result.payload);
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.title}>Manage Categories</h1>
          <p style={s.subtitle}>{categories.length} categories configured</p>
        </div>
        <button style={s.addBtn} onClick={() => { resetForm(); setShowForm((v) => !v); }}>
          {showForm ? "✕ Cancel" : "+ Add Category"}
        </button>
      </div>

      {/* Add / Edit form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={s.form}>
          <h2 style={s.formTitle}>{editId ? "Edit Category" : "New Category"}</h2>

          <div style={s.formRow}>
            {/* Icon picker */}
            <div style={{ width: "160px" }}>
              <label style={s.label}>Icon</label>
              <div style={s.iconGrid}>
                {ICONS.map((ic) => (
                  <button
                    key={ic} type="button"
                    style={{ ...s.iconBtn, ...(form.icon === ic ? s.iconBtnActive : {}) }}
                    onClick={() => setForm({ ...form, icon: ic })}
                  >{ic}</button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={s.label}>Category Name *</label>
                <input style={s.input} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. T-Shirts" required />
              </div>
              <div>
                <label style={s.label}>Description</label>
                <input style={s.input} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description (optional)" />
              </div>
              <div>
                <label style={s.label}>Sort Order (lower = first)</label>
                <input style={{ ...s.input, width: "120px" }} type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
            </div>
          </div>

          <button type="submit" style={s.submitBtn} disabled={loading}>
            {loading ? "Saving..." : editId ? "Update Category" : "Create Category"}
          </button>
        </form>
      )}

      {/* Category list */}
      {loading && categories.length === 0 ? (
        <p style={{ color: "#aaa" }}>Loading...</p>
      ) : (
        <div style={s.catList}>
          {categories.map((cat) => {
            const isExpanded = expandedCat === cat._id;
            return (
              <div key={cat._id} style={s.catCard}>
                {/* Category row */}
                <div style={s.catRow}>
                  <div style={s.catLeft}>
                    <span style={s.catIcon}>{cat.icon || "🏷️"}</span>
                    <div>
                      <div style={s.catName}>
                        {cat.name}
                        {!cat.isActive && <span style={s.hiddenBadge}>Hidden</span>}
                      </div>
                      {cat.description && <p style={s.catDesc}>{cat.description}</p>}
                      <p style={s.catMeta}>
                        {cat.subcategories?.length || 0} subcategories
                        {cat.sortOrder !== 0 && ` · order: ${cat.sortOrder}`}
                      </p>
                    </div>
                  </div>

                  <div style={s.catActions}>
                    <button
                      style={{ ...s.actionBtn, background: isExpanded ? "#0f3460" : "#1a2a4a" }}
                      onClick={() => setExpandedCat(isExpanded ? null : cat._id)}
                    >
                      {isExpanded ? "▲ Subcats" : "▼ Subcats"} ({cat.subcategories?.length || 0})
                    </button>
                    <button style={s.actionBtn} onClick={() => handleEdit(cat)}>✏️ Edit</button>
                    <button
                      style={{ ...s.actionBtn, background: cat.isActive ? "#1b3a1b" : "#2a1a1a", color: cat.isActive ? "#a8d8a8" : "#e94560" }}
                      onClick={() => handleToggleActive(cat)}
                    >
                      {cat.isActive ? "👁 Visible" : "🚫 Hidden"}
                    </button>
                    <button style={{ ...s.actionBtn, background: "#3a1020", color: "#e94560" }} onClick={() => handleDelete(cat)}>🗑 Delete</button>
                  </div>
                </div>

                {/* Subcategories panel */}
                {isExpanded && (
                  <div style={s.subPanel}>
                    <p style={s.subPanelTitle}>Subcategories</p>

                    {/* Existing subcategories */}
                    {cat.subcategories?.length === 0 && (
                      <p style={{ color: "#666", fontSize: "0.8rem", marginBottom: "12px" }}>No subcategories yet.</p>
                    )}
                    <div style={s.subList}>
                      {cat.subcategories?.map((sub) => (
                        <div key={sub._id} style={s.subItem}>
                          {editSub?.subId === sub._id ? (
                            <>
                              <input
                                style={{ ...s.subInput, flex: 1 }}
                                value={editSub.name}
                                onChange={(e) => setEditSub({ ...editSub, name: e.target.value })}
                                autoFocus
                              />
                              <button style={{ ...s.subBtn, background: "#1b4a1b" }} onClick={handleSaveSubEdit}>Save</button>
                              <button style={s.subBtn} onClick={() => setEditSub(null)}>✕</button>
                            </>
                          ) : (
                            <>
                              <span style={{ ...s.subName, textDecoration: sub.isActive ? "none" : "line-through", opacity: sub.isActive ? 1 : 0.5 }}>
                                {sub.name}
                              </span>
                              <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
                                <button
                                  style={{ ...s.subBtn, fontSize: "0.7rem" }}
                                  onClick={() => setEditSub({ catId: cat._id, subId: sub._id, name: sub.name })}
                                >✏️</button>
                                <button
                                  style={{ ...s.subBtn, background: sub.isActive ? "#1b3a1b" : "#2a1a1a", color: sub.isActive ? "#a8d8a8" : "#e94560", fontSize: "0.7rem" }}
                                  onClick={() => handleToggleSub(cat._id, sub)}
                                >{sub.isActive ? "On" : "Off"}</button>
                                <button
                                  style={{ ...s.subBtn, background: "#3a1020", color: "#e94560", fontSize: "0.7rem" }}
                                  onClick={() => handleDeleteSub(cat._id, sub)}
                                >🗑</button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Add subcategory */}
                    <div style={s.addSubRow}>
                      <input
                        style={s.subInput}
                        placeholder="New subcategory name..."
                        value={subInputs[cat._id] || ""}
                        onChange={(e) => setSubInputs((p) => ({ ...p, [cat._id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddSub(cat._id); } }}
                      />
                      <button style={{ ...s.subBtn, background: "#e94560", padding: "8px 16px" }} onClick={() => handleAddSub(cat._id)}>
                        + Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const s = {
  page:       { background: "#0f3460", minHeight: "100vh", padding: "32px" },
  header:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" },
  title:      { color: "#fff", fontSize: "1.8rem", margin: 0 },
  subtitle:   { color: "#aaa", fontSize: "0.85rem", marginTop: "4px" },
  addBtn:     { background: "#e94560", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  form:       { background: "#16213e", borderRadius: "12px", padding: "24px", marginBottom: "28px" },
  formTitle:  { color: "#ffd700", marginBottom: "16px", fontSize: "1.1rem" },
  formRow:    { display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "16px" },
  label:      { display: "block", color: "#ccc", fontSize: "0.8rem", fontWeight: "600", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" },
  input:      { padding: "10px 14px", borderRadius: "6px", border: "1px solid #333", background: "#0f3460", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box", width: "100%" },
  iconGrid:   { display: "flex", flexWrap: "wrap", gap: "6px" },
  iconBtn:    { width: "36px", height: "36px", fontSize: "1.2rem", background: "#0f3460", border: "1px solid #333", borderRadius: "6px", cursor: "pointer" },
  iconBtnActive: { border: "2px solid #e94560", background: "#2a0a14" },
  submitBtn:  { padding: "11px 28px", background: "#e94560", border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "0.95rem" },
  catList:    { display: "flex", flexDirection: "column", gap: "12px" },
  catCard:    { background: "#16213e", borderRadius: "12px", overflow: "hidden", border: "1px solid #1e2a4a" },
  catRow:     { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", flexWrap: "wrap", gap: "10px" },
  catLeft:    { display: "flex", alignItems: "center", gap: "14px" },
  catIcon:    { fontSize: "2rem", flexShrink: 0 },
  catName:    { color: "#fff", fontWeight: "700", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" },
  hiddenBadge:{ background: "#e94560", color: "#fff", fontSize: "0.65rem", padding: "2px 8px", borderRadius: "20px", fontWeight: "700" },
  catDesc:    { color: "#888", fontSize: "0.78rem", marginTop: "2px" },
  catMeta:    { color: "#aaa", fontSize: "0.75rem", marginTop: "2px" },
  catActions: { display: "flex", gap: "8px", flexWrap: "wrap" },
  actionBtn:  { background: "#1a2a4a", border: "none", color: "#ccc", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" },
  subPanel:   { padding: "16px 20px", borderTop: "1px solid #1e2a4a", background: "#0f1a30" },
  subPanelTitle: { color: "#ffd700", fontSize: "0.8rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "12px" },
  subList:    { display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" },
  subItem:    { display: "flex", alignItems: "center", gap: "8px", background: "#16213e", borderRadius: "6px", padding: "8px 12px" },
  subName:    { color: "#ccc", fontSize: "0.85rem", flex: 1 },
  subInput:   { padding: "7px 12px", borderRadius: "6px", border: "1px solid #333", background: "#16213e", color: "#fff", fontSize: "0.85rem", boxSizing: "border-box" },
  addSubRow:  { display: "flex", gap: "8px" },
  subBtn:     { background: "#1a2a4a", border: "none", color: "#ccc", padding: "6px 10px", borderRadius: "6px", cursor: "pointer", fontSize: "0.78rem", fontWeight: "600" },
};
