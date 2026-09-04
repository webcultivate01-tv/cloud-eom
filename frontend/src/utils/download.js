import api from "./api";

/* Invoices and reports live behind admin auth, so they cannot be fetched
   with a plain <a href> — the browser would send that request without the
   JWT and get a 401 back as a downloaded file. Everything goes through
   axios instead, and the blob is handed to the browser here.

   Server errors arrive as a JSON blob rather than a JSON body, because the
   request asked for one; readBlobError unwraps it so the caller can show
   the real message instead of "download failed". */

const readBlobError = async (error) => {
  const data = error.response?.data;
  if (data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (parsed?.message) return parsed.message;
    } catch { /* not JSON — fall through to the generic message */ }
  }
  return error.response?.statusText || error.message || "Download failed";
};

/**
 * Fetch `url` as a file and save it under `filename`.
 * Resolves on success; rejects with a readable Error message.
 */
export const downloadFile = async (url, filename, params = {}) => {
  try {
    const { data, headers } = await api.get(url, { params, responseType: "blob" });

    // Prefer the server's own filename when it sent one
    const disposition = headers?.["content-disposition"] || "";
    const match = /filename="?([^"';]+)"?/i.exec(disposition);
    const name = match?.[1] || filename;

    const href = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = href;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoked on the next tick — Safari cancels the download if it goes early
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch (error) {
    throw new Error(await readBlobError(error), { cause: error });
  }
};

/** Open a PDF in a new tab instead of saving it. */
export const openFile = async (url, params = {}) => {
  try {
    const { data } = await api.get(url, { params, responseType: "blob" });
    const href = URL.createObjectURL(data);
    const win = window.open(href, "_blank", "noopener");
    if (!win) throw new Error("Pop-up blocked — allow pop-ups to preview the bill.");
    setTimeout(() => URL.revokeObjectURL(href), 60_000);
  } catch (error) {
    // A blocked pop-up is our own Error and already reads well; only a
    // server response needs unwrapping from its blob.
    if (!error.response) throw error;
    throw new Error(await readBlobError(error), { cause: error });
  }
};
