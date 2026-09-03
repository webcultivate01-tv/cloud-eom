const Order       = require("../models/Order");
const User        = require("../models/User");
const Product     = require("../models/Product");
const Review      = require("../models/Review");
const Inquiry     = require("../models/Inquiry");
const Replacement = require("../models/Replacement");
const Category    = require("../models/Category");
const Event       = require("../models/Event");
const XLSX    = require("xlsx");
const PDFDocument = require("pdfkit");

/* ── helpers ──────────────────────────────────────────────── */
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const money = (n) => `Rs.${Number(n || 0).toLocaleString("en-IN")}`;
const id8 = (v) => v ? v.toString().slice(-8).toUpperCase() : "—";
const yn = (v) => v ? "Yes" : "No";
const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
const count = (arr, fn) => arr.filter(fn).length;

/** Build a date-range filter from query params */
const buildDateFilter = (range, from, to) => {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now); start.setHours(0, 0, 0, 0);
    return { $gte: start };
  }
  if (range === "7days") {
    const start = new Date(now); start.setDate(now.getDate() - 7);
    return { $gte: start };
  }
  if (range === "30days") {
    const start = new Date(now); start.setDate(now.getDate() - 30);
    return { $gte: start };
  }
  if (range === "custom" && from && to) {
    return { $gte: new Date(from), $lte: new Date(new Date(to).setHours(23, 59, 59, 999)) };
  }
  return undefined; // no filter
};

