/**
 * Backfill for orders delivered before delivery settled their payment.
 *
 *   node backfillDeliveredPayments.js            # dry run — reports, changes nothing
 *   node backfillDeliveredPayments.js --apply    # writes the changes
 *
 * Delivering a Cash-on-Delivery order now marks it paid, because the
 * courier has handed over the parcel and collected the cash. Orders
 * delivered before that rule existed are still sitting at
 * paymentStatus "pending", so they read as unpaid on the Orders screen
 * and are missing from the revenue and GST reports.
 *
 * This walks those orders forward: marks them collected, dates the
 * payment from the delivery, and issues each one the tax invoice number
 * it should have had. Numbers are drawn from the same counter the live
 * flow uses, so the sequence stays gapless.
 *
 * Safe to run more than once — an order that already has a number keeps
 * it, and an order that is already paid is left alone.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Order = require("./models/Order");
require("./models/User"); // registered so the populate below can resolve
const { ensureInvoiceNumber } = require("./controllers/invoiceController");

const APPLY = process.argv.includes("--apply");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000 });
  console.log(`Connected to "${mongoose.connection.name}"\n`);

  /* COD orders that were delivered but never marked collected. Online
     orders are excluded on purpose: an unpaid "razorpay" order means the
     money genuinely never arrived, and inventing a payment for it would
     put revenue in the books that the bank account cannot back. */
  const stranded = await Order.find({
    status: "Delivered",
    paymentMethod: "cod",
    paymentStatus: "pending",
  }).populate("user", "name email").lean();

  /* Delivered orders that are settled but were never given an invoice
     number, because they predate invoicing. */
  const unbilled = await Order.find({
    status: "Delivered",
    paymentStatus: "paid",
    "invoice.number": { $not: { $gt: "" } },
  }).lean();

  console.log(`${stranded.length} delivered COD order(s) still marked unpaid`);
  stranded.forEach((o) => {
    const when = o.deliveredAt || o.updatedAt || o.createdAt;
    console.log(`  #${o._id.toString().slice(-8).toUpperCase()}  ${(o.user?.name || "—").padEnd(20)}` +
      `  Rs.${String(o.totalPrice).padStart(8)}  delivered ${new Date(when).toLocaleDateString("en-IN")}`);
  });

  console.log(`\n${unbilled.length} delivered order(s) without an invoice number`);
  unbilled.forEach((o) =>
    console.log(`  #${o._id.toString().slice(-8).toUpperCase()}  Rs.${String(o.totalPrice).padStart(8)}`)
  );

  if (!APPLY) {
    console.log("\nDRY RUN — nothing was written.");
    console.log("Re-run with --apply to make these changes.");
    await mongoose.disconnect();
    return;
  }

  let settled = 0;
  for (const o of stranded) {
    const paidAt = o.deliveredAt || o.updatedAt || o.createdAt;
    await Order.updateOne({ _id: o._id }, { $set: { paymentStatus: "paid", paidAt } });
    settled += 1;
  }

  /* Re-read so the invoice pass sees the payments just settled, and
     number them oldest-delivery-first — an invoice sequence should run
     in the order the sales actually happened. */
  const toNumber = await Order.find({
    status: "Delivered",
    paymentStatus: "paid",
    "invoice.number": { $not: { $gt: "" } },
  }).sort({ deliveredAt: 1, createdAt: 1 });

  let numbered = 0;
  for (const order of toNumber) {
    await ensureInvoiceNumber(order);
    console.log(`  #${order._id.toString().slice(-8).toUpperCase()} -> ${order.invoice.number}`);
    numbered += 1;
  }

  console.log(`\nDone. ${settled} payment(s) settled, ${numbered} invoice number(s) issued.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Backfill failed:", err.message);
  process.exit(1);
});
