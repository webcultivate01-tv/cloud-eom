const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // TLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const header = `
  <div style="background:#c41230;padding:20px 28px;">
    <h2 style="color:#fff;margin:0;font-size:1.2rem;">☁️ Cloud Graphics Amravati</h2>
  </div>`;

const footer = `
  <div style="background:#f7f7f7;padding:14px 28px;text-align:center;">
    <p style="color:#bbb;font-size:0.75rem;margin:0;">© 2025 Cloud Graphics Amravati. All rights reserved.</p>
  </div>`;

const wrap = (body) =>
  `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">${header}<div style="padding:28px;">${body}</div>${footer}</div>`;

const sendCancelOTP = async ({ toEmail, toName, orderId, otp }) => {
  const shortId = orderId.slice(-8).toUpperCase();
  await transporter.sendMail({
    from: `"Cloud Graphics Amravati" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Order Cancellation OTP — #${shortId}`,
    html: wrap(`
      <p style="color:#333;font-size:0.95rem;">Hi <strong>${toName}</strong>,</p>
      <p style="color:#333;font-size:0.9rem;">
        You requested to cancel your order <strong>#${shortId}</strong>.
        Use the OTP below to confirm the cancellation.
      </p>
      <div style="text-align:center;margin:28px 0;">
        <div style="display:inline-block;background:#fff5f6;border:2px dashed #c41230;border-radius:10px;padding:18px 40px;">
          <p style="color:#888;font-size:0.75rem;margin:0 0 6px;letter-spacing:1px;text-transform:uppercase;">Your OTP</p>
          <p style="color:#c41230;font-size:2.4rem;font-weight:900;letter-spacing:10px;margin:0;">${otp}</p>
        </div>
      </div>
      <p style="color:#888;font-size:0.82rem;">This OTP is valid for <strong>10 minutes</strong>. Do not share it with anyone.</p>
      <p style="color:#e53935;font-size:0.82rem;background:#fff5f6;padding:10px 14px;border-radius:6px;border-left:3px solid #c41230;">
        ⚠️ If you did not request this cancellation, please ignore this email — your order is safe.
      </p>
    `),
  });
};

const sendOrderConfirmation = async ({ toEmail, toName, order }) => {
  const shortId = order._id.toString().slice(-8).toUpperCase();
  const payLabel = order.paymentMethod === "razorpay" ? "💳 Online (Razorpay)" : "💵 Cash on Delivery";
  const itemRows = order.items
    .map(
      (it) =>
        `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#333;font-size:0.85rem;">${it.name}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#555;font-size:0.85rem;text-align:center;">${it.quantity}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #f0f0f0;color:#333;font-size:0.85rem;text-align:right;">₹${(it.price * it.quantity).toLocaleString("en-IN")}</td>
        </tr>`
    )
    .join("");

  await transporter.sendMail({
    from: `"Cloud Graphics Amravati" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Order Confirmed #${shortId} — Cloud Graphics Amravati`,
    html: wrap(`
      <p style="color:#333;font-size:0.95rem;">Hi <strong>${toName}</strong>,</p>
      <p style="color:#2e7d32;font-size:0.9rem;background:#f1f8e9;padding:10px 14px;border-radius:6px;border-left:3px solid #2e7d32;">
        ✅ Your order has been placed successfully! We'll start processing it right away.
      </p>

      <div style="text-align:center;margin:20px 0;">
        <div style="display:inline-block;background:#fff5f6;border:2px dashed #c41230;border-radius:10px;padding:14px 36px;">
          <p style="color:#888;font-size:0.72rem;margin:0 0 4px;letter-spacing:1px;text-transform:uppercase;">Your Order ID</p>
          <p style="color:#c41230;font-size:1.5rem;font-weight:900;letter-spacing:4px;margin:0;">#${shortId}</p>
          <p style="color:#888;font-size:0.72rem;margin:4px 0 0;">Use this ID to track your order</p>
        </div>
      </div>

      <h3 style="color:#1a1a1a;font-size:0.9rem;margin:20px 0 8px;">📦 Order Details</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr style="background:#f7f7f7;">
            <th style="padding:8px 10px;text-align:left;font-size:0.78rem;color:#888;text-transform:uppercase;">Item</th>
            <th style="padding:8px 10px;text-align:center;font-size:0.78rem;color:#888;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 10px;text-align:right;font-size:0.78rem;color:#888;text-transform:uppercase;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:10px;font-weight:700;color:#1a1a1a;font-size:0.9rem;">Total</td>
            <td style="padding:10px;font-weight:700;color:#c41230;font-size:1rem;text-align:right;">₹${order.totalPrice.toLocaleString("en-IN")}</td>
          </tr>
        </tfoot>
      </table>

      <h3 style="color:#1a1a1a;font-size:0.9rem;margin:16px 0 8px;">🚚 Shipping Address</h3>
      <p style="color:#555;font-size:0.85rem;line-height:1.7;margin:0;">
        <strong>${order.shippingAddress.fullName}</strong>${order.shippingAddress.addressType ? ` <span style="background:#f0f0f0;padding:1px 6px;border-radius:3px;font-size:0.72rem;">${order.shippingAddress.addressType}</span>` : ""}<br/>
        📞 ${order.shippingAddress.phone}<br/>
        ${order.shippingAddress.address}${order.shippingAddress.addressLine2 ? ", " + order.shippingAddress.addressLine2 : ""}<br/>
        ${order.shippingAddress.landmark ? "Near: " + order.shippingAddress.landmark + "<br/>" : ""}
        ${order.shippingAddress.city}${order.shippingAddress.state ? ", " + order.shippingAddress.state : ""} – ${order.shippingAddress.pincode}
      </p>

      <div style="margin-top:16px;padding:12px 16px;background:#f7f7f7;border-radius:8px;display:flex;justify-content:space-between;">
        <span style="color:#555;font-size:0.82rem;">Payment Method</span>
        <span style="color:#333;font-weight:700;font-size:0.82rem;">${payLabel}</span>
      </div>

      ${order.customerNote ? `<p style="color:#888;font-size:0.82rem;margin-top:12px;">📝 Note: ${order.customerNote}</p>` : ""}

      <p style="color:#888;font-size:0.82rem;margin-top:20px;">
        You will receive another email when your order status is updated. Thank you for shopping with us!
      </p>
    `),
  });
};