/* ══════════════════════════════════════════════════════════
   DATASET DEFINITIONS

   Every export is described here rather than hand-written:
   which model to read, how to summarise it, and one column
   list that drives both the Excel sheet and the PDF table.

   column = {
     header : column title
     w      : Excel column width
     pdf    : relative width in the PDF table — omit to keep
              the column out of the PDF (it stays in Excel,
              which has room for the wide free-text fields)
     value  : (record, index) => cell value
   }
   filters = { queryParam: (value) => mongo filter fragment }
══════════════════════════════════════════════════════════ */
const DATASETS = {

  /* ── Orders ─────────────────────────────────────────── */
  orders: {
    label: "Orders",
    model: Order,
    populate: [{ path: "user", select: "name email phone" }],
    filters: {
      status: (v) => ({ status: v }),
      userId: (v) => ({ user: v }),
    },
    summary: (rows) => [
      ["Total Orders", rows.length],
      ["Total Revenue", money(rows.reduce((s, o) => s + (o.totalPrice || 0), 0))],
      ["Delivered", count(rows, (o) => o.status === "Delivered")],
      ["Cancelled", count(rows, (o) => o.status === "Cancelled")],
    ],
    columns: [
      { header: "#",          w: 4,  pdf: 5,  value: (o, i) => i + 1 },
      { header: "Order ID",   w: 12, pdf: 13, value: (o) => id8(o._id) },
      { header: "Date",       w: 14, pdf: 14, value: (o) => fmt(o.createdAt) },
      { header: "Customer",   w: 22, pdf: 22, value: (o) => o.user?.name || "—" },
      { header: "Email",      w: 26,          value: (o) => o.user?.email || "—" },
      { header: "Phone",      w: 14,          value: (o) => o.shippingAddress?.phone || "—" },
      { header: "City",       w: 14,          value: (o) => o.shippingAddress?.city || "—" },
      { header: "Items",      w: 6,           value: (o) => o.items?.length || 0 },
      { header: "Total",      w: 12, pdf: 13, value: (o) => money(o.totalPrice), excel: (o) => o.totalPrice || 0 },
      { header: "Payment",    w: 10, pdf: 11, value: (o) => o.paymentMethod === "razorpay" ? "Online" : "COD" },
      { header: "Pay Status", w: 10,          value: (o) => cap(o.paymentStatus) },
      { header: "Status",     w: 12, pdf: 14, value: (o) => o.status || "—" },
      { header: "Tracking",   w: 18, pdf: 18, value: (o) => o.shipment?.trackingId || "—" },
    ],
  },

  /* ── Payments ───────────────────────────────────────────
     Payments live on the Order document, so this reads the
     same collection but from the money side. Without an
     explicit filter it shows only orders where money has
     actually moved or is owed — matching Manage Payments. */
  payments: {
    label: "Payments",
    model: Order,
    populate: [{ path: "user", select: "name email phone" }],
    sort: { paidAt: -1, createdAt: -1 },
    baseFilter: (q) =>
      (q.status || q.method)
        ? {}
        : { $or: [
            { paymentMethod: "razorpay", paymentStatus: { $in: ["paid", "refunded"] } },
            { paymentMethod: "cod" },
          ] },
    filters: {
      status: (v) => ({ paymentStatus: v }),
      method: (v) => ({ paymentMethod: v }),
    },
    summary: (rows) => {
      const paid = rows.filter((o) => o.paymentStatus === "paid");
      return [
        ["Total Transactions", rows.length],
        ["Amount Collected", money(paid.reduce((s, o) => s + (o.totalPrice || 0), 0))],
        ["Refunded", money(rows.filter((o) => o.paymentStatus === "refunded").reduce((s, o) => s + (o.totalPrice || 0), 0))],
        ["Online / COD", `${count(rows, (o) => o.paymentMethod === "razorpay")} / ${count(rows, (o) => o.paymentMethod === "cod")}`],
        ["Pending Payments", count(rows, (o) => o.paymentStatus === "pending")],
      ];
    },
    columns: [
      { header: "#",            w: 4,  pdf: 5,  value: (o, i) => i + 1 },
      { header: "Order ID",     w: 12, pdf: 12, value: (o) => id8(o._id) },
      { header: "Date",         w: 14, pdf: 13, value: (o) => fmt(o.createdAt) },
      { header: "Customer",     w: 22, pdf: 20, value: (o) => o.user?.name || "—" },
      { header: "Email",        w: 26,          value: (o) => o.user?.email || "—" },
      { header: "Phone",        w: 14,          value: (o) => o.shippingAddress?.phone || "—" },
      { header: "Amount",       w: 12, pdf: 13, value: (o) => money(o.totalPrice), excel: (o) => o.totalPrice || 0 },
      { header: "Method",       w: 10, pdf: 11, value: (o) => o.paymentMethod === "razorpay" ? "Online" : "COD" },
      { header: "Pay Status",   w: 12, pdf: 12, value: (o) => cap(o.paymentStatus) },
      { header: "Paid On",      w: 16, pdf: 14, value: (o) => fmt(o.paidAt) },
      { header: "Payment ID",   w: 24,          value: (o) => o.razorpayPaymentId || "—" },
      { header: "Razorpay Ord", w: 24,          value: (o) => o.razorpayOrderId || "—" },
      { header: "Order Status", w: 12,          value: (o) => o.status || "—" },
    ],
  },

  /* ── Users ──────────────────────────────────────────── */
  users: {
    label: "Users",
    model: User,
    select: "-password -resetPasswordOTP -resetPasswordOTPExpiry",
    baseFilter: () => ({ role: "user" }),
    filters: {
      status: (v) => ({ isBlocked: v === "blocked" }),
    },
    summary: (rows) => [
      ["Total Users", rows.length],
      ["Active", count(rows, (u) => !u.isBlocked)],
      ["Blocked", count(rows, (u) => u.isBlocked)],
    ],
    columns: [
      { header: "#",          w: 4,  pdf: 5,  value: (u, i) => i + 1 },
      { header: "Name",       w: 24, pdf: 22, value: (u) => u.name },
      { header: "Email",      w: 28, pdf: 30, value: (u) => u.email },
      { header: "Phone",      w: 14, pdf: 16, value: (u) => u.phone || "—" },
      { header: "Role",       w: 8,           value: (u) => u.role },
      { header: "Blocked",    w: 8,  pdf: 11, value: (u) => yn(u.isBlocked) },
      { header: "Registered", w: 16, pdf: 16, value: (u) => fmt(u.createdAt) },
    ],
  },

  /* ── Products ───────────────────────────────────────── */
  products: {
    label: "Products",
    model: Product,
    filters: {
      status: (v) => ({ isAvailable: v === "available" }),
    },
    summary: (rows) => [
      ["Total Products", rows.length],
      ["Total Catalogue Value", money(rows.reduce((s, p) => s + (p.price || 0), 0))],
      ["Available", count(rows, (p) => p.isAvailable)],
      ["Out of Stock", count(rows, (p) => !p.stock)],
    ],
    columns: [
      { header: "#",              w: 4,  pdf: 5,  value: (p, i) => i + 1 },
      { header: "Name",           w: 28, pdf: 28, value: (p) => p.name },
      { header: "Category",       w: 14, pdf: 16, value: (p) => p.category || "—" },
      { header: "Price",          w: 12, pdf: 12, value: (p) => money(p.price), excel: (p) => p.price || 0 },
      { header: "Original Price", w: 18,          value: (p) => p.originalPrice || 0 },
      { header: "Stock",          w: 8,  pdf: 9,  value: (p) => p.stock ?? "—" },
      { header: "Available",      w: 10, pdf: 11, value: (p) => yn(p.isAvailable) },
      { header: "Custom Print",   w: 14, pdf: 12, value: (p) => p.requiresCustomImage ? "Required" : p.allowCustomImage ? "Optional" : "No" },
      { header: "SKU",            w: 12,          value: (p) => p.sku || "—" },
      { header: "Brand",          w: 14,          value: (p) => p.brand || "—" },
      { header: "Added",          w: 14, pdf: 14, value: (p) => fmt(p.createdAt) },
    ],
  },

  /* ── Reviews ────────────────────────────────────────── */
  reviews: {
    label: "Reviews",
    model: Review,
    filters: {
      status: (v) => ({ status: v }),
    },
    summary: (rows) => [
      ["Total Reviews", rows.length],
      ["Approved", count(rows, (r) => r.status === "approved")],
      ["Pending", count(rows, (r) => r.status === "pending")],
      ["Average Rating", rows.length ? `${(rows.reduce((s, r) => s + (r.rating || 0), 0) / rows.length).toFixed(2)} / 5` : "—"],
    ],
    columns: [
      { header: "#",       w: 4,  pdf: 5,  value: (r, i) => i + 1 },
      { header: "Name",    w: 22, pdf: 18, value: (r) => r.name },
      { header: "Email",   w: 28, pdf: 24, value: (r) => r.email },
      { header: "Rating",  w: 8,  pdf: 9,  value: (r) => r.rating, excel: (r) => r.rating },
      { header: "Status",  w: 12, pdf: 11, value: (r) => cap(r.status) },
      { header: "Review",  w: 60, pdf: 20, value: (r) => r.message || "—" },
      { header: "Date",    w: 16, pdf: 13, value: (r) => fmt(r.createdAt) },
    ],
  },

  /* ── Inquiries ──────────────────────────────────────── */
  inquiries: {
    label: "Inquiries",
    model: Inquiry,
    filters: {
      status: (v) => ({ status: v }),
    },
    summary: (rows) => [
      ["Total Inquiries", rows.length],
      ["Responded", count(rows, (q) => q.status === "responded")],
      ["Pending", count(rows, (q) => q.status === "pending")],
    ],
    columns: [
      { header: "#",              w: 4,  pdf: 5,  value: (q, i) => i + 1 },
      { header: "Name",           w: 22, pdf: 18, value: (q) => q.name },
      { header: "Email",          w: 28, pdf: 24, value: (q) => q.email },
      { header: "Phone",          w: 14, pdf: 15, value: (q) => q.phone || "—" },
      { header: "Subject",        w: 30, pdf: 20, value: (q) => q.subject || "—" },
      { header: "Message",        w: 60,          value: (q) => q.message || "—" },
      { header: "Status",         w: 12, pdf: 11, value: (q) => cap(q.status) },
      { header: "Admin Response", w: 50,          value: (q) => q.adminResponse || "—" },
      { header: "Date",           w: 16, pdf: 13, value: (q) => fmt(q.createdAt) },
    ],
  },

  /* ── Replacements ───────────────────────────────────── */
  replacements: {
    label: "Replacements",
    model: Replacement,
    populate: [
      { path: "user", select: "name email phone" },
      { path: "order", select: "_id" },
    ],
    filters: {
      status: (v) => ({ status: v }),
    },
    summary: (rows) => [
      ["Total Requests", rows.length],
      ["Pending", count(rows, (r) => r.status === "pending")],
      ["Approved", count(rows, (r) => r.status === "approved")],
      ["Completed", count(rows, (r) => r.status === "completed")],
      ["Rejected", count(rows, (r) => r.status === "rejected")],
    ],
    columns: [
      { header: "#",              w: 4,  pdf: 5,  value: (r, i) => i + 1 },
      { header: "Request ID",     w: 12, pdf: 12, value: (r) => id8(r._id) },
      { header: "Date",           w: 14, pdf: 13, value: (r) => fmt(r.createdAt) },
      { header: "Customer",       w: 22, pdf: 18, value: (r) => r.user?.name || "—" },
      { header: "Email",          w: 26,          value: (r) => r.user?.email || "—" },
      { header: "Order ID",       w: 12, pdf: 12, value: (r) => id8(r.order?._id) },
      { header: "Product",        w: 28, pdf: 20, value: (r) => r.productName || "—" },
      { header: "Reason",         w: 24, pdf: 16, value: (r) => r.reason || "—" },
      { header: "Description",    w: 60,          value: (r) => r.description || "—" },
      { header: "Status",         w: 12, pdf: 12, value: (r) => cap(r.status) },
      { header: "Admin Response", w: 50,          value: (r) => r.adminResponse || "—" },
      { header: "Images",         w: 8,           value: (r) => r.images?.length || 0 },
    ],
  },

  /* ── Categories ─────────────────────────────────────── */
  categories: {
    label: "Categories",
    model: Category,
    sort: { sortOrder: 1, name: 1 },
    filters: {
      status: (v) => ({ isActive: v === "active" }),
    },
    summary: (rows) => [
      ["Total Categories", rows.length],
      ["Active", count(rows, (c) => c.isActive)],
      ["Total Subcategories", rows.reduce((s, c) => s + (c.subcategories?.length || 0), 0)],
    ],
    columns: [
      { header: "#",             w: 4,  pdf: 5,  value: (c, i) => i + 1 },
      { header: "Name",          w: 26, pdf: 24, value: (c) => c.name },
      { header: "Slug",          w: 26, pdf: 22, value: (c) => c.slug },
      { header: "Subcategories", w: 14, pdf: 13, value: (c) => c.subcategories?.length || 0 },
      { header: "Subcategory Names", w: 50,      value: (c) => c.subcategories?.map((s) => s.name).join(", ") || "—" },
      { header: "Active",        w: 8,  pdf: 10, value: (c) => yn(c.isActive) },
      { header: "Sort Order",    w: 10, pdf: 11, value: (c) => c.sortOrder ?? 0 },
      { header: "Description",   w: 50,          value: (c) => c.description || "—" },
      { header: "Created",       w: 14, pdf: 15, value: (c) => fmt(c.createdAt) },
    ],
  },

  /* ── Events ─────────────────────────────────────────── */
  events: {
    label: "Events",
    model: Event,
    populate: [{ path: "createdBy", select: "name" }],
    filters: {
      status: (v) => ({ isActive: v === "active" }),
    },
    summary: (rows) => {
      const now = new Date();
      return [
        ["Total Events", rows.length],
        ["Active", count(rows, (e) => e.isActive)],
        ["Expired", count(rows, (e) => e.expiresAt && new Date(e.expiresAt) < now)],
      ];
    },
    columns: [
      { header: "#",           w: 4,  pdf: 5,  value: (e, i) => i + 1 },
      { header: "Title",       w: 30, pdf: 26, value: (e) => e.title },
      { header: "Badge",       w: 16, pdf: 15, value: (e) => e.badge || "—" },
      { header: "Active",      w: 8,  pdf: 10, value: (e) => yn(e.isActive) },
      { header: "Expires",     w: 16, pdf: 15, value: (e) => fmt(e.expiresAt) },
      { header: "Link",        w: 36,          value: (e) => e.link || "—" },
      { header: "Description", w: 60, pdf: 14, value: (e) => e.description || "—" },
      { header: "Created By",  w: 20,          value: (e) => e.createdBy?.name || "—" },
      { header: "Created",     w: 14, pdf: 15, value: (e) => fmt(e.createdAt) },
    ],
  },
};

