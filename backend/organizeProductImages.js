/**
 * One-off migration: file every existing product image under its own folder.
 *
 *   before:  uploads/products/custom-photo-mug-1788408607065-931761.jpg
 *   after:   uploads/products/mugs/custom-photo-mug/custom-photo-mug-1788408607065-931761.jpg
 *
 * Reads every product, moves the files it points at into
 * uploads/products/<category-slug>/<product-slug>/ and rewrites the URLs stored
 * in MongoDB to match. New uploads already land there — this is only for images
 * that predate the change.
 *
 * Safe to run more than once: an image already in the right folder is left
 * alone, and a file missing from disk keeps its current URL rather than being
 * pointed somewhere it is not.
 *
 * Run:  node organizeProductImages.js --dry     (report only, changes nothing)
 *       node organizeProductImages.js
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const Product = require("./models/Product");
const {
  moveLocalImage,
  uploadsPathFromUrl,
  productFolderName,
  UPLOADS_ROOT,
} = require("./config/localUpload");
const { isProductFile, isUsedByAnotherProduct } = require("./config/productImages");

const DRY_RUN = process.argv.includes("--dry");

const run = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is not set — check backend/.env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000 });
  console.log(DRY_RUN ? "DRY RUN — nothing will be written\n" : "");

  const products = await Product.find().sort({ name: 1 });
  let movedFiles = 0;
  let changedProducts = 0;
  let skipped = 0;

  for (const product of products) {
    const targetFolder = productFolderName(product.category, product.name);
    const nextImages = [];
    let changed = false;

    for (const imageUrl of product.images) {
      const relative = uploadsPathFromUrl(imageUrl);

      // Pasted/external URLs, and files belonging to another part of the site,
      // are left exactly as they are.
      if (!relative || !isProductFile(relative)) {
        nextImages.push(imageUrl);
        continue;
      }

      const currentFolder = path.posix.dirname(relative);
      if (currentFolder === targetFolder) {
        nextImages.push(imageUrl);
        continue;
      }

      if (!fs.existsSync(path.resolve(UPLOADS_ROOT, relative))) {
        console.log(`  MISSING  ${relative} — left pointing where it is`);
        nextImages.push(imageUrl);
        skipped++;
        continue;
      }

      if (await isUsedByAnotherProduct(imageUrl, product._id)) {
        console.log(`  SHARED   ${relative} — also used by another product, not moved`);
        nextImages.push(imageUrl);
        skipped++;
        continue;
      }

      if (DRY_RUN) {
        console.log(`  would move  ${relative}\n           -> ${targetFolder}/${path.basename(relative)}`);
        nextImages.push(imageUrl);
        movedFiles++;
        changed = true;
        continue;
      }

      const nextUrl = moveLocalImage(imageUrl, targetFolder);
      if (nextUrl !== imageUrl) {
        console.log(`  moved  ${relative}\n      -> ${uploadsPathFromUrl(nextUrl)}`);
        movedFiles++;
        changed = true;
      }
      nextImages.push(nextUrl);
    }

    if (!changed) continue;
    changedProducts++;
    console.log(`${product.name}  [${product.category}]  -> ${targetFolder}`);

    if (DRY_RUN) continue;
    product.images = nextImages;
    product.image = nextImages[0] || "";
    await product.save();
  }

  console.log(
    `\n${DRY_RUN ? "Would update" : "Updated"} ${changedProducts} product(s), ` +
    `${DRY_RUN ? "moving" : "moved"} ${movedFiles} file(s)` +
    (skipped ? `, skipped ${skipped}` : "") + "."
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
