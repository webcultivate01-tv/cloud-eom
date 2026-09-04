const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const PDFDocument = require("pdfkit");
const {
  COMPANY, BRAND, LOGO_WHITE, round2, splitGst,
} = require("./company");
const { uploadsPathFromUrl, UPLOADS_ROOT } = require("./localUpload");

/* ══════════════════════════════════════════════════════════════
   TAX INVOICE

   One page, four blocks: brand band -> invoice meta + Bill To ->
   items table with the tax summary folded into its last rows ->
   signature. Nothing is printed below the signature: no page
   numbers, no site name, no "about" strip.

   Catalogue prices are GST-inclusive, so the tax lines are derived
   from the amount actually charged rather than added on top of it.
   The grand total therefore always matches what the customer paid,
   to the paisa.
══════════════════════════════════════════════════════════════ */

const PAGE_MARGIN = 40;

/** "3 Sept 2026" — date only. Invoices carry no time of day. */
const invoiceDate = (d) =>
  new Date(d || Date.now()).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

/**
 * Indian financial year label for a date — 1 Apr to 31 Mar.
 * Invoice numbers restart each year, so this keys the counter.
 */
const financialYear = (d = new Date()) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const start = dt.getMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
};

/** "CG/2026-27/0042" */
const formatInvoiceNumber = (seq, date) =>
  `CG/${financialYear(date)}/${String(seq).padStart(4, "0")}`;

const ITEM_IMAGE_SIZE = 24; // px, square, drawn into the item row

/**
 * Load a line item's product photo and hand back a small square PNG
 * buffer ready for `doc.image`. Product photos are saved in whatever
 * format the admin uploaded (webp/avif/gif included), which PDFKit
 * cannot embed directly — sharp re-encodes to PNG and crops to a
 * uniform thumbnail so every row lines up regardless of the source
 * image's aspect ratio.
 *
 * Resolves to null for anything that isn't one of our own local
 * uploads, is missing from disk, or fails to decode — the row just
 * prints without a thumbnail rather than breaking the invoice.
 */
