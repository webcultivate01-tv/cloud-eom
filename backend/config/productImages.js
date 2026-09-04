const Product = require("../models/Product");
const {
  moveLocalImage,
  uploadsPathFromUrl,
  productFolderName,
} = require("./localUpload");

// Only files that already live in the product store get relocated. An admin who
// pasted the URL of a category banner or a customer's order artwork into a
// product gallery keeps pointing at that original file — a product save must
// never drag another part of the site's images along with it.
const isProductFile = (relative) => String(relative).split("/")[0] === "products";

// Is this file also stored on a different product? Two products only ever share
// a file when an admin pasted one product's image URL into another, but if that
// has happened the file must stay put, or the other product's gallery breaks.
const isUsedByAnotherProduct = async (imageUrl, productId) => {
  const filter = { $or: [{ image: imageUrl }, { images: imageUrl }] };
  if (productId) filter._id = { $ne: productId };
  return Boolean(await Product.exists(filter));
};

// Move a product's uploaded images into uploads/products/<category>/<product>/
// and hand back the URL list as it should be stored in MongoDB.
//
// Call this on every create and update: on create it collects images that were
// uploaded before the form was filled in, and on update it follows a rename or
// a category change, so the folder on disk always matches the product as it
// currently reads in the database.
//
// External and pasted URLs are returned untouched, and any file that cannot be
// moved keeps its existing URL, so a failure here can never leave the database
// pointing at a file that is not there.
const organizeProductImages = async (images = [], { category, name, productId } = {}) => {
  const targetFolder = productFolderName(category, name);
  const organized = [];

  for (const imageUrl of images) {
    const relative = uploadsPathFromUrl(imageUrl);
    if (!relative || !isProductFile(relative)) {
      organized.push(imageUrl);
      continue;
    }
    if (await isUsedByAnotherProduct(imageUrl, productId)) {
      organized.push(imageUrl);
      continue;
    }
    organized.push(moveLocalImage(imageUrl, targetFolder));
  }

  return organized;
};

module.exports = { organizeProductImages, isProductFile, isUsedByAnotherProduct };
