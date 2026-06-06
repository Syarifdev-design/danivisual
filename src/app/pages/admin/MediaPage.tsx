import { useState, useRef } from "react";
import {
  Upload, Trash2, X, Image, FolderOpen, Grid, List, Search,
  Check, FileText, HardDrive
} from "lucide-react";
import { useAdmin, MediaFile } from "../../contexts/AdminContext";

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

export default function MediaPage() {
  const { mediaFiles, addMediaFile, deleteMediaFile } = useAdmin();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredFiles = mediaFiles.filter(f =>
    f.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSize = mediaFiles.reduce((sum, f) => sum + f.size, 0);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    setUploading(true);
    try {
      const newFiles = await Promise.all(
        Array.from(files).map((file) => new Promise<Omit<MediaFile, "id" | "uploadedAt">>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = event => resolve({
            filename: file.name,
            url: event.target?.result as string,
            type: file.type.startsWith("image/") ? "image" : "video",
            size: file.size,
          });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        }))
      );

      newFiles.forEach(file => addMediaFile(file));
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleSelectFile = (id: string) => {
    setSelectedFiles(prev =>
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (confirm(`Delete ${selectedFiles.length} files?`)) {
      selectedFiles.forEach(id => deleteMediaFile(id));
      setSelectedFiles([]);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this file?")) {
      deleteMediaFile(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Content Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Media Library</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Upload dan kelola file media untuk album dan konten website.
            </p>
          </div>
        </div>
      </div>

      {/* Stats & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <HardDrive size={16} className="text-foreground-secondary" />
            <span className="text-sm">{mediaFiles.length} files</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm">{formatFileSize(totalSize)} used</span>
          </div>
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-semibold text-premium-beige">
                {selectedFiles.length} selected
              </span>
              <button
                onClick={handleDeleteSelected}
                className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
              >
                Delete Selected
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-secondary" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`${inputClassName} pl-9 w-48`}
            />
          </div>
          <button onClick={() => setViewMode("grid")} className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-premium-beige/10 text-premium-beige" : "text-foreground-secondary"}`}>
            <Grid size={18} />
          </button>
          <button onClick={() => setViewMode("list")} className={`rounded-lg p-2 ${viewMode === "list" ? "bg-premium-beige/10 text-premium-beige" : "text-foreground-secondary"}`}>
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragOver
            ? "border-premium-beige bg-premium-beige/5"
            : "border-border-line hover:border-premium-beige/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center">
          <div className={`rounded-full bg-premium-beige/10 p-4 ${uploading ? "animate-pulse" : ""}`}>
            <Upload size={32} className="text-premium-beige" />
          </div>
          <h3 className="mt-4 font-semibold">Drop files here or click to upload</h3>
          <p className="mt-2 text-sm text-foreground-secondary">Supports: JPG, PNG, GIF, MP4, MOV</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-dark-premium px-6 py-3 text-sm font-semibold text-white transition hover:bg-dark-premium/90"
          >
            <Upload size={16} />
            Browse Files
          </button>
        </div>
      </div>

      {/* Files Grid/List */}
      {filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-border-line bg-white p-12 text-center">
          <FolderOpen size={48} className="mx-auto text-border-line" />
          <p className="mt-4 text-sm text-foreground-secondary">No media files yet</p>
          <p className="text-xs text-foreground-secondary">Upload files using the area above</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`group relative rounded-xl border bg-white shadow-[0_10px_26px_rgba(38,28,16,0.035)] overflow-hidden ${
                selectedFiles.includes(file.id) ? "border-premium-beige ring-2 ring-premium-beige/20" : "border-border-line"
              }`}
            >
              <div
                className="aspect-square cursor-pointer"
                onClick={() => handleSelectFile(file.id)}
              >
                {file.type === "image" ? (
                  <img src={file.url} alt={file.filename} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center bg-premium-beige/5">
                    <FileText size={48} className="text-premium-beige" />
                  </div>
                )}
              </div>
              {selectedFiles.includes(file.id) && (
                <div className="absolute top-2 left-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-premium-beige text-white">
                    <Check size={14} />
                  </div>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => window.open(file.url, "_blank")}
                  className="rounded-full bg-white p-2 text-foreground hover:bg-premium-beige hover:text-white"
                >
                  <Image size={18} />
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="rounded-full bg-white p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="p-2">
                <p className="truncate text-xs font-medium">{file.filename}</p>
                <p className="text-xs text-foreground-secondary">{formatFileSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-premium-beige/5">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selectedFiles.length === filteredFiles.length} onChange={() => {
                    if (selectedFiles.length === filteredFiles.length) {
                      setSelectedFiles([]);
                    } else {
                      setSelectedFiles(filteredFiles.map(f => f.id));
                    }
                  }} className="h-4 w-4 rounded border-border-line" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Filename</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Size</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Uploaded</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line">
              {filteredFiles.map((file) => (
                <tr key={file.id} className={`hover:bg-premium-beige/5 ${selectedFiles.includes(file.id) ? "bg-premium-beige/5" : ""}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedFiles.includes(file.id)} onChange={() => handleSelectFile(file.id)} className="h-4 w-4 rounded border-border-line" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-10 w-10 rounded-lg bg-premium-beige/5 overflow-hidden">
                      {file.type === "image" ? (
                        <img src={file.url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FileText size={16} className="text-premium-beige" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium">{file.filename}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium uppercase">{file.type}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{formatFileSize(file.size)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{formatDate(file.uploadedAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => window.open(file.url, "_blank")} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"><Image size={16} /></button>
                      <button onClick={() => handleDelete(file.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
