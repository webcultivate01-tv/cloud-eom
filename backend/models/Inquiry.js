const mongoose = require("mongoose");

// Where an enquiry sits in the sales pipeline. Ordered the way a lead actually
// travels, so the admin panel can render them in this order without a second
// list to keep in step. "pending" is where every new enquiry starts; won/lost
// are the two closed states.
const INQUIRY_STATUSES = [
  "pending",      // just came in, nobody has touched it yet
  "contacted",    // called / emailed the customer back
  "visited",      // customer came to the shop, or we visited them
  "not_visited",  // appointment made but they never turned up
  "quoted",       // a price has been sent
  "won",          // converted into an order
  "lost",         // went cold or went elsewhere
];

// Statuses that mean the lead is closed — used for the panel's summary counts.
const CLOSED_STATUSES = ["won", "lost"];

const inquirySchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    email:   { type: String, required: true, trim: true, lowercase: true },
    phone:   { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, default: "", trim: true },
    status:  { type: String, enum: INQUIRY_STATUSES, default: "pending" },
    // The reply that was emailed to the customer, and when it went out.
    // Separate from `status`: an enquiry can be replied to and still be sitting
    // at "quoted" or move on to "won" later.
    adminResponse: { type: String, default: "" },
    respondedAt:   { type: Date, default: null },
    // Free-text working notes, admin-only — never emailed to the customer.
    notes: { type: String, default: "", trim: true },
    // Who last moved the enquiry along, for accountability on a shared panel
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inquiry", inquirySchema);
module.exports.INQUIRY_STATUSES = INQUIRY_STATUSES;
module.exports.CLOSED_STATUSES = CLOSED_STATUSES;
