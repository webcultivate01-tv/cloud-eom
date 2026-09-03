const path = require("path");
const fs = require("fs");
const multer = require("multer");
const sharp = require("sharp");

// Root of the local image store: backend/uploads
const UPLOADS_ROOT = path.join(__dirname, "..", "uploads");

// Every folder an image can land in. Anything else falls back to "misc".
const ALLOWED_FOLDERS = [
  "products",
  "categories",
  "events",
  "orders",
  "replacements",
  "reviews",
  "misc",
];

// Make sure uploads/ and every subfolder exists on boot
const ensureFolders = () => {
  ALLOWED_FOLDERS.forEach((folder) => {
    fs.mkdirSync(path.join(UPLOADS_ROOT, folder), { recursive: true });
  });
};
ensureFolders();

// Folders that get one sub-folder per customer, so a repeat customer's images
// all collect in the same place: uploads/orders/<customer>/<file>
const USER_SCOPED_FOLDERS = ["orders"];

// Artwork a customer uploads for a custom order gets printed on the physical
// product, so it is stored byte-for-byte exactly as they sent it — no re-encode,
// no downscale. Every other folder is catalog/evidence imagery that is only ever
// looked at on screen, so it is converted to WebP to keep uploads/ small.
const ORIGINAL_QUALITY_FOLDERS = ["orders"];

const slugify = (str) =>
  String(str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

// Per-customer folder name: readable name plus a short slice of their user id,
// so two customers with the same name never share a folder and the folder
// survives a later name change.
const userFolderName = (user) => {
  if (!user || !user._id) return "guest";
  const id = String(user._id);
  return `${slugify(user.name) || "customer"}-${id.slice(-8)}`;
};

// Pick the destination folder from ?folder=... (query) or the form field,
// sanitised. Returns a path relative to uploads/, which may be nested.
const resolveFolder = (req) => {
  const raw = String(req.query.folder || req.body?.folder || "misc")
    .toLowerCase()
    .trim();
  const folder = ALLOWED_FOLDERS.includes(raw) ? raw : "misc";
  if (USER_SCOPED_FOLDERS.includes(folder)) {
    return `${folder}/${userFolderName(req.user)}`;
  }
  return folder;
};

// resolveFolder can return a nested path ("orders/tejas-c33d9c19"), so compare
// on the top-level folder only.
const isOriginalQuality = (folder) =>
  ORIGINAL_QUALITY_FOLDERS.includes(String(folder).split("/")[0]);

const ALLOWED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".svg",
  ".avif",
  ".tiff",
  ".tif",
];

// SVG is a vector — rasterising it to WebP would throw away the whole point of
// the format, so it is always written through untouched.
const PASSTHROUGH_MIMES = ["image/svg+xml"];

// WebP knobs. Quality 82 is visually indistinguishable from the JPEG original
// at roughly a third of the bytes; the dimension cap stops a 6000px phone photo
// being stored at full resolution when no page on the site renders it that big.
const WEBP_QUALITY = Number(process.env.WEBP_QUALITY || 82);
const MAX_IMAGE_DIMENSION = Number(process.env.MAX_IMAGE_DIMENSION || 2000);

// Print-ready artwork is genuinely large, so the cap has to clear a full
// resolution design file, not just a web-sized product photo.
const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024;

// Files are buffered in memory so sharp can re-encode them before anything
// reaches the disk — a failed conversion then leaves no half-written file behind.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

// Unique, readable, url-safe filename built from what was uploaded.
const buildFileName = (originalname, ext) => {
  const name = String(originalname || "");
  const base =
    path
      .basename(name, path.extname(name))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "image";
  return `${base}-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;
};

// Extension to store an untouched file under, falling back to .jpg for anything
// unrecognised so the served file still has a sane content type.
const safeExtension = (originalname) => {
  const ext = path.extname(String(originalname || "")).toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : ".jpg";
};

// Convert a raster upload (JPG/PNG/TIFF/AVIF/…) to WebP, downscaling anything
// larger than MAX_IMAGE_DIMENSION. Animated GIFs keep their frames. Returns
// { buffer, ext }; if sharp cannot decode the file the original bytes are kept
// so a slightly odd image still uploads instead of failing the whole request.
const toWebp = async (file) => {
  if (PASSTHROUGH_MIMES.includes(file.mimetype)) {
    return { buffer: file.buffer, ext: safeExtension(file.originalname) };
  }

  const animated = file.mimetype === "image/gif";
  try {
    const buffer = await sharp(file.buffer, { animated })
      // Apply the EXIF orientation phone cameras set, then drop the metadata
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return { buffer, ext: ".webp" };
  } catch (error) {
    console.error(`WebP conversion failed for ${file.originalname}: ${error.message}`);
    return { buffer: file.buffer, ext: safeExtension(file.originalname) };
  }
};

// Absolute URL that gets saved in MongoDB, e.g.
//   http://localhost:5000/uploads/products/mug-123.webp
//   http://localhost:5000/uploads/orders/tejas-mehar-c33d9c19/artwork-123.png
const buildImageUrl = (req, file) => {
  const base = (process.env.BASE_URL || `${req.protocol}://${req.get("host")}`)
    .replace(/\/+$/, "");
  // Relative to uploads/, so nested per-customer folders survive
  const relative = path.relative(UPLOADS_ROOT, file.path).split(path.sep).join("/");
  return `${base}/uploads/${relative}`;
};

// Write one buffered upload into uploads/<folder>/ and hand back the absolute
// URL to store in MongoDB. Catalog imagery is converted to WebP on the way in;
// customer print artwork is written exactly as uploaded. Sets file.path so
// deleteLocalImage and anything else inspecting the multer file keeps working.
const saveImage = async (req, file) => {
  const folder = resolveFolder(req);
  const dir = path.join(UPLOADS_ROOT, folder);
  await fs.promises.mkdir(dir, { recursive: true });

  const { buffer, ext } = isOriginalQuality(folder)
    ? { buffer: file.buffer, ext: safeExtension(file.originalname) }
    : await toWebp(file);

  const target = path.join(dir, buildFileName(file.originalname, ext));
  await fs.promises.writeFile(target, buffer);

  file.path = target;
  file.size = buffer.length;
  return buildImageUrl(req, file);
};

// Delete a stored file given the URL previously saved in MongoDB. No-ops for
// external URLs (Cloudinary leftovers, pasted links) and missing files.
const deleteLocalImage = (imageUrl = "") => {
  try {
    const marker = "/uploads/";
    const idx = String(imageUrl).indexOf(marker);
    if (idx === -1) return false;
    const relative = imageUrl.slice(idx + marker.length).split("?")[0];
    const target = path.resolve(UPLOADS_ROOT, relative);
    // Never escape the uploads root
    if (!target.startsWith(UPLOADS_ROOT + path.sep)) return false;
    if (!fs.existsSync(target)) return false;
    fs.unlinkSync(target);
    return true;
  } catch {
    return false;
  }
};

module.exports = {
  upload,
  saveImage,
  buildImageUrl,
  deleteLocalImage,
  resolveFolder,
  isOriginalQuality,
  userFolderName,
  slugify,
  UPLOADS_ROOT,
  ALLOWED_FOLDERS,
  USER_SCOPED_FOLDERS,
  ORIGINAL_QUALITY_FOLDERS,
};
