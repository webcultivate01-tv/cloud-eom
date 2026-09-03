import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import { Search, X, SlidersHorizontal, ChevronDown, Package } from "lucide-react";
import { fetchProducts } from "../features/products/productSlice";
import { fetchCategories } from "../features/categories/categorySlice";
import ProductCard from "../components/ProductCard";

const SORT_OPTIONS = [
  { label: "Newest First", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Name: A to Z", value: "name_asc" },
];

const TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Ready to Ship", value: "direct" },
  { label: "Customizable", value: "custom" },
];

/* The site navbar is sticky and its height changes with the viewport — the category
   strip only appears from 1024px up — so measure it rather than hard-code an offset. */
function useNavHeight() {
  const [height, setHeight] = useState(88);
  useEffect(() => {
    const nav = document.querySelector("[data-site-nav]");
    if (!nav) return;
    const measure = () => setHeight(nav.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);
  return height;
}

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-2.5">
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-900 whitespace-nowrap">
      {children}
    </h3>
    <span className="flex-1 h-px bg-stone-200" />
  </div>
);

const Shimmer = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/80 to-transparent" />
  </div>
);

const CardSkeleton = () => (
  <div className="rounded-2xl overflow-hidden bg-white ring-1 ring-stone-200/60">
    <Shimmer className="aspect-[4/5]" />
    <div className="p-4 md:p-5 space-y-2.5">
      <Shimmer className="h-2 w-1/3 rounded-full" />
      <Shimmer className="h-3.5 w-4/5 rounded-full" />
      <Shimmer className="h-5 w-1/2 rounded-full !mt-4" />
    </div>
  </div>
);

