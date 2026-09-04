const mongoose = require("mongoose");

/* A tiny named-sequence collection. Invoice numbers have to be gapless
   and unique per financial year even when two admins mark orders as
   delivered at the same moment, so they are handed out by an atomic
   findOneAndUpdate rather than counted from the Order collection. */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },   // e.g. "invoice:2026-27"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

/** Reserve and return the next number in the named sequence. */
const nextSequence = async (key) => {
  const doc = await Counter.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

/**
 * Reserve the next customer-facing order number for the current calendar
 * year — "2026-0001", "2026-0002", ... Keyed by year, so the sequence
 * resets to 0001 on its own each Jan 1 ("2027-0001", ...).
 */
const nextOrderNumber = async (date = new Date()) => {
  const year = date.getFullYear();
  const seq = await nextSequence(`order:${year}`);
  return `${year}-${String(seq).padStart(4, "0")}`;
};

module.exports = Counter;
module.exports.nextSequence = nextSequence;
module.exports.nextOrderNumber = nextOrderNumber;
