/* Upload rules, mirrored from the server (backend/config/localUpload.js, also
   served by GET /api/upload/limits).

   Nothing uploaded to this site is compressed or downscaled: every image ends up
   on a printed product, and print needs the full-resolution original. The size
   cap is therefore the only thing keeping the image store in check, so it is
   enforced on the server — this copy just lets the file picker reject an
   oversized file instantly instead of spending a slow upload on it first. */

export const MAX_UPLOAD_MB = 5;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const formatBytes = (bytes) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;

/* Returns an error message to show the user, or null when the file is fine. */
export const validateImageFile = (file) => {
  if (!file) return "No file selected";
  if (!file.type.startsWith("image/")) return "Please select an image file";
  if (file.size > MAX_UPLOAD_BYTES) {
    return `"${file.name}" is ${formatBytes(file.size)} — the maximum is ${MAX_UPLOAD_MB} MB`;
  }
  return null;
};
