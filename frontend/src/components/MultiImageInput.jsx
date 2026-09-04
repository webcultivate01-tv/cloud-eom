import { useRef, useState } from "react";
import { Upload, ImageIcon, X, Link2, Plus, Star } from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/api";
import { MAX_UPLOAD_MB, validateImageFile } from "../utils/uploadLimits";

// `category` and `product` are only meaningful for folder="products": they put
// every image of a product in its own folder on the server, under the category
// it belongs to (uploads/products/<category>/<product>/). Files uploaded before
// the name or category is filled in land in a holding folder and are moved into
// place by the server when the product is saved.
export default function MultiImageInput({
  value = [],
  onChange,
  max = 10,
  folder = "misc",
  category = "",
  product = "",
}) {
  const [uploading, setUploading]   = useState(false);
  const [mode, setMode]             = useState("upload");
  const [urlInput, setUrlInput]     = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const fileRef                     = useRef();

  const remaining = max - value.length;

  const uploadUrl = `/upload?folder=${encodeURIComponent(folder)}` +
    (category ? `&category=${encodeURIComponent(category)}` : "") +
    (product ? `&product=${encodeURIComponent(product)}` : "");

  const addUrls = (urls) => {
    const next = [...value, ...urls].slice(0, max);
    onChange(next);
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // Anything the server would reject is reported now, by name, rather than
    // after the upload has already been spent on it
    const rejected = files.map((f) => validateImageFile(f)).filter(Boolean);
    const imageFiles = files.filter((f) => !validateImageFile(f));
    rejected.forEach((problem) => toast.error(problem));
    if (!imageFiles.length) {
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    if (imageFiles.length > remaining) {
      toast.error(`Only ${remaining} more image${remaining === 1 ? "" : "s"} allowed (max ${max})`);
    }

    const toUpload = imageFiles.slice(0, remaining);
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (const file of toUpload) {
        const fd = new FormData();
        fd.append("image", file);
        const { data } = await api.post(uploadUrl, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (data.imageUrl) uploadedUrls.push(data.imageUrl);
      }
      if (uploadedUrls.length) {
        addUrls(uploadedUrls);
        toast.success(`${uploadedUrls.length} image${uploadedUrls.length === 1 ? "" : "s"} uploaded`);
      }
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      setShowPicker(false);
    }
  };

  const handleUrlApply = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    addUrls([url]);
    setUrlInput("");
    toast.success("Image URL added");
    setShowPicker(false);
  };

  const removeAt = (idx) => onChange(value.filter((_, i) => i !== idx));

  const makeMain = (idx) => {
    if (idx === 0) return;
    const next = [...value];
    const [moved] = next.splice(idx, 1);
    next.unshift(moved);
    onChange(next);
  };

  return (
    <div>
      {/* Thumbnails */}
      <div className="flex flex-wrap gap-2 mb-3">
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className="relative group">
            <img
              src={url}
              alt=""
              className="w-24 h-24 object-cover rounded-xl border border-slate-200"
              onError={(e) => { e.currentTarget.classList.add("opacity-30"); }}
            />
            {i === 0 && (
              <span className="absolute bottom-0 inset-x-0 bg-brand-600/90 text-white text-[10px] font-bold text-center py-0.5 rounded-b-xl">
                Main
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-brand-500 hover:bg-brand-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
              title="Remove"
            >
              <X size={12} />
            </button>
            {i > 0 && (
              <button
                type="button"
                onClick={() => makeMain(i)}
                className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-amber-500 hover:bg-amber-600 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                title="Make this the main image"
              >
                <Star size={11} />
              </button>
            )}
          </div>
        ))}

        {/* Add button — only shows if room remains */}
        {value.length < max && (
          <button
            type="button"
            onClick={() => setShowPicker((v) => !v)}
            className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-xs font-semibold transition-all ${
              showPicker
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-300 hover:border-brand-400 hover:bg-brand-50/30 text-slate-500 hover:text-brand-600"
            }`}
          >
            <Plus size={20} strokeWidth={1.8} />
            <span className="mt-1">Add Image</span>
          </button>
        )}
      </div>

      {/* Picker (upload / URL toggle) */}
      {showPicker && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-md">
          <div className="flex gap-1 mb-3 bg-white p-0.5 rounded-lg w-fit">
            <button
              type="button"
              onClick={() => setMode("upload")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                mode === "upload"
                  ? "bg-brand-100 text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Upload size={11} /> Upload
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                mode === "url"
                  ? "bg-brand-100 text-brand-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Link2 size={11} /> Paste URL
            </button>
          </div>

          {mode === "upload" && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all w-fit ${
                  uploading
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-wait"
                    : "bg-brand-50 border-brand-200 text-brand-700 hover:bg-brand-100"
                }`}
              >
                {uploading ? (
                  <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Uploading…</>
                ) : (
                  <><Upload size={12} /> Choose image(s) from device</>
                )}
              </button>
              <p className="text-[11px] text-slate-400 mt-2">
                You can pick multiple files. {remaining} slot{remaining === 1 ? "" : "s"} remaining.
                <br />
                Images are stored at full quality for printing — max {MAX_UPLOAD_MB} MB each.
              </p>
            </>
          )}

          {mode === "url" && (
            <div className="flex gap-1.5">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleUrlApply(); } }}
                placeholder="https://example.com/image.jpg"
                className="admin-input !py-1.5 !text-xs flex-1"
              />
              <button
                type="button"
                onClick={handleUrlApply}
                disabled={!urlInput.trim()}
                className="admin-btn admin-btn-primary !py-1.5 !px-3 !text-xs disabled:opacity-50"
              >
                Add URL
              </button>
            </div>
          )}
        </div>
      )}

      {value.length === 0 && !showPicker && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ImageIcon size={14} /> No images yet — click <strong>Add Image</strong> to upload or paste a URL.
        </div>
      )}
    </div>
  );
}
