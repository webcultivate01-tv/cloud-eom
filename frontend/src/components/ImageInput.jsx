import { useRef, useState } from "react";
import { Upload, ImageIcon, X, Link2 } from "lucide-react";
import { toast } from "react-toastify";
import api from "../utils/api";

export default function ImageInput({ value, onChange, previewSize = "square", folder = "misc" }) {
  const [uploading, setUploading] = useState(false);
  const [mode, setMode]           = useState("upload");
  const [urlInput, setUrlInput]   = useState("");
  const fileRef                   = useRef();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post(`/upload?folder=${folder}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.imageUrl);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleUrlApply = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    onChange(url);
    setUrlInput("");
    toast.success("Image URL applied");
  };

  const previewCls = previewSize === "wide" ? "w-40 h-28" : "w-32 h-32";

  return (
    <div>
      {/* Preview */}
      <div className={`${previewCls} rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden relative group mb-2`}>
        {value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.src = ""; toast.error("Image URL could not be loaded"); }}
            />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              title="Remove image"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center text-slate-400 text-center px-2">
            <ImageIcon size={28} strokeWidth={1.5} />
            <p className="text-[10px] mt-1.5 font-medium">No image</p>
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 mb-2 bg-slate-100 p-0.5 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold transition-all ${
            mode === "upload"
              ? "bg-white text-indigo-700 shadow-sm"
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
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Link2 size={11} /> Paste URL
        </button>
      </div>

      {/* Upload mode */}
      {mode === "upload" && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer border-2 transition-all w-fit ${
              uploading
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-wait"
                : "bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            {uploading ? (
              <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> Uploading…</>
            ) : (
              <><Upload size={12} /> {value ? "Change Image" : "Choose Image"}</>
            )}
          </button>
        </>
      )}

      {/* URL mode */}
      {mode === "url" && (
        <div className="flex gap-1.5 max-w-md">
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
            Use URL
          </button>
        </div>
      )}
    </div>
  );
}
