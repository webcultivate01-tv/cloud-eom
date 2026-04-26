import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "../features/products/productSlice";
import { fetchCategories } from "../features/categories/categorySlice";
import ProductCard from "../components/ProductCard";
import { useSearchParams } from "react-router-dom";

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

export default function Products() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((state) => state.products);
  const { items: categoryItems } = useSelector((state) => state.categories);
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [sort, setSort] = useState("newest");
  const [expandedCats, setExpandedCats] = useState({});

  const activeCategory = searchParams.get("category") || "";
  const activeSubcategory = searchParams.get("subcategory") || "";

  useEffect(() => {
    dispatch(fetchCategories());
    const filters = {};
    if (activeCategory) filters.category = activeCategory;
    if (activeSubcategory) filters.subcategory = activeSubcategory;
    if (search) filters.search = search;
    dispatch(fetchProducts(filters));
  }, [dispatch, activeCategory, activeSubcategory, search]);

  // Auto-expand the active category
  useEffect(() => {
    if (activeCategory) {
      setExpandedCats((prev) => ({ ...prev, [activeCategory]: true }));
    }
  }, [activeCategory]);

  const toggleCat = (catName) =>
    setExpandedCats((prev) => ({ ...prev, [catName]: !prev[catName] }));

  const sorted = [...products].sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const pageLabel = activeSubcategory
    ? `${activeCategory} › ${activeSubcategory}`
    : activeCategory || "All Products";

  return (
    <div style={s.page}>
      {/* Page header */}
      <div style={s.pageHeader}>
        <div style={s.headerInner}>
          <h1 style={s.pageTitle}>
            {pageLabel}
            <span style={s.countBadge}>{products.length}</span>
          </h1>
          <p style={s.breadcrumb}>
            Home / Products
            {activeCategory ? ` / ${activeCategory}` : ""}
            {activeSubcategory ? ` / ${activeSubcategory}` : ""}
          </p>
        </div>
      </div>

      <div style={s.layout}>
        {/* ── Sidebar Filter ─────────────────────────── */}
        <aside style={s.sidebar}>
          <div style={s.filterBlock}>
            <h3 style={s.filterTitle}>Search</h3>
            <input
              style={s.searchInput}
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={s.filterBlock}>
            <h3 style={s.filterTitle}>Categories</h3>
            <div style={s.filterList}>
              {/* All Products */}
              <button
                style={{ ...s.filterBtn, ...(activeCategory === "" ? s.filterBtnActive : {}) }}
                onClick={() => setSearchParams({})}
              >
                All Products
              </button>

              {/* Category rows with expandable subcategories */}
              {categoryItems.map((cat) => {
                const isOpen = !!expandedCats[cat.name];
                const isCatActive = activeCategory === cat.name && !activeSubcategory;
                const hasSubs = cat.subcategories?.filter((s) => s.isActive).length > 0;

                return (
                  <div key={cat._id}>
                    {/* Category row */}
                    <div style={s.catRow}>
                      <button
                        style={{ ...s.filterBtn, flex: 1, ...(isCatActive ? s.filterBtnActive : {}) }}
                        onClick={() => {
                          setSearchParams({ category: cat.name });
                          if (hasSubs) toggleCat(cat.name);
                        }}
                      >
                        {cat.icon} {cat.name}
                      </button>
                      {hasSubs && (
                        <button
                          style={s.chevronBtn}
                          onClick={() => toggleCat(cat.name)}
                          title={isOpen ? "Collapse" : "Expand"}
                        >
                          {isOpen ? "▲" : "▼"}
                        </button>
                      )}
                    </div>

                    {/* Subcategory sub-list */}
                    {isOpen && hasSubs && (
                      <div style={s.subList}>
                        {cat.subcategories
                          .filter((sub) => sub.isActive)
                          .map((sub) => {
                            const isSubActive =
                              activeCategory === cat.name && activeSubcategory === sub.name;
                            return (
                              <button
                                key={sub._id}
                                style={{
                                  ...s.subBtn,
                                  ...(isSubActive ? s.subBtnActive : {}),
                                }}
                                onClick={() =>
                                  setSearchParams({
                                    category: cat.name,
                                    subcategory: sub.name,
                                  })
                                }
                              >
                                └ {sub.name}
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={s.filterBlock}>
            <h3 style={s.filterTitle}>Product Type</h3>
            <div style={s.filterList}>
              <button style={s.filterBtn} onClick={() => dispatch(fetchProducts({ requiresCustomImage: false }))}>
                Direct Sale Products
              </button>
              <button style={s.filterBtn} onClick={() => dispatch(fetchProducts({ requiresCustomImage: true }))}>
                🎨 Customize Products
              </button>
            </div>
          </div>
        </aside>

        {/* ── Product Grid ───────────────────────────── */}
        <div style={s.main}>
          {/* Toolbar */}
          <div style={s.toolbar}>
            <p style={s.resultCount}>Showing {sorted.length} products</p>
            <select style={s.sortSelect} value={sort} onChange={(e) => setSort(e.target.value)}>
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={s.grid}>
              {[...Array(8)].map((_, i) => <div key={i} style={s.skeleton} />)}
            </div>
          ) : sorted.length === 0 ? (
            <div style={s.empty}>
              <span style={{ fontSize: "3rem" }}>🔍</span>
              <p style={{ color: "#666", marginTop: "12px" }}>No products found. Try a different filter.</p>
            </div>
          ) : (
            <div style={s.grid}>
              {sorted.map((p) => <ProductCard key={p._id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { background: "#fff", minHeight: "80vh" },
  pageHeader: { background: "#f7f7f7", borderBottom: "1px solid #e0e0e0", padding: "20px 60px" },
  headerInner: {},
  pageTitle: { fontSize: "1.6rem", fontWeight: "800", color: "#1a1a1a", display: "flex", alignItems: "center", gap: "10px" },
  countBadge: { background: "#f0f0f0", color: "#666", fontSize: "0.85rem", padding: "2px 10px", borderRadius: "20px", fontWeight: "600" },
  breadcrumb: { color: "#999", fontSize: "0.8rem", marginTop: "4px" },
  layout: { display: "flex", gap: "0", maxWidth: "1400px", margin: "0 auto" },
  sidebar: { width: "240px", flexShrink: 0, padding: "24px 20px", borderRight: "1px solid #e0e0e0", background: "#fff" },
  filterBlock: { marginBottom: "28px" },
  filterTitle: { fontSize: "0.8rem", fontWeight: "800", color: "#1a1a1a", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "12px" },
  searchInput: { width: "100%", padding: "8px 12px", border: "1px solid #e0e0e0", borderRadius: "4px", fontSize: "0.85rem", background: "#f7f7f7" },
  filterList: { display: "flex", flexDirection: "column", gap: "4px" },
  filterBtn: { display: "block", width: "100%", textAlign: "left", padding: "8px 10px", border: "none", background: "transparent", color: "#555", fontSize: "0.85rem", cursor: "pointer", borderRadius: "4px", transition: "background 0.15s" },
  filterBtnActive: { background: "#fff0f2", color: "#c41230", fontWeight: "700" },
  catRow: { display: "flex", alignItems: "center", gap: "2px" },
  chevronBtn: { border: "none", background: "transparent", color: "#aaa", cursor: "pointer", fontSize: "0.65rem", padding: "4px 6px", flexShrink: 0 },
  subList: { paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "2px", marginBottom: "4px" },
  subBtn: { display: "block", width: "100%", textAlign: "left", padding: "6px 10px", border: "none", background: "transparent", color: "#777", fontSize: "0.82rem", cursor: "pointer", borderRadius: "4px", transition: "background 0.15s" },
  subBtnActive: { background: "#fff0f2", color: "#c41230", fontWeight: "700" },
  main: { flex: 1, padding: "20px 32px" },
  toolbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", padding: "10px 0", borderBottom: "1px solid #e0e0e0" },
  resultCount: { color: "#666", fontSize: "0.85rem" },
  sortSelect: { border: "1px solid #e0e0e0", borderRadius: "4px", padding: "6px 10px", fontSize: "0.85rem", color: "#333", background: "#fff", cursor: "pointer" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "20px" },
  skeleton: { height: "280px", background: "linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)", borderRadius: "10px" },
  empty: { textAlign: "center", padding: "80px 20px" },
};