const resolveItemImage = async (imageUrl) => {
  try {
    const relative = uploadsPathFromUrl(imageUrl);
    if (!relative) return null;
    const abs = path.resolve(UPLOADS_ROOT, relative);
    if (!fs.existsSync(abs)) return null;
    return await sharp(abs)
      .resize(ITEM_IMAGE_SIZE * 2, ITEM_IMAGE_SIZE * 2, { fit: "cover" })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
};

/* ── Drawing helpers ─────────────────────────────────────────── */

const line = (doc, x1, y1, x2, y2, color = BRAND.line, width = 0.7) =>
  doc.save().lineWidth(width).strokeColor(color).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();

const box = (doc, x, y, w, h, color = BRAND.line, width = 0.7) =>
  doc.save().lineWidth(width).strokeColor(color).rect(x, y, w, h).stroke().restore();

/** "093076 41746" -> "+91 9307641746" — the leading trunk zero is dropped for the country code. */
const formatPhone = (phone) => `+91 ${String(phone).replace(/\D/g, "").replace(/^0+/, "")}`;

/**
 * One right-aligned "Label: value" pair with the label bold and the value
 * regular weight — PDFKit has no mixed-weight run within a single `.text`
 * call, so the two pieces are measured and placed by hand, right edge
 * anchored to `rightX`.
 */
const drawRightLabelValue = (doc, label, value, rightX, y, { size = 8.5, color = "#cfe6f5" } = {}) => {
  const gap = 4;
  doc.font("Helvetica").fontSize(size);
  const valueW = doc.widthOfString(value);
  doc.font("Helvetica-Bold").fontSize(size);
  const labelW = doc.widthOfString(label);

  let x = rightX - labelW - gap - valueW;
  doc.fillColor(color).text(label, x, y, { lineBreak: false });
  x += labelW + gap;
  doc.font("Helvetica").fillColor(color).text(value, x, y, { lineBreak: false });
};

/**
 * Brand band across the top: white logo on the left, business identity
 * on the right. This is the only heavy block on the page — everything
 * below it is quiet rules and text.
 */
const drawHeader = (doc) => {
  const W = doc.page.width;
  const bandH = 108;

  doc.save().rect(0, 0, W, bandH).fill(BRAND.band).restore();
  // A thin brighter edge picks up the lighter blue in the logo mark.
  doc.save().rect(0, bandH, W, 3).fill(BRAND.primary).restore();

  if (fs.existsSync(LOGO_WHITE)) {
    doc.image(LOGO_WHITE, PAGE_MARGIN, 18, { fit: [100, 56] });
  }

  const rx = PAGE_MARGIN + 130;
  const rw = W - rx - PAGE_MARGIN;
  const rightEdge = W - PAGE_MARGIN;

  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(17)
     .text(COMPANY.legalName.toUpperCase(), rx, 20, { width: rw, align: "right" });

  doc.font("Helvetica").fontSize(8.5).fillColor("#cfe6f5");
  doc.text(`${COMPANY.address1}, ${COMPANY.address2}`, rx, 43, { width: rw, align: "right" });

  let cy = 58;
  [
    ["Email:", COMPANY.email],
    ["Mobile:", formatPhone(COMPANY.phone)],
    ["Website:", COMPANY.website],
  ].forEach(([label, value]) => {
    drawRightLabelValue(doc, label, value, rightEdge, cy);
    cy += 11;
  });

  return bandH + 3;
};

/** Invoice No., Order Number, Invoice Date and Payment Method side by side in one row. */
const drawMeta = (doc, top, { invoiceNumber, date, orderId, paymentLabel }) => {
  const W = doc.page.width;
  const rw = W - PAGE_MARGIN * 2;
  const y = top + 22;

  const cols = [
    { label: "Invoice No.",    value: invoiceNumber,       w: 118 },
    { label: "Order Number",   value: orderId,             w: 118 },
    { label: "Invoice Date",   value: invoiceDate(date),   w: 100 },
    { label: "Payment Method", value: paymentLabel || "—", w: 0 }, // fills the remainder
  ];
  cols[3].w = rw - cols[0].w - cols[1].w - cols[2].w;
  let cx = PAGE_MARGIN;
  cols.forEach((c) => { c.x = cx; cx += c.w; });

  doc.font("Helvetica-Bold").fontSize(9.5);
  const valueH = Math.max(...cols.map((c) => doc.heightOfString(c.value, { width: c.w - 12 })));

  cols.forEach((c) => {
    doc.font("Helvetica").fontSize(8).fillColor(BRAND.muted)
       .text(c.label, c.x, y, { width: c.w - 12 });
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(BRAND.ink)
       .text(c.value, c.x, y + 11, { width: c.w - 12 });
  });

  return y + 11 + valueH + 16;
};

/** Bill To panel — the customer block, boxed like the reference bill. */
const drawBillTo = (doc, top, { name, phone, email, address }) => {
  const W = doc.page.width;
  const w = W - PAGE_MARGIN * 2;

  const rows = [
    ["Customer Name", name || "—"],
    ["Phone No", phone || "—"],
    ...(email ? [["Email", email]] : []),
    ["Address", address || "—"],
  ];

  // Measure first so a long address wraps inside the box instead of clipping.
  doc.font("Helvetica-Bold").fontSize(9);
  const addrH = doc.heightOfString(address || "—", { width: w - 112 });
  const h = 27 + (rows.length - 1) * 15 + Math.max(addrH, 12) + 10;

  doc.save().rect(PAGE_MARGIN, top, w, 20).fill(BRAND.light).restore();
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(BRAND.dark)
     .text("BILL TO", PAGE_MARGIN + 10, top + 6.5, { characterSpacing: 0.6 });

  let y = top + 27;
  rows.forEach(([k, v]) => {
    doc.font("Helvetica").fontSize(9).fillColor(BRAND.muted)
       .text(`${k}:`, PAGE_MARGIN + 10, y, { width: 92 });
    doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.ink)
       .text(String(v), PAGE_MARGIN + 102, y, { width: w - 112 });
    y += k === "Address" ? Math.max(addrH, 12) + 3 : 15;
  });

  box(doc, PAGE_MARGIN, top, w, h, BRAND.ink, 0.9);
  return top + h;
};

/* Column geometry: the description takes the slack, the numeric columns
   are fixed so decimal points line up down the page. */
const itemColumns = (w) => {
  const cols = [
    { key: "no",     label: "No.",              w: 28, align: "center" },
    { key: "title",  label: "Item Description", w: w - 238, align: "left" },
    { key: "qty",    label: "Qty",              w: 40, align: "center" },
    { key: "rate",   label: "Rate (Rs.)",       w: 78, align: "right" },
    { key: "amount", label: "Amount (Rs.)",     w: 92, align: "right" },
  ];
  let cx = PAGE_MARGIN;
  cols.forEach((c) => { c.x = cx; cx += c.w; });
  return cols;
};

/** Height of one item row — the wrapped description (or the thumbnail) sets it. */
const rowHeight = (doc, col, title, hasImage) => {
  doc.font("Helvetica").fontSize(9);
  const textW = col.w - 14 - (hasImage ? ITEM_IMAGE_SIZE + 8 : 0);
  const minH = hasImage ? ITEM_IMAGE_SIZE + 12 : 26;
  return Math.max(doc.heightOfString(title, { width: textW }) + 14, minH);
};

