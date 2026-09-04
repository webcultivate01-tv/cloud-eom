const Inquiry = require("../models/Inquiry");
const { INQUIRY_STATUSES } = require("../models/Inquiry");
const {
  sendInquiryToAdmin,
  sendInquiryConfirmationToUser,
  sendInquiryResponseToUser,
} = require("../config/mailer");

// A date filter sent as "2026-01-31" means that whole local day, not the single
// instant of midnight — otherwise a "to" date silently excludes its own day.
const startOfDay = (value) => {
  const d = new Date(value);
  return isNaN(d) ? undefined : new Date(d.setHours(0, 0, 0, 0));
};
const endOfDay = (value) => {
  const d = new Date(value);
  return isNaN(d) ? undefined : new Date(d.setHours(23, 59, 59, 999));
};

// Search text goes into a RegExp, so anything the admin types that happens to be
// regex syntax ("50% off?", "c++ mugs") has to be neutralised first.
const escapeRegex = (str) =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc  Submit a new inquiry
// @route POST /api/inquiry
// @access Public
const createInquiry = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const inquiry = await Inquiry.create({ name, email, phone, subject, message });

    // Notify admin (non-blocking)
    sendInquiryToAdmin({ name, email, phone, subject, message }).catch(() => {});

    // Confirmation to user (non-blocking)
    sendInquiryConfirmationToUser({ toEmail: email, toName: name, subject }).catch(() => {});

    res.status(201).json({ message: "Inquiry submitted successfully", inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Get all inquiries (admin), newest first.
//        Optional filters: ?status=won,quoted&from=2026-01-01&to=2026-01-31&search=raj
//        The admin panel filters the list it already holds in the browser, so
//        these are for exports and direct API use rather than for the table.
// @route GET /api/inquiry
// @access Admin
const getAllInquiries = async (req, res) => {
  try {
    const { status, from, to, search } = req.query;
    const filter = {};

    if (status && status !== "all") {
      const wanted = String(status).split(",").filter((s) => INQUIRY_STATUSES.includes(s));
      if (wanted.length) filter.status = { $in: wanted };
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = startOfDay(from);
      if (to) filter.createdAt.$lte = endOfDay(to);
    }

    if (search) {
      const rx = new RegExp(escapeRegex(String(search).trim()), "i");
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { subject: rx }];
    }

    const inquiries = await Inquiry.find(filter).sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Move an enquiry along the pipeline (contacted / visited / quoted / …).
//        Working notes can be saved with the status change or on their own.
// @route PATCH /api/inquiry/:id/status
// @access Admin
const updateInquiryStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (status !== undefined && !INQUIRY_STATUSES.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Expected one of: ${INQUIRY_STATUSES.join(", ")}`,
      });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

    if (status !== undefined) inquiry.status = status;
    if (notes !== undefined) inquiry.notes = String(notes).trim();
    inquiry.updatedBy = req.user._id;
    await inquiry.save();

    res.json({ message: "Inquiry updated", inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Get count of pending inquiries (admin — for notification badge)
// @route GET /api/inquiry/pending-count
// @access Admin
const getPendingCount = async (req, res) => {
  try {
    const count = await Inquiry.countDocuments({ status: "pending" });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Delete an inquiry
// @route DELETE /api/inquiry/:id
// @access Admin
const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });
    res.json({ message: "Inquiry deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

// @desc  Respond to an inquiry — sends reply email and marks as responded
// @route PATCH /api/inquiry/:id/respond
// @access Admin
const respondToInquiry = async (req, res) => {
  try {
    const { adminResponse } = req.body;
    if (!adminResponse || !adminResponse.trim()) {
      return res.status(400).json({ message: "Response message is required" });
    }

    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) return res.status(404).json({ message: "Inquiry not found" });

    inquiry.adminResponse = adminResponse.trim();
    inquiry.respondedAt = new Date();
    inquiry.updatedBy = req.user._id;
    // Replying is the first contact, so an untouched enquiry moves to
    // "contacted". One the admin has already pushed further along ("quoted",
    // "won", …) keeps the status they set — a reply must not walk it backwards.
    if (inquiry.status === "pending") inquiry.status = "contacted";
    await inquiry.save();

    // Send reply to user (non-blocking)
    sendInquiryResponseToUser({
      toEmail: inquiry.email,
      toName:  inquiry.name,
      subject: inquiry.subject,
      adminResponse: inquiry.adminResponse,
    }).catch(() => {});

    res.json({ message: "Response sent successfully", inquiry });
  } catch (err) {
    res.status(500).json({ message: err.message || "Server error" });
  }
};

module.exports = {
  createInquiry,
  getAllInquiries,
  getPendingCount,
  deleteInquiry,
  respondToInquiry,
  updateInquiryStatus,
};