export default function Products() {
  const dispatch = useDispatch();
  const { items: products, loading } = useSelector((s) => s.products);
  const { items: categoryItems } = useSelector((s) => s.categories);
  const [searchParams, setSearchParams] = useSearchParams();
  const navHeight = useNavHeight();

  const activeCategory = searchParams.get("category") || "";
  const activeSubcategory = searchParams.get("subcategory") || "";
  const activeSearch = searchParams.get("search") || "";
  const activeType = searchParams.get("type") || "";
  const sort = searchParams.get("sort") || "newest";

  // `draft` is only set while the user is typing; otherwise the box mirrors the URL.
  const [draft, setDraft] = useState(null);
  const searchInput = draft ?? activeSearch;
  // Explicit open/closed overrides; a category with no entry follows the active filter.
  const [catToggles, setCatToggles] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const updateParams = useCallback((updates, replace = false) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      return next;
    }, { replace });
  }, [setSearchParams]);

  const clearAll = () => { setDraft(null); setSearchParams({}); };

  useEffect(() => { dispatch(fetchCategories()); }, [dispatch]);

  useEffect(() => {
    const filters = {};
    if (activeCategory) filters.category = activeCategory;
    if (activeSubcategory) filters.subcategory = activeSubcategory;
    if (activeSearch) filters.search = activeSearch;
    dispatch(fetchProducts(filters));
  }, [dispatch, activeCategory, activeSubcategory, activeSearch]);

  // Debounce typing so we don't refetch on every keystroke
  useEffect(() => {
    if (draft === null || draft === activeSearch) return;
    const t = setTimeout(() => { updateParams({ search: draft || null }, true); setDraft(null); }, 350);
    return () => clearTimeout(t);
  }, [draft, activeSearch, updateParams]);

  // Lock page scroll while the mobile filter drawer is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const isCatOpen = (name) => catToggles[name] ?? activeCategory === name;
  const toggleCat = (name) => setCatToggles((prev) => ({ ...prev, [name]: !isCatOpen(name) }));

  const visible = useMemo(() => {
    let list = products;
    if (activeType === "custom") list = list.filter((p) => p.requiresCustomImage);
    else if (activeType === "direct") list = list.filter((p) => !p.requiresCustomImage);
    return [...list].sort((a, b) => {
      if (sort === "price_asc") return a.price - b.price;
      if (sort === "price_desc") return b.price - a.price;
      if (sort === "name_asc") return a.name.localeCompare(b.name);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [products, activeType, sort]);

  const activeCat = categoryItems.find((c) => c.name === activeCategory);
  const heading = activeSubcategory || activeCategory || "All Products";
  const subheading =
    activeCat?.description ||
    (activeSearch
      ? `Showing everything that matches "${activeSearch}".`
      : "Premium custom-printed gifts, made in Amravati. Browse a category or search to narrow things down.");

  const chips = [
    activeCategory && { label: activeCategory, clear: { category: null, subcategory: null } },
    activeSubcategory && { label: activeSubcategory, clear: { subcategory: null } },
    activeType && { label: TYPE_OPTIONS.find((t) => t.value === activeType)?.label, clear: { type: null } },
    activeSearch && { label: `"${activeSearch}"`, clear: { search: null } },
  ].filter(Boolean);

  const navRow = (active) =>
    `relative w-full flex items-center gap-2.5 text-left pl-2 pr-1.5 py-1.5 rounded-lg bg-transparent text-[12.5px] border-none cursor-pointer transition-colors duration-200 ${
      active ? "text-stone-900 font-semibold" : "text-stone-500 font-normal hover:text-stone-900"
    }`;

  const pill = (active) =>
    `px-3 py-1.5 rounded-full bg-white text-[11.5px] border cursor-pointer whitespace-nowrap transition-colors duration-200 ${
      active
        ? "border-stone-900 text-stone-900 font-semibold"
        : "border-stone-200 text-stone-500 font-medium hover:border-stone-400 hover:text-stone-900"
    }`;

  // A value, not a component — keeps the search box from remounting on every keystroke
  const filterPanel = (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <div>
        <SectionLabel>Search</SectionLabel>
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input
            className="w-full pl-9 pr-8 py-2 rounded-full border border-stone-200 bg-white text-[12.5px] text-stone-800 placeholder-stone-400 outline-none transition-all duration-200 focus:border-stone-900 focus:ring-4 focus:ring-stone-900/5"
            placeholder="Search products..."
            value={searchInput}
            onChange={(e) => setDraft(e.target.value)}
          />
          {searchInput && (
            <button
              aria-label="Clear search"
              onClick={() => setDraft("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-red-700 bg-transparent border-none cursor-pointer p-0.5 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      <div>
        <SectionLabel>Categories</SectionLabel>
        <div className="flex flex-col gap-1">
          <button
            className={navRow(!activeCategory)}
            onClick={() => { updateParams({ category: null, subcategory: null }); setSidebarOpen(false); }}
          >
            <span className="w-7 h-7 shrink-0 rounded-lg bg-stone-100 flex items-center justify-center">
              <Package size={13} className={!activeCategory ? "text-stone-900" : "text-stone-400"} />
            </span>
            All Products
          </button>

          {categoryItems.map((cat) => {
            const subs = cat.subcategories?.filter((s) => s.isActive) || [];
            const isOpen = isCatOpen(cat.name);
            const isCatActive = activeCategory === cat.name && !activeSubcategory;
            const isBranchActive = activeCategory === cat.name;

            return (
              <div key={cat._id}>
                <div className="flex items-center gap-0.5">
                  <button
                    className={`${navRow(isCatActive)} flex-1 min-w-0`}
                    onClick={() => {
                      updateParams({ category: cat.name, subcategory: null });
                      if (subs.length) setCatToggles((prev) => ({ ...prev, [cat.name]: true }));
                      else setSidebarOpen(false);
                    }}
                  >
                    <span className="w-7 h-7 shrink-0 rounded-lg bg-stone-100 overflow-hidden flex items-center justify-center text-[12px]">
                      {cat.image
                        ? <img src={cat.image} alt="" loading="lazy" className="w-full h-full object-contain p-0.5" />
                        : (cat.icon || "\u{1F3F7}\u{FE0F}")}
                    </span>
                    <span className="truncate">{cat.name}</span>
                  </button>

                  {subs.length > 0 && (
                    <button
                      aria-label={`Toggle ${cat.name} subcategories`}
                      onClick={() => toggleCat(cat.name)}
                      className={`shrink-0 p-1.5 rounded-lg bg-transparent border-none cursor-pointer transition-colors ${
                        isBranchActive ? "text-stone-700" : "text-stone-300 hover:text-stone-700"
                      }`}
                    >
                      <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </div>

                {isOpen && subs.length > 0 && (
                  <div className="ml-[22px] pl-3 mt-1 mb-1.5 border-l border-stone-200 flex flex-col items-start gap-0.5">
                    {subs.map((sub) => {
                      const isSubActive = activeCategory === cat.name && activeSubcategory === sub.name;
                      return (
                        <button
                          key={sub._id}
                          onClick={() => { updateParams({ category: cat.name, subcategory: sub.name }); setSidebarOpen(false); }}
                          className={`text-left px-2.5 py-1 rounded-full text-[12px] border-none bg-transparent cursor-pointer transition-colors duration-200 ${
                            isSubActive
                              ? "text-stone-900 font-semibold"
                              : "text-stone-500 hover:text-stone-900"
                          }`}
                        >
                          {sub.name}
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

      {/* Product type */}
      <div>
        <SectionLabel>Product Type</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              onClick={() => { updateParams({ type: opt.value || null }); setSidebarOpen(false); }}
              className={pill(activeType === opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {chips.length > 0 && (
        <button
          onClick={() => { clearAll(); setSidebarOpen(false); }}
          className="self-start text-[12px] font-semibold text-stone-400 hover:text-red-700 bg-transparent border-none cursor-pointer underline underline-offset-4 decoration-stone-300 hover:decoration-red-700 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="bg-[#FAFAF9] min-h-[calc(100vh_-_var(--nav-h))]" style={{ "--nav-h": navHeight + "px" }}>
      {/* ── Editorial header ── */}
      <header className="relative overflow-hidden bg-white border-b border-stone-200/70">
        <div className="pointer-events-none absolute -top-28 -right-20 w-72 h-72 rounded-full bg-red-600/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 w-64 h-64 rounded-full bg-amber-400/[0.05] blur-3xl" />

        <div className="relative max-w-[1400px] mx-auto px-4 md:px-8 pt-4 pb-6 md:pt-5 md:pb-7">
          <nav className="flex items-center gap-2 text-[11px] font-medium text-stone-400 mb-3.5">
            <Link to="/" className="hover:text-red-700 transition-colors">Home</Link>
            <span className="text-stone-300">/</span>
            <Link to="/products" className="hover:text-red-700 transition-colors">Products</Link>
            {activeCategory && (
              <>
                <span className="text-stone-300">/</span>
                <span className={activeSubcategory ? "" : "text-stone-800"}>{activeCategory}</span>
              </>
            )}
            {activeSubcategory && (
              <>
                <span className="text-stone-300">/</span>
                <span className="text-stone-800">{activeSubcategory}</span>
              </>
            )}
          </nav>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-6 h-px bg-red-700" />
              <span className="text-[9.5px] font-bold uppercase tracking-[0.28em] text-red-700">
                {activeCategory ? "Collection" : "Shop All"}
              </span>
            </div>

            <h1 className="font-display text-[26px] md:text-[34px] font-black text-stone-900 leading-[1.08] tracking-[-0.02em]">
              {heading}
            </h1>

            <p className="text-stone-500 text-[12.5px] md:text-[13.5px] mt-2 max-w-xl leading-relaxed">
              {subheading}
            </p>

            <div className="flex items-center gap-2.5 mt-3.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-stone-400">
              <span>{loading ? "—" : visible.length} {visible.length === 1 ? "Item" : "Items"}</span>
              <span className="w-1 h-1 rounded-full bg-stone-300" />
              <span>Free design proof</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Category rail (mobile) — deliberately not sticky; the toolbar below owns that slot ── */}
      {categoryItems.length > 0 && (
        <div className="lg:hidden bg-white border-b border-stone-200/70">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
            <button className={pill(!activeCategory)} onClick={() => updateParams({ category: null, subcategory: null })}>
              All
            </button>
            {categoryItems.map((cat) => (
              <button
                key={cat._id}
                className={pill(activeCategory === cat.name)}
                onClick={() => updateParams({ category: cat.name, subcategory: null })}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex max-w-[1400px] mx-auto px-4 md:px-8 lg:gap-10">
        {/* ── Sidebar (desktop) ── */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-[var(--nav-h)] max-h-[calc(100vh_-_var(--nav-h))] overflow-y-auto scrollbar-hide py-6 pr-1">
            {filterPanel}
          </div>
        </aside>

        {/* ── Sidebar (mobile drawer) ── */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[200] lg:hidden" onClick={() => setSidebarOpen(false)}>
            <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" />
            <div
              className="absolute top-0 left-0 bottom-0 w-[86%] max-w-xs bg-[#FAFAF9] shadow-2xl rounded-r-[2rem] flex flex-col animate-slide-in-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-5 shrink-0">
                <span className="font-display text-xl font-black text-stone-900">Filters</span>
                <button
                  aria-label="Close filters"
                  onClick={() => setSidebarOpen(false)}
                  className="w-8 h-8 rounded-full bg-white ring-1 ring-stone-200 text-stone-500 hover:text-stone-900 flex items-center justify-center border-none cursor-pointer transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">{filterPanel}</div>

              <div className="p-4 shrink-0 border-t border-stone-200/70">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full py-3.5 rounded-full bg-stone-900 text-white text-[13px] font-bold tracking-wide border-none cursor-pointer transition-colors duration-200 hover:bg-red-700"
                >
                  Show {visible.length} {visible.length === 1 ? "product" : "products"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Results ── */}
        <main className="flex-1 min-w-0 pb-16">
          {/* Glass toolbar */}
          <div className="sticky top-[var(--nav-h)] z-20 -mx-4 lg:mx-0 px-4 lg:px-0 lg:pt-9 bg-[#FAFAF9]/95 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 py-3.5 lg:py-0 lg:pb-5 border-b border-stone-200/80">
              <p className="text-stone-500 text-[13px]">
                <span className="font-bold text-stone-900">{visible.length}</span>{" "}
                {visible.length === 1 ? "product" : "products"}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 rounded-full bg-white border border-stone-200 px-3.5 py-2 text-[12.5px] font-semibold text-stone-700 cursor-pointer transition-colors hover:border-stone-900"
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {chips.length > 0 && (
                    <span className="ml-0.5 w-[18px] h-[18px] rounded-full bg-red-700 text-white text-[10px] font-bold flex items-center justify-center">
                      {chips.length}
                    </span>
                  )}
                </button>

                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => updateParams({ sort: e.target.value === "newest" ? null : e.target.value })}
                    className="appearance-none rounded-full bg-white border border-stone-200 pl-4 pr-9 py-2 text-[12.5px] font-semibold text-stone-700 cursor-pointer outline-none transition-colors hover:border-stone-900 focus:border-stone-900"
                  >
                    {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Active filter chips */}
          {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-5">
              {chips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => { if ("search" in chip.clear) setDraft(null); updateParams(chip.clear); }}
                  className="group inline-flex items-center gap-2 pl-3.5 pr-2.5 py-1.5 rounded-full bg-white ring-1 ring-stone-200 text-stone-700 text-[12px] font-semibold cursor-pointer transition-all duration-200 hover:ring-red-700 hover:text-red-700"
                >
                  {chip.label}
                  <X size={12} strokeWidth={3} className="text-stone-400 group-hover:text-red-700 transition-colors" />
                </button>
              ))}
              <button
                onClick={clearAll}
                className="text-[12px] font-semibold text-stone-400 hover:text-red-700 bg-transparent border-none cursor-pointer px-1 underline underline-offset-4 decoration-stone-300 hover:decoration-red-700 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Grid */}
          <div className="mt-7">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
                {[...Array(8)].map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="flex flex-col items-center text-center py-24 px-6">
                <span className="w-20 h-20 rounded-full bg-white ring-1 ring-stone-200 shadow-[0_16px_40px_-24px_rgba(0,0,0,0.4)] flex items-center justify-center mb-6">
                  <Search size={26} className="text-red-700" />
                </span>
                <h3 className="font-display text-2xl font-black text-stone-900 mb-2">Nothing here yet</h3>
                <p className="text-stone-500 text-[13px] max-w-xs leading-relaxed">
                  No products match these filters right now. Try clearing them or browsing another category.
                </p>
                {chips.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="mt-7 px-7 py-3 rounded-full bg-stone-900 text-white text-[13px] font-bold border-none cursor-pointer transition-colors duration-200 hover:bg-red-700"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
                {visible.map((p, i) => (
                  <div
                    key={p._id}
                    className="h-full animate-fade-in-up"
                    style={{ animationDelay: `${Math.min(i, 11) * 45}ms`, animationFillMode: "both" }}
                  >
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