/**
 * Items table plus the tax summary. The summary rows share the table's
 * grid so the whole thing reads as one block, as the reference bill
 * does — but with the standard taxable-value -> CGST -> SGST -> total
 * sequence rather than a repeated gross figure.
 */
const drawItems = (doc, top, { items, totals }) => {
  const W = doc.page.width;
  const w = W - PAGE_MARGIN * 2;
  const x0 = PAGE_MARGIN;
  const cols = itemColumns(w);
  const HEAD_H = 24;

  const cellText = (col, text, y) =>
    doc.text(String(text), col.x + 7, y, { width: col.w - 14, align: col.align });

  // Header row
  doc.save().rect(x0, top, w, HEAD_H).fill(BRAND.dark).restore();
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#ffffff");
  cols.forEach((c) => cellText(c, c.label.toUpperCase(), top + 8));

  let y = top + HEAD_H;

  items.forEach((it, i) => {
    const hasImage = Boolean(it.image);
    const h = rowHeight(doc, cols[1], it.title, hasImage);
    if (i % 2 === 1) doc.save().rect(x0, y, w, h).fill("#fafcfe").restore();

    doc.font("Helvetica").fontSize(9).fillColor(BRAND.muted);
    cellText(cols[0], i + 1, y + 8);

    let titleX = cols[1].x + 7;
    let titleW = cols[1].w - 14;
    if (hasImage) {
      const imgY = y + (h - ITEM_IMAGE_SIZE) / 2;
      try {
        doc.save().roundedRect(titleX, imgY, ITEM_IMAGE_SIZE, ITEM_IMAGE_SIZE, 3).clip();
        doc.image(it.image, titleX, imgY, { width: ITEM_IMAGE_SIZE, height: ITEM_IMAGE_SIZE });
        doc.restore();
      } catch {
        // A corrupt/undecodable thumbnail must never break the invoice.
      }
      titleX += ITEM_IMAGE_SIZE + 8;
      titleW -= ITEM_IMAGE_SIZE + 8;
    }

    doc.font("Helvetica").fontSize(9).fillColor(BRAND.ink)
       .text(it.title, titleX, y + 8, { width: titleW });
    doc.font("Helvetica").fontSize(8.5).fillColor(BRAND.muted);
    cellText(cols[2], it.qty, y + 8);
    doc.font("Helvetica").fontSize(9).fillColor(BRAND.ink);
    cellText(cols[3], Number(it.rate).toFixed(2), y + 8);
    doc.font("Helvetica-Bold");
    cellText(cols[4], Number(it.amount).toFixed(2), y + 8);

    y += h;
    line(doc, x0, y, x0 + w, y, BRAND.line, 0.5);
  });

  const itemsBottom = y;

  /* Tax summary — the label spans every column up to Amount, so each
     figure stays in the same column as the item amounts above it. */
  const labelW = cols[4].x - x0;
  const summaryRow = (label, value, { bold = false, fill = null } = {}) => {
    const h = bold ? 27 : 22;
    if (fill) doc.save().rect(x0, y, w, h).fill(fill).restore();
    /* The total row sets its label and its figure at different sizes, and
       PDFKit positions text by its top edge rather than its baseline — so
       the smaller label is nudged down by the ascender difference to sit
       on the same line as the figure beside it. */
    const labelSize = bold ? 10 : 9;
    const valueSize = bold ? 11 : 9;
    const pad = bold ? 8.5 : 7;
    const ASCENDER = 0.718; // Helvetica, as a fraction of point size
    const labelPad = pad + (valueSize - labelSize) * ASCENDER;

    doc.font(bold ? "Helvetica-Bold" : "Helvetica")
       .fontSize(labelSize)
       .fillColor(bold ? BRAND.dark : BRAND.muted)
       .text(label, x0 + 7, y + labelPad, { width: labelW - 14, align: "right" });
    doc.font("Helvetica-Bold").fontSize(valueSize)
       .fillColor(bold ? BRAND.dark : BRAND.ink)
       .text(Number(value).toFixed(2), cols[4].x + 7, y + pad,
             { width: cols[4].w - 14, align: "right" });
    y += h;
    line(doc, x0, y, x0 + w, y, BRAND.line, 0.5);
  };

  summaryRow("Taxable Value", totals.taxable);
  summaryRow(`CGST @ ${totals.cgstRate}%`, totals.cgst);
  summaryRow(`SGST @ ${totals.sgstRate}%`, totals.sgst);
  summaryRow("Total Amount", totals.gross, { bold: true, fill: BRAND.light });

  /* Column rules stop where the summary begins — the summary spans
     columns and must not be cut by them. Drawn before the outer frame
     so the frame stays the crispest line on the block. */
  cols.slice(1).forEach((c) => line(doc, c.x, top, c.x, itemsBottom, BRAND.line, 0.5));
  box(doc, x0, top, w, y - top, BRAND.ink, 0.9);

  return y;
};