/* ══════════════════════════════════════════════════════════
   RENDERERS
══════════════════════════════════════════════════════════ */
const BRAND = "#c41230";
const FOOT  = "#1a1a1a";

const cell = (col, rec, i) => {
  const v = col.value(rec, i);
  return v === undefined || v === null || v === "" ? "—" : v;
};

/** Excel workbook: a Summary sheet plus the data sheet. */
const sendExcel = (res, def, key, records, filterNote) => {
  const wb = XLSX.utils.book_new();

  const ws0 = XLSX.utils.aoa_to_sheet([
    [`Cloud Graphics Amravati — ${def.label} Export`],
    ["Generated", new Date().toLocaleString("en-IN")],
    [],
    ...def.summary(records),
    [],
    ...filterNote.map(([k, v]) => [`Filter: ${k}`, v]),
  ]);
  ws0["!cols"] = [{ wch: 28 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, ws0, "Summary");

  const rows = records.map((rec, i) => {
    const out = {};
    def.columns.forEach((c) => {
      out[c.header] = c.excel ? c.excel(rec, i) : cell(c, rec, i);
    });
    return out;
  });

  const ws1 = rows.length
    ? XLSX.utils.json_to_sheet(rows)
    : XLSX.utils.aoa_to_sheet([def.columns.map((c) => c.header), ["No records matched the selected filters"]]);
  ws1["!cols"] = def.columns.map((c) => ({ wch: c.w }));
  XLSX.utils.book_append_sheet(wb, ws1, def.label.slice(0, 31));

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.setHeader("Content-Disposition", `attachment; filename="${key}_export_${Date.now()}.xlsx"`);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  return res.send(buf);
};

/** PDF report: branded header, summary box, striped table, footer. */
const sendPdf = (res, def, key, records, filterNote) => {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  res.setHeader("Content-Disposition", `attachment; filename="${key}_export_${Date.now()}.pdf"`);
  res.setHeader("Content-Type", "application/pdf");
  doc.pipe(res);

  const pageW = doc.page.width;
  const avail = pageW - 80;

  /* Lay the PDF columns out proportionally so any column set fits the page. */
  const pdfCols = (() => {
    const picked = def.columns.filter((c) => c.pdf);
    const total  = picked.reduce((s, c) => s + c.pdf, 0);
    let x = 40;
    return picked.map((c) => {
      const w = (c.pdf / total) * avail;
      const col = { ...c, x, w };
      x += w;
      return col;
    });
  })();

  const drawHeaderBand = () => {
    doc.rect(0, 0, pageW, 70).fill(BRAND);
    doc.fillColor("#fff").fontSize(18).font("Helvetica-Bold").text("Cloud Graphics Amravati", 40, 18);
    doc.fontSize(10).font("Helvetica").text(`${def.label} Export Report`, 40, 42);
    doc.text(`Generated: ${new Date().toLocaleString("en-IN")}`, 40, 56);
  };

  const drawTableHead = (top) => {
    doc.rect(40, top, avail, 20).fill(BRAND);
    doc.fillColor("#fff").fontSize(8).font("Helvetica-Bold");
    pdfCols.forEach((c) => doc.text(c.header, c.x + 3, top + 6, { width: c.w - 4, ellipsis: true }));
    doc.font("Helvetica").fontSize(8);
  };

  drawHeaderBand();

  /* Summary box — height follows the number of lines. */
  const lines = [...def.summary(records), ...filterNote];
  const boxH  = lines.length * 15 + 12;
  doc.fillColor(FOOT).fontSize(11).font("Helvetica-Bold").text("Summary", 40, 90);
  doc.rect(40, 105, avail, boxH).fill("#f7f7f7").stroke("#e0e0e0");
  doc.fillColor("#333").fontSize(10).font("Helvetica");
  lines.forEach(([k, v], i) => doc.text(`${k}: ${v}`, 55, 115 + i * 15));

  let y = 105 + boxH + 20;
  drawTableHead(y);
  y += 20;

  if (!records.length) {
    doc.fillColor("#888").fontSize(9).text("No records matched the selected filters.", 55, y + 8);
    y += 26;
  }

  records.forEach((rec, i) => {
    if (y > doc.page.height - 80) {
      doc.addPage();
      y = 40;
      drawTableHead(y);
      y += 20;
    }
    doc.rect(40, y, avail, 18).fill(i % 2 === 0 ? "#ffffff" : "#f9f9f9");
    doc.fillColor("#333");
    pdfCols.forEach((c) => doc.text(String(cell(c, rec, i)), c.x + 3, y + 5, { width: c.w - 4, ellipsis: true, lineBreak: false }));
    y += 18;
  });

  doc.rect(0, doc.page.height - 30, pageW, 30).fill(FOOT);
  doc.fillColor("#aaa").fontSize(8).text("© Cloud Graphics Amravati — Confidential", 40, doc.page.height - 18);
  doc.end();
};

/* ══════════════════════════════════════════════════════════
   GENERIC EXPORT HANDLER  →  GET /api/export/:type
══════════════════════════════════════════════════════════ */
const exportData = async (req, res) => {
  try {
    const key = String(req.params.type || "").toLowerCase();
    const def = DATASETS[key];
    if (!def) {
      return res.status(400).json({
        message: `Unknown export type "${key}". Available: ${Object.keys(DATASETS).join(", ")}`,
      });
    }

    const { format = "excel", range, from, to } = req.query;

    /* Build the filter: base + date + whatever this dataset accepts. */
    const filter = { ...(def.baseFilter ? def.baseFilter(req.query) : {}) };
    const dateF = buildDateFilter(range, from, to);
    if (dateF) filter.createdAt = dateF;

    const filterNote = [["Date Range", range === "custom" && from && to ? `${from} to ${to}` : (range || "All time")]];

    Object.entries(def.filters || {}).forEach(([param, build]) => {
      const value = req.query[param];
      if (value && value !== "all") {
        Object.assign(filter, build(value));
        filterNote.push([param.charAt(0).toUpperCase() + param.slice(1), value]);
      }
    });

    let q = def.model.find(filter);
    if (def.select) q = q.select(def.select);
    (def.populate || []).forEach((p) => { q = q.populate(p.path, p.select); });
    const records = await q.sort(def.sort || { createdAt: -1 }).lean();

    return format === "pdf"
      ? sendPdf(res, def, key, records, filterNote)
      : sendExcel(res, def, key, records, filterNote);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Row counts per dataset, so the admin UI can preview the size of an export. */
const exportCounts = async (req, res) => {
  try {
    const { range, from, to } = req.query;
    const dateF = buildDateFilter(range, from, to);

    const entries = await Promise.all(
      Object.entries(DATASETS).map(async ([key, def]) => {
        const filter = { ...(def.baseFilter ? def.baseFilter({}) : {}) };
        if (dateF) filter.createdAt = dateF;
        return [key, await def.model.countDocuments(filter)];
      })
    );

    res.json(Object.fromEntries(entries));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { exportData, exportCounts, DATASETS };
