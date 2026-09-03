/**
 * Recovery script: re-fetch the product images from Cloudinary into
 * backend/uploads/products and point MongoDB at the local copies.
 *
 * Why this exists: the local files downloaded by migrateImagesToLocal.js were
 * deleted by an over-broad cleanup, leaving the DB pointing at missing files.
 * Cloudinary still holds every original, so the set of images belonging to each
 * product is reconstructed from upload timestamps: each product's images were
 * uploaded to Cloudinary in a burst seconds before the product document was
 * saved, and for every product the number of assets in that burst matches the
 * number of image slots on the document exactly.
 *
 * Run:  node restoreProductImages.js --dry
 *       node restoreProductImages.js
 */
const path = require("path");
const fs = require("fs");
const https = require("https");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const Product = require("./models/Product");
const { slugify, UPLOADS_ROOT } = require("./config/localUpload");

const BASE_URL = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");
const DRY_RUN = process.argv.includes("--dry");

// product name -> the Cloudinary upload burst that produced its images.
// `expect` is the number of images the document should end up with (the main
// `image` field is a duplicate of images[0], so it is not counted here).
const RECOVERY_MAP = [
  { name: "Men’s Cotton Pant",                 from: "2026-05-14T06:46:20Z", to: "2026-05-14T06:46:30Z", expect: 3 },
  { name: "Printed Oversized T-Shirt",              from: "2026-05-14T06:49:50Z", to: "2026-05-14T06:49:55Z", expect: 5 },
  { name: "Custom Photo Mug",                       from: "2026-05-14T06:59:25Z", to: "2026-05-14T06:59:30Z", expect: 2 },
  { name: "Magic Color Changing Mug",               from: "2026-05-14T07:12:49Z", to: "2026-05-14T07:12:54Z", expect: 3 },
  { name: "Custom Printed Round Neck T-Shirt",      from: "2026-05-14T07:19:32Z", to: "2026-05-14T07:19:37Z", expect: 2 },
  { name: "Oversized Custom Graphic T-Shirt",       from: "2026-05-14T07:25:23Z", to: "2026-05-14T07:25:28Z", expect: 1 },
];

const auth = Buffer.from(
  `${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`
).toString("base64");

const getJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Authorization: `Basic ${auth}` } }, (res) => {
        let d = "";
        res.on("data", (c) => (d += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(d));
          } catch {
            reject(new Error(d.slice(0, 200)));
          }
        });
      })
      .on("error", reject);
  });

const download = (url, dest) =>
  new Promise((resolve, reject) => {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    https
      .get(url, { timeout: 30000 }, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on("finish", () => file.close(() => resolve(dest)));
        file.on("error", (err) => fs.unlink(dest, () => reject(err)));
      })
      .on("error", reject);
  });

const listCloudinary = async () => {
  let cursor = null;
  let all = [];
  do {
    const url =
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}` +
      `/resources/image?max_results=500&type=upload&prefix=cloud-graphics-orders` +
      (cursor ? `&next_cursor=${cursor}` : "");
    const j = await getJson(url);
    if (j.error) throw new Error(j.error.message);
    all = all.concat(j.resources || []);
    cursor = j.next_cursor;
  } while (cursor);
  return all;
};

const run = async () => {
  const assets = await listCloudinary();
  console.log(`Cloudinary assets available: ${assets.length}${DRY_RUN ? "   (DRY RUN)" : ""}\n`);

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });

  const audit = [];
  let restored = 0;
  let failed = 0;

  for (const entry of RECOVERY_MAP) {
    const product = await Product.findOne({ name: entry.name });
    if (!product) {
      console.log(`SKIP  no product named ${entry.name}`);
      continue;
    }

    // Assets uploaded inside this product's burst, in a stable order
    const burst = assets
      .filter((r) => r.created_at >= entry.from && r.created_at <= entry.to)
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.public_id.localeCompare(b.public_id));

    if (burst.length !== entry.expect) {
      console.log(`SKIP  ${entry.name}: expected ${entry.expect} assets, found ${burst.length} — not touching this one`);
      failed++;
      continue;
    }

    const localUrls = [];
    for (const asset of burst) {
      const filename = `${slugify(entry.name) || "product"}-${Date.now()}-${Math.round(Math.random() * 1e6)}.${asset.format}`;
      const dest = path.join(UPLOADS_ROOT, "products", filename);
      if (!DRY_RUN) await download(asset.secure_url, dest);
      localUrls.push(`${BASE_URL}/uploads/products/${filename}`);
      audit.push({ product: entry.name, cloudinary: asset.secure_url, bytes: asset.bytes, local: `/uploads/products/${filename}` });
    }

    product.images = localUrls;
    product.image = localUrls[0];
    if (!DRY_RUN) await product.save({ validateBeforeSave: false });

    restored += localUrls.length;
    console.log(`OK    ${entry.name}: ${localUrls.length} image(s) restored`);
  }

  // Keep a permanent record of the cloudinary -> local mapping
  const auditPath = path.join(__dirname, "image-recovery-map.json");
  if (!DRY_RUN) fs.writeFileSync(auditPath, JSON.stringify(audit, null, 2));

  console.log(`\nImages restored : ${restored}`);
  console.log(`Products skipped: ${failed}`);
  if (!DRY_RUN) console.log(`Mapping saved to: ${auditPath}`);

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error("Restore failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
