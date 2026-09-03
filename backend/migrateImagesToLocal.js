/**
 * One-time migration: pull every remote image URL stored in MongoDB
 * (Cloudinary or any external link) down into backend/uploads/<folder>/
 * and rewrite the document to point at the new local URL.
 *
 * Run:  node migrateImagesToLocal.js
 *       node migrateImagesToLocal.js --dry     (report only, no writes)
 */
const path = require("path");
const fs = require("fs");
const https = require("https");
const http = require("http");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const Product = require("./models/Product");
const Category = require("./models/Category");
const Event = require("./models/Event");
const Order = require("./models/Order");
const Replacement = require("./models/Replacement");
// Reuse the same slug/folder rules the live upload path uses
const { slugify, userFolderName } = require("./config/localUpload");

const UPLOADS_ROOT = path.join(__dirname, "uploads");
const BASE_URL = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, "");
const DRY_RUN = process.argv.includes("--dry");

const stats = { downloaded: 0, skipped: 0, failed: 0, docsUpdated: 0 };
const failures = [];

const MIME_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
};

const isLocal = (url) => typeof url === "string" && url.includes("/uploads/");
const isRemote = (url) => typeof url === "string" && /^https?:\/\//i.test(url);


// Follow redirects, write the body to disk, return the saved path
const download = (url, destNoExt, redirects = 0) =>
  new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error("Too many redirects"));
    const client = url.startsWith("https") ? https : http;
    const req = client.get(url, { timeout: 30000 }, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        res.resume();
        return resolve(download(new URL(res.headers.location, url).href, destNoExt, redirects + 1));
      }
      if (res.statusCode !== 200) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const type = (res.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
      if (type && !type.startsWith("image/")) {
        res.resume();
        return reject(new Error(`Not an image (${type})`));
      }
      let ext = MIME_EXT[type];
      if (!ext) {
        const urlExt = path.extname(new URL(url).pathname).toLowerCase();
        ext = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(urlExt) ? urlExt : ".jpg";
      }
      const dest = `${destNoExt}${ext}`;
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(dest)));
      file.on("error", (err) => fs.unlink(dest, () => reject(err)));
    });
    req.on("timeout", () => req.destroy(new Error("Timeout")));
    req.on("error", reject);
  });

// Migrate one URL. Returns the new local URL, or the original on skip/failure.
const migrateUrl = async (url, folder, nameHint) => {
  if (!url || typeof url !== "string") return url;
  if (isLocal(url) || !isRemote(url)) {
    stats.skipped++;
    return url;
  }

  const base = `${slugify(nameHint) || "image"}-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

  if (DRY_RUN) {
    stats.downloaded++;
    return `${BASE_URL}/uploads/${folder}/${base}.jpg`;
  }

  try {
    const savedPath = await download(url, path.join(UPLOADS_ROOT, folder, base));
    stats.downloaded++;
    return `${BASE_URL}/uploads/${folder}/${path.basename(savedPath)}`;
  } catch (err) {
    stats.failed++;
    failures.push(`${folder} :: ${url} -> ${err.message}`);
    return url; // leave the original URL in place so nothing breaks
  }
};

const save = async (doc) => {
  if (DRY_RUN) return;
  await doc.save({ validateBeforeSave: false });
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI missing in .env");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`Connected to MongoDB${DRY_RUN ? "  (DRY RUN - nothing will be written)" : ""}`);
  console.log(`Uploads root: ${UPLOADS_ROOT}`);
  console.log(`Base URL:     ${BASE_URL}\n`);

  // Products
  const products = await Product.find({});
  console.log(`Products: ${products.length}`);
  for (const p of products) {
    let changed = false;
    const nextMain = await migrateUrl(p.image, "products", p.name);
    if (nextMain !== p.image) {
      p.image = nextMain;
      changed = true;
    }
    if (Array.isArray(p.images) && p.images.length) {
      const nextImages = [];
      for (const img of p.images) nextImages.push(await migrateUrl(img, "products", p.name));
      if (nextImages.some((u, i) => u !== p.images[i])) {
        p.images = nextImages;
        changed = true;
      }
    }
    if (changed) {
      await save(p);
      stats.docsUpdated++;
      console.log(`   ok  ${p.name}`);
    }
  }

  // Categories
  const categories = await Category.find({});
  console.log(`Categories: ${categories.length}`);
  for (const c of categories) {
    const next = await migrateUrl(c.image, "categories", c.name);
    if (next !== c.image) {
      c.image = next;
      await save(c);
      stats.docsUpdated++;
      console.log(`   ok  ${c.name}`);
    }
  }

  // Events
  const events = await Event.find({});
  console.log(`Events: ${events.length}`);
  for (const e of events) {
    const next = await migrateUrl(e.image, "events", e.title);
    if (next !== e.image) {
      e.image = next;
      await save(e);
      stats.docsUpdated++;
      console.log(`   ok  ${e.title}`);
    }
  }

  // Orders (customer-uploaded item images) — one folder per customer
  const orders = await Order.find({ "items.uploadedImage": { $nin: ["", null] } })
    .populate("user", "name");
  console.log(`Orders with uploaded images: ${orders.length}`);
  for (const o of orders) {
    let changed = false;
    const folder = `orders/${userFolderName(o.user)}`;
    for (const item of o.items) {
      const next = await migrateUrl(item.uploadedImage, folder, item.name);
      if (next !== item.uploadedImage) {
        item.uploadedImage = next;
        changed = true;
      }
    }
    if (changed) {
      await save(o);
      stats.docsUpdated++;
      console.log(`   ok  order ${o._id}`);
    }
  }

  // Replacements
  const replacements = await Replacement.find({});
  console.log(`Replacements: ${replacements.length}`);
  for (const r of replacements) {
    if (!Array.isArray(r.images) || !r.images.length) continue;
    const nextImages = [];
    for (const img of r.images) nextImages.push(await migrateUrl(img, "replacements", "replacement"));
    if (nextImages.some((u, i) => u !== r.images[i])) {
      r.images = nextImages;
      await save(r);
      stats.docsUpdated++;
      console.log(`   ok  replacement ${r._id}`);
    }
  }

  console.log("\n-------- Summary --------");
  console.log(`Images downloaded : ${stats.downloaded}`);
  console.log(`Already local/skip: ${stats.skipped}`);
  console.log(`Failed            : ${stats.failed}`);
  console.log(`Documents updated : ${stats.docsUpdated}`);
  if (failures.length) {
    console.log("\nFailed URLs (left untouched in MongoDB):");
    failures.forEach((f) => console.log(`   - ${f}`));
  }

  await mongoose.disconnect();
  console.log("\nDone.");
};

run().catch(async (err) => {
  console.error("Migration failed:", err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
