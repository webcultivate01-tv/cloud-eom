const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const { uploadsPathFromUrl, UPLOADS_ROOT } = require("./localUpload");

// Uploads are stored at full print quality — a 5 MB design file is exactly what
// the printer needs. Once the order has actually been delivered that file has
// done its job: it is kept only as the record of what was printed, so it can be
// shrunk to something the disk can hold for years without the customer or the
// admin ever noticing the difference on screen.
const ARCHIVE_TARGET_BYTES = Number(process.env.ARCHIVE_TARGET_MB || 1) * 1024 * 1024;

// Long edge of the archived copy. 2400px still reads as sharp on any screen and
// is enough to re-print a small item in a pinch, without holding the full
// 6000px original for every order ever placed.
const ARCHIVE_MAX_DIMENSION = Number(process.env.ARCHIVE_MAX_DIMENSION || 2400);

// Quality ladder — the first rung that lands under the target wins, so a photo
// that fits at 85 is never needlessly pushed down to 55.
const QUALITY_STEPS = [85, 75, 65, 55];

// Vectors and animations are left alone: an SVG is already tiny, and re-encoding
// a GIF frame-by-frame costs more than it saves.
const SKIP_EXTENSIONS = [".svg", ".gif"];

// Compress one already-stored image in place, returning the URL it should be
// known by afterwards (the extension changes when the file is re-encoded).
//
// Returns the original URL untouched whenever there is nothing to do or
// anything goes wrong — a failed archive must never cost an order its record of
// what was printed.
const archiveImage = async (imageUrl = "") => {
  try {
    const relative = uploadsPathFromUrl(imageUrl);
    if (!relative) return imageUrl; // external or pasted URL

    const source = path.resolve(UPLOADS_ROOT, relative);
    if (!fs.existsSync(source)) return imageUrl;

    const ext = path.extname(source).toLowerCase();
    if (SKIP_EXTENSIONS.includes(ext)) return imageUrl;

    const { size } = await fs.promises.stat(source);
    if (size <= ARCHIVE_TARGET_BYTES) return imageUrl; // already small enough

    const input = await fs.promises.readFile(source);

    let output = null;
    for (const quality of QUALITY_STEPS) {
      output = await sharp(input)
        // Bake in the EXIF orientation before the metadata is dropped
        .rotate()
        .resize({
          width: ARCHIVE_MAX_DIMENSION,
          height: ARCHIVE_MAX_DIMENSION,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality })
        .toBuffer();
      if (output.length <= ARCHIVE_TARGET_BYTES) break;
    }

    // Re-encoding can lose to an already well-compressed original; keep whichever
    // file is actually smaller.
    if (!output || output.length >= size) return imageUrl;

    const target = path.join(
      path.dirname(source),
      `${path.basename(source, path.extname(source))}.webp`
    );
    await fs.promises.writeFile(target, output);
    if (target !== source) await fs.promises.unlink(source).catch(() => {});

    const marker = "/uploads/";
    const idx = String(imageUrl).indexOf(marker);
    const nextRelative = path
      .relative(UPLOADS_ROOT, target)
      .split(path.sep)
      .join("/");

    console.log(
      `Archived ${relative}: ${(size / 1024 / 1024).toFixed(2)}MB -> ${(output.length / 1024 / 1024).toFixed(2)}MB`
    );
    return `${imageUrl.slice(0, idx + marker.length)}${nextRelative}`;
  } catch (error) {
    console.error(`Archive skipped for ${imageUrl}: ${error.message}`);
    return imageUrl;
  }
};

// Shrink every piece of customer artwork on a delivered order and save the new
// URLs back onto it. Never throws — an archiving problem must not turn a
// successful "mark as delivered" into a failed request.
//
// Runs at most once per order: `artworkArchivedAt` is the guard, so marking an
// order Delivered a second time cannot put the artwork through the encoder
// again and lose a little more of it each pass.
const archiveOrderArtwork = async (order) => {
  try {
    if (!order?.items?.length) return false;
    if (order.artworkArchivedAt) return false;

    let changed = false;
    for (const item of order.items) {
      if (!item.uploadedImage) continue;
      const archived = await archiveImage(item.uploadedImage);
      if (archived !== item.uploadedImage) {
        item.uploadedImage = archived;
        changed = true;
      }
    }

    if (changed) {
      order.artworkArchivedAt = new Date();
      await order.save();
    }
    return changed;
  } catch (error) {
    console.error(`Order artwork archive failed for ${order?._id}: ${error.message}`);
    return false;
  }
};

module.exports = {
  archiveImage,
  archiveOrderArtwork,
  ARCHIVE_TARGET_BYTES,
  ARCHIVE_MAX_DIMENSION,
};