/**
 * Signature block. Payment method is already shown up in the invoice
 * meta, so it isn't repeated down here. The page ends here on purpose —
 * nothing is printed below it.
 */
const drawFooter = (doc, top) => {
  const W = doc.page.width;
  const sigTop = top + 16;
  const sigX1 = W - PAGE_MARGIN - 160;
  const sigX2 = W - PAGE_MARGIN;

  line(doc, sigX1, sigTop + 56, sigX2, sigTop + 56, BRAND.ink, 0.8);
  doc.font("Helvetica-Bold").fontSize(9).fillColor(BRAND.ink)
     .text("Authorised Signatory", sigX1, sigTop + 62, { width: sigX2 - sigX1, align: "center" });

  return sigTop + 78;
};

/**
 * Build the invoice model from an Order document — the single place
 * that decides what a line costs and how the tax splits, so the PDF,
 * the emails and the GST report can never disagree.
 */
const buildInvoiceModel = (order) => {
  const items = (order.items || []).map((it) => ({
    title: it.size ? `${it.name}  (Size: ${it.size})` : it.name,
    qty: it.quantity,
    rate: round2(it.price),
    amount: round2(it.price * it.quantity),
    // Populated by the caller as `items.product` — falls back to "" when the
    // product was deleted or the query didn't populate it, and the row then
    // simply prints without a thumbnail.
    imageUrl: (it.product && it.product.image) || "",
  }));

  const totals = splitGst(order.totalPrice);

  const addr = order.shippingAddress || {};
  const addressText = [
    addr.address,
    addr.addressLine2,
    addr.landmark ? `Near ${addr.landmark}` : "",
    [addr.city, addr.state].filter(Boolean).join(", "),
    addr.pincode,
  ].filter(Boolean).join(", ");

  const paid = order.paymentStatus === "paid";
  const COLLECTION_LABELS = { cash: "Cash", upi: "UPI", card: "Card" };
  const paymentLabel = order.paymentMethod === "razorpay"
    ? `Online (Razorpay) — ${paid ? "Paid" : "Pending"}`
    : `Cash on Delivery — ${
        paid
          ? `Collected${order.paymentCollectedVia ? ` (${COLLECTION_LABELS[order.paymentCollectedVia] || order.paymentCollectedVia})` : ""}`
          : "Pending"
      }`;

  return {
    invoiceNumber: order.invoice?.number || "DRAFT",
    date: order.invoice?.issuedAt || order.deliveredAt || order.paidAt || order.createdAt,
    // Orders placed before order numbers existed fall back to the old
    // ID-slice reference so their bills still print something meaningful.
    orderId: order.orderNumber || order._id.toString().slice(-8).toUpperCase(),
    customer: {
      name:    addr.fullName || order.user?.name || "—",
      phone:   addr.phone || order.user?.phone || "—",
      email:   order.user?.email || "",
      address: addressText || "—",
    },
    items,
    totals,
    paymentLabel,
  };
};

/**
 * Render the invoice into a PDFKit document. The caller pipes it
 * wherever it needs to go — an HTTP response, or a buffer for email.
 *
 * Async because each line item's product thumbnail has to be read off
 * disk and re-encoded before drawing starts — PDFKit itself stays a
 * plain synchronous document once that's done.
 */
const renderInvoice = async (order) => {
  const model = buildInvoiceModel(order);
  const images = await Promise.all(model.items.map((it) => resolveItemImage(it.imageUrl)));
  model.items.forEach((it, i) => { it.image = images[i]; });

  const doc = new PDFDocument({
    size: "A4",
    margin: PAGE_MARGIN,
    info: {
      Title: `Tax Invoice ${model.invoiceNumber}`,
      Author: COMPANY.name,
      Subject: `Invoice for order ${model.orderId}`,
    },
  });

  let y = drawHeader(doc);
  y = drawMeta(doc, y, model);
  y = drawBillTo(doc, y, model.customer);
  y = drawItems(doc, y + 16, model);
  drawFooter(doc, y);

  doc.end();
  return doc;
};

/** The same invoice collected into a Buffer, for mail attachments. */
const renderInvoiceBuffer = async (order) => {
  const doc = await renderInvoice(order);
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
};

/** Filename used for both the download and the mail attachment. */
const invoiceFileName = (order) => {
  const num = order.invoice?.number || order._id.toString().slice(-8).toUpperCase();
  return `Invoice-${String(num).replace(/[/\\]/g, "-")}.pdf`;
};

module.exports = {
  renderInvoice,
  renderInvoiceBuffer,
  buildInvoiceModel,
  formatInvoiceNumber,
  financialYear,
  invoiceDate,
  invoiceFileName,
};