const STATUS_MESSAGES = {
  Processing: { emoji: "⚙️", text: "Your order is now being processed by our team.", color: "#1565c0", bg: "#e3f2fd" },
  Printing:   { emoji: "🖨️", text: "Your custom print job is in progress!", color: "#6a1b9a", bg: "#f3e5f5" },
  Shipped:    { emoji: "🚚", text: "Your order is on its way! Get ready to receive it.", color: "#1b5e20", bg: "#e8f5e9" },
  Delivered:  { emoji: "🎉", text: "Your order has been delivered. Enjoy your purchase!", color: "#2e7d32", bg: "#f1f8e9" },
  Cancelled:  { emoji: "❌", text: "Your order has been cancelled.", color: "#b71c1c", bg: "#ffebee" },
};

const sendOrderStatusUpdate = async ({ toEmail, toName, orderId, status, totalPrice, items }) => {
  const shortId = orderId.slice(-8).toUpperCase();
  const info = STATUS_MESSAGES[status] || { emoji: "📋", text: `Your order status has been updated to ${status}.`, color: "#333", bg: "#f7f7f7" };

  const itemList = items
    ? items.map((it) => `<li style="color:#555;font-size:0.85rem;margin-bottom:4px;">${it.name} × ${it.quantity}</li>`).join("")
    : "";

  await transporter.sendMail({
    from: `"Cloud Graphics Amravati" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Order #${shortId} — Status Updated: ${status}`,
    html: wrap(`
      <p style="color:#333;font-size:0.95rem;">Hi <strong>${toName}</strong>,</p>

      <div style="background:${info.bg};border-left:4px solid ${info.color};border-radius:6px;padding:14px 18px;margin:16px 0;">
        <p style="color:${info.color};font-size:1rem;font-weight:700;margin:0 0 4px;">${info.emoji} Order Status: ${status}</p>
        <p style="color:#555;font-size:0.88rem;margin:0;">${info.text}</p>
      </div>

      <p style="color:#555;font-size:0.85rem;">
        <strong>Order ID:</strong> #${shortId}<br/>
        <strong>Total:</strong> ₹${totalPrice ? totalPrice.toLocaleString("en-IN") : "—"}
      </p>

      ${itemList ? `<ul style="padding-left:16px;margin-top:8px;">${itemList}</ul>` : ""}

      <p style="color:#888;font-size:0.82rem;margin-top:20px;">
        If you have any questions, reply to this email or contact us.<br/>
        Thank you for choosing Cloud Graphics Amravati!
      </p>
    `),
  });
};

module.exports = { sendCancelOTP, sendOrderConfirmation, sendOrderStatusUpdate };
