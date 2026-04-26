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

const sendCancelOTP = async ({ toEmail, toName, orderId, otp }) => {
  const shortId = orderId.slice(-8).toUpperCase();

  await transporter.sendMail({
    from: `"Cloud Graphics Amravati" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: `Order Cancellation OTP — #${shortId}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#fff;border:1px solid #e0e0e0;border-radius:10px;overflow:hidden;">
        <div style="background:#c41230;padding:20px 28px;">
          <h2 style="color:#fff;margin:0;font-size:1.2rem;">☁️ Cloud Graphics Amravati</h2>
        </div>
        <div style="padding:28px;">
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
        </div>
        <div style="background:#f7f7f7;padding:14px 28px;text-align:center;">
          <p style="color:#bbb;font-size:0.75rem;margin:0;">© 2025 Cloud Graphics Amravati. All rights reserved.</p>
        </div>
      </div>
    `,
  });
};

module.exports = { sendCancelOTP };
