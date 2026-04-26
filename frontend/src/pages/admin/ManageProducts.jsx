import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAllProductsAdmin,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../features/products/productSlice";
import { fetchCategoriesAdmin } from "../../features/categories/categorySlice";
import { toast } from "react-toastify";

export default function ManageProducts() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((state) => state.products);
  const { items: categoryItems } = useSelector((state) => state.categories);
  const CATEGORIES = categoryItems.map((c) => c.name);

  const EMPTY_FORM = {
    name: "", description: "", price: "", category: CATEGORIES[0] || "", stock: "100",
    allowCustomImage: false, requiresCustomImage: false, isAvailable: true,
  };

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "", stock: "100", allowCustomImage: false, requiresCustomImage: false, isAvailable: true });
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    dispatch(fetchAllProductsAdmin());
    dispatch(fetchCategoriesAdmin());
  }, [dispatch]);

  const resetForm = () => { setForm(EMPTY_FORM); setImageFile(null); setEditId(null); setShowForm(false); };

  const handleEdit = (product) => {
    setEditId(product._id);
    setForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.stock,
      allowCustomImage: product.allowCustomImage,
      requiresCustomImage: product.requiresCustomImage || false,
      isAvailable: product.isAvailable,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    const result = await dispatch(deleteProduct(id));
    if (!result.error) toast.success("Product deleted");
    else toast.error("Delete failed");
  };

  const handleProductTypeChange = (type) => {
    if (type === "direct") {
      setForm({ ...form, allowCustomImage: false, requiresCustomImage: false });
    } else if (type === "optional") {
      setForm({ ...form, allowCustomImage: true, requiresCustomImage: false });
    } else if (type === "required") {
      setForm({ ...form, allowCustomImage: true, requiresCustomImage: true });
    }
  };

  const getProductType = () => {
    if (form.requiresCustomImage) return "required";
    if (form.allowCustomImage) return "optional";
    return "direct";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (imageFile) formData.append("image", imageFile);

    let result;
    if (editId) {
      result = await dispatch(updateProduct({ id: editId, formData }));
    } else {
      result = await dispatch(createProduct(formData));
    }

    if (!result.error) {
      toast.success(editId ? "Product updated!" : "Product created!");
      resetForm();
    } else {
      toast.error(result.payload || "Operation failed");
    }
  };

  const productTypeBadge = (p) => {
    if (p.requiresCustomImage) return { label: "Custom Required", bg: "#7b1fa2", color: "#fff" };
    if (p.allowCustomImage) return { label: "Custom Optional", bg: "#1565c0", color: "#fff" };
    return { label: "Direct Sale", bg: "#2e7d32", color: "#fff" };
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Products</h1>
        <button style={styles.addBtn} onClick={() => { resetForm(); setShowForm((v) => !v); }}>
          {showForm ? "Cancel" : "+ Add Product"}
        </button>
      </div>

      {/* Product Form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <h2 style={styles.formTitle}>{editId ? "Edit Product" : "Add New Product"}</h2>

          {/* Product Type Selector */}
          <div style={styles.typeSection}>
            <p style={styles.typeLabel}>Product Type</p>
            <div style={styles.typeOptions}>
              <label style={{ ...styles.typeOption, ...(getProductType() === "direct" ? styles.typeOptionActive : {}) }}>
                <input
                  type="radio"
                  name="productType"
                  checked={getProductType() === "direct"}
                  onChange={() => handleProductTypeChange("direct")}
                  style={{ display: "none" }}
                />
                <span style={styles.typeIcon}>🛍️</span>
                <span style={styles.typeName}>Direct Sale</span>
                <span style={styles.typeDesc}>No custom image needed. Customer buys as-is.</span>
              </label>

              <label style={{ ...styles.typeOption, ...(getProductType() === "optional" ? styles.typeOptionActive : {}) }}>
                <input
                  type="radio"
                  name="productType"
                  checked={getProductType() === "optional"}
                  onChange={() => handleProductTypeChange("optional")}
                  style={{ display: "none" }}
                />
                <span style={styles.typeIcon}>🎨</span>
                <span style={styles.typeName}>Custom Optional</span>
                <span style={styles.typeDesc}>Customer can upload a design, but it's not required.</span>
              </label>

              <label style={{ ...styles.typeOption, ...(getProductType() === "required" ? styles.typeOptionRequiredActive : {}) }}>
                <input
                  type="radio"
                  name="productType"
                  checked={getProductType() === "required"}
                  onChange={() => handleProductTypeChange("required")}
                  style={{ display: "none" }}
                />
                <span style={styles.typeIcon}>🖼️</span>
                <span style={styles.typeName}>Custom Required</span>
                <span style={styles.typeDesc}>Order CANNOT be placed without uploading a custom design.</span>
              </label>
            </div>
            {getProductType() === "required" && (
              <p style={styles.typeWarning}>⚠️ Customers must upload their design image during checkout. Order will be blocked until they do.</p>
            )}
          </div>

          <div style={styles.formGrid}>
            <input style={styles.input} placeholder="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input style={styles.input} placeholder="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
            <select style={styles.input} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={styles.input} placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <textarea style={{ ...styles.input, width: "100%", height: "80px", resize: "vertical" }} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />

          <div style={styles.checkboxRow}>
            <label style={{ color: "#ccc" }}>
              <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} />{" "}
              Is Available (visible to customers)
            </label>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#ccc", fontSize: "0.9rem" }}>Product Image:</label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} style={{ color: "#ccc", display: "block", marginTop: "8px" }} />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Saving..." : editId ? "Update Product" : "Create Product"}
          </button>
        </form>
      )}

      {/* Products Table */}
      {loading && !showForm ? (
        <p style={{ color: "#aaa" }}>Loading...</p>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                {["Image", "Name", "Category", "Type", "Price", "Stock", "Status", "Actions"].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const badge = productTypeBadge(p);
                return (
                  <tr key={p._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{ position: "relative", display: "inline-block" }}>
                        <img src={p.image || "https://placehold.co/50x50/1a2a4a/aaa?text=No+Img"} alt={p.name} style={{ width: "50px", height: "50px", objectFit: "cover", borderRadius: "6px" }} />
                        {p.image && (
                          <a
                            href={p.image}
                            download
                            target="_blank"
                            rel="noreferrer"
                            title="Download image"
                            style={{ position: "absolute", bottom: "-4px", right: "-4px", background: "#e94560", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", color: "#fff", textDecoration: "none" }}
                          >⬇</a>
                        )}
                      </div>
                    </td>
                    <td style={styles.td}>{p.name}</td>
                    <td style={styles.td}>{p.category}</td>
                    <td style={styles.td}>
                      <span style={{ background: badge.bg, color: badge.color, padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", fontWeight: "700", whiteSpace: "nowrap" }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={styles.td}>₹{p.price}</td>
                    <td style={styles.td}>{p.stock}</td>
                    <td style={styles.td}>
                      <span style={{ color: p.isAvailable ? "#a8d8a8" : "#e94560" }}>
                        {p.isAvailable ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.editBtn} onClick={() => handleEdit(p)}>Edit</button>
                      <button style={styles.delBtn} onClick={() => handleDelete(p._id, p.name)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { background: "#0f3460", minHeight: "100vh", padding: "32px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { color: "#fff", fontSize: "1.8rem", margin: 0 },
  addBtn: { background: "#e94560", border: "none", color: "#fff", padding: "10px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" },
  form: { background: "#16213e", borderRadius: "12px", padding: "24px", marginBottom: "32px" },
  formTitle: { color: "#ffd700", marginBottom: "20px" },
  typeSection: { marginBottom: "20px" },
  typeLabel: { color: "#ffd700", fontWeight: "700", fontSize: "0.85rem", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" },
  typeOptions: { display: "flex", gap: "12px", flexWrap: "wrap" },
  typeOption: {
    flex: 1, minWidth: "160px", cursor: "pointer", border: "2px solid #333", borderRadius: "10px",
    padding: "14px", display: "flex", flexDirection: "column", gap: "4px",
    background: "#0f3460", transition: "border-color 0.2s",
  },
  typeOptionActive: { borderColor: "#1e88e5", background: "rgba(30,136,229,0.12)" },
  typeOptionRequiredActive: { borderColor: "#e94560", background: "rgba(233,69,96,0.12)" },
  typeIcon: { fontSize: "1.4rem" },
  typeName: { color: "#fff", fontWeight: "700", fontSize: "0.9rem" },
  typeDesc: { color: "#aaa", fontSize: "0.75rem", lineHeight: 1.4 },
  typeWarning: { marginTop: "10px", color: "#ffd700", fontSize: "0.8rem", background: "rgba(233,69,96,0.1)", border: "1px solid #e94560", borderRadius: "6px", padding: "8px 12px" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "12px" },
  input: { padding: "10px 14px", borderRadius: "6px", border: "1px solid #333", background: "#0f3460", color: "#fff", fontSize: "0.95rem", boxSizing: "border-box" },
  checkboxRow: { marginBottom: "16px" },
  submitBtn: { padding: "12px 28px", background: "#e94560", border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { background: "#16213e", color: "#ffd700", padding: "12px 16px", textAlign: "left", fontSize: "0.9rem" },
  tr: { borderBottom: "1px solid #1a2a4a" },
  td: { color: "#ccc", padding: "12px 16px", verticalAlign: "middle" },
  editBtn: { background: "#0077cc", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "4px", cursor: "pointer", marginRight: "8px" },
  delBtn: { background: "#e94560", border: "none", color: "#fff", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" },
};
