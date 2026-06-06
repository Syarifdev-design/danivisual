import { useState } from "react";
import {
  Plus, Edit2, Trash2, X, Image, Eye, GripVertical,
  Upload, Grid, List
} from "lucide-react";
import { useAdmin, Album } from "../../contexts/AdminContext";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

// Form category options (for dropdown)
const formCategories = ["Wedding", "Prewedding", "Engagement", "Event", "Studio", "Portrait", "Lainnya"];

// Category tabs for filtering
const categoryTabs = [
  { label: "All Albums", value: "all" },
  { label: "Wedding", value: "wedding" },
  { label: "Prewedding", value: "prewedding" },
  { label: "Event", value: "event" },
  { label: "Studio", value: "studio" },
  { label: "Peristiwa Lainnya", value: "peristiwa_lainnya" },
];

// Normalize category for comparison
// Handles: "Wedding", "wedding", "peristiwa_lainnya", "peristiwa lainnya", "lainnya"
function normalizeCategory(value: string | undefined | null): string {
  if (!value) return "";

  const normalized = String(value)
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, "_")
    .replace(/-/g, "_");

  // Map variations to standard values
  if (normalized === "wedding") return "wedding";
  if (normalized === "prewedding" || normalized.startsWith("prewed")) return "prewedding";
  if (normalized === "event") return "event";
  if (normalized === "studio") return "studio";
  if (normalized.includes("lain") || normalized.includes("other") || normalized.includes("peristi")) return "peristiwa_lainnya";

  return normalized;
}

// Check if album category matches filter
function categoryMatches(albumCategory: string | undefined | null, filterValue: string): boolean {
  if (filterValue === "all") return true;

  const normalizedAlbum = normalizeCategory(albumCategory);
  const normalizedFilter = normalizeCategory(filterValue);

  return normalizedAlbum === normalizedFilter;
}

export default function PortfolioPage() {
  const {
    albums, albumsLoading, albumsError, uploadProgress,
    addAlbum, updateAlbum, deleteAlbum, refreshAlbums,
    uploadAlbumImage, deleteAlbumImage,
  } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Filter albums by category
  const filteredAlbums = selectedCategory === "all"
    ? albums
    : albums.filter(album => categoryMatches(album.category, selectedCategory));

  // Debug logging (remove in production)
  console.log('[AdminPortfolio] selectedCategory:', selectedCategory);
  console.log('[AdminPortfolio] total albums:', albums.length);
  console.log('[AdminPortfolio] filtered count:', filteredAlbums.length);
  console.log('[AdminPortfolio] categories:', albums.map(a => a.category));

  const [formData, setFormData] = useState({
    name: "",
    category: formCategories[0],
    location: "",
    date: new Date().toISOString().split("T")[0],
    coverImage: "",
    images: [] as string[],
    story: "",
    isPublished: true,
  });

  const handleOpenModal = (album?: Album) => {
    if (album) {
      setEditingAlbum(album);
      setFormData({
        name: album.name,
        category: album.category,
        location: album.location || "",
        date: album.date,
        coverImage: album.coverImage,
        images: album.images,
        story: album.story || "",
        isPublished: album.isPublished,
      });
    } else {
      setEditingAlbum(null);
      setFormData({
        name: "",
        category: formCategories[0],
        location: "",
        date: new Date().toISOString().split("T")[0],
        coverImage: "",
        images: [],
        story: "",
        isPublished: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAlbum) {
      updateAlbum(editingAlbum.id, formData);
    } else {
      addAlbum(formData);
    }
    setShowModal(false);
    setEditingAlbum(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus album ini?")) {
      deleteAlbum(id);
      setSelectedAlbum(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = await Promise.all(
      Array.from(files).map((file) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => resolve(event.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }))
    );

    setFormData(prev => ({
      ...prev,
      coverImage: prev.coverImage || newImages[0] || "",
      images: [...prev.images, ...newImages],
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Content Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Portfolio</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola album foto portfolio, atur urutan, dan visibility.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {albumsLoading && (
              <span className="text-xs text-foreground-secondary">Loading...</span>
            )}
            {albumsError && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Error</span>
            )}
            <button
              onClick={refreshAlbums}
              disabled={albumsLoading}
              className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:bg-premium-beige/10 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
            >
              <Plus size={14} />
              Add Album
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {categoryTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setSelectedCategory(tab.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              selectedCategory === tab.value
                ? "bg-dark-premium text-white"
                : "border border-border-line bg-white text-foreground-secondary hover:border-premium-beige hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* View Toggle & Stats */}
      <div className="flex items-center justify-between rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground-secondary">{filteredAlbums.length} albums</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {filteredAlbums.filter(a => a.isPublished).length} published
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-premium-beige/10 text-premium-beige" : "text-foreground-secondary"}`}
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-2 ${viewMode === "list" ? "bg-premium-beige/10 text-premium-beige" : "text-foreground-secondary"}`}
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Albums Grid/List */}
      {filteredAlbums.length === 0 ? (
        <div className="rounded-2xl border border-border-line bg-white p-12 text-center">
          <Image size={48} className="mx-auto text-border-line" />
          <p className="mt-4 text-sm text-foreground-secondary">
            {selectedCategory === "all"
              ? "Belum ada album"
              : `Belum ada album untuk kategori "${categoryTabs.find(t => t.value === selectedCategory)?.label || selectedCategory}"`
            }
          </p>
          <button onClick={() => handleOpenModal()} className="mt-4 text-sm font-semibold text-premium-beige hover:underline">
            Tambah album pertama
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...filteredAlbums].sort((a, b) => a.sortOrder - b.sortOrder).map((album) => (
            <div
              key={album.id}
              className="group relative rounded-2xl border border-border-line bg-white shadow-[0_10px_26px_rgba(38,28,16,0.035)] overflow-hidden"
            >
              <div className="aspect-[4/3] bg-premium-beige/5 flex items-center justify-center">
                {album.coverImage ? (
                  <img src={album.coverImage} alt={album.name} className="h-full w-full object-cover" />
                ) : (
                  <Image size={48} className="text-border-line" />
                )}
              </div>
              {!album.isPublished && (
                <div className="absolute top-2 right-2">
                  <span className="rounded-full bg-gray-500 px-2 py-1 text-xs font-semibold text-white">Hidden</span>
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold">{album.name}</h3>
                <p className="text-xs text-foreground-secondary">{album.category}</p>
                <p className="text-xs text-foreground-secondary">{album.images.length} photos</p>
              </div>
              <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition group-hover:opacity-100">
                <button
                  onClick={() => setSelectedAlbum(album)}
                  className="rounded-full bg-white p-2 text-foreground hover:bg-premium-beige"
                >
                  <Eye size={18} />
                </button>
                <button
                  onClick={() => handleOpenModal(album)}
                  className="rounded-full bg-white p-2 text-foreground hover:bg-premium-beige"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(album.id)}
                  className="rounded-full bg-white p-2 text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-premium-beige/5">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Album</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Category</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Photos</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.12em] text-foreground-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-line">
              {[...filteredAlbums].sort((a, b) => a.sortOrder - b.sortOrder).map((album) => (
                <tr key={album.id} className="hover:bg-premium-beige/5">
                  <td className="px-4 py-3">
                    <GripVertical size={16} className="text-foreground-secondary cursor-move" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-premium-beige/10 flex items-center justify-center">
                        {album.coverImage ? (
                          <img src={album.coverImage} alt="" className="h-full w-full rounded-lg object-cover" />
                        ) : (
                          <Image size={16} className="text-premium-beige" />
                        )}
                      </div>
                      <span className="font-semibold">{album.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{album.category}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(album.date)}</td>
                  <td className="px-4 py-3 text-sm">{album.images.length}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateAlbum(album.id, { isPublished: !album.isPublished })}>
                      {album.isPublished ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Published</span>
                      ) : (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">Hidden</span>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setSelectedAlbum(album)} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"><Eye size={16} /></button>
                      <button onClick={() => handleOpenModal(album)} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(album.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Album Preview Modal */}
      {selectedAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="flex items-center justify-between border-b border-border-line p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Album Preview</p>
                <h3 className="text-xl font-semibold">{selectedAlbum.name}</h3>
              </div>
              <button onClick={() => setSelectedAlbum(null)} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              <div className="mb-4 flex items-center gap-4">
                <span className="rounded-full bg-premium-beige/10 px-3 py-1 text-xs font-semibold text-premium-beige">{selectedAlbum.category}</span>
                <span className="text-sm text-foreground-secondary">{selectedAlbum.images.length} photos</span>
                <span className="text-sm text-foreground-secondary">{formatDate(selectedAlbum.date)}</span>
              </div>
              {selectedAlbum.images.length === 0 ? (
                <div className="py-12 text-center">
                  <Image size={48} className="mx-auto text-border-line" />
                  <p className="mt-4 text-sm text-foreground-secondary">No images in this album</p>
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {selectedAlbum.images.map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg bg-premium-beige/5 overflow-hidden">
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)] max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">{editingAlbum ? "Edit" : "Add"} Album</p>
                <h3 className="mt-1 text-xl font-semibold">{editingAlbum ? "Edit Album" : "New Album"}</h3>
              </div>
              <button onClick={() => { setShowModal(false); setEditingAlbum(null); }} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Name *</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClassName} placeholder="Album name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Location</label>
                <input type="text" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className={inputClassName} placeholder="Four Seasons Jakarta" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold">Category *</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => {
                      const displayValue = e.target.value;
                      let dataValue = displayValue;
                      if (displayValue === "Prewedding") dataValue = "prewedding";
                      else if (displayValue === "Wedding") dataValue = "wedding";
                      else if (displayValue === "Event") dataValue = "event";
                      else if (displayValue === "Studio" || displayValue === "Portrait") dataValue = "studio";
                      else if (displayValue === "Lainnya" || displayValue === "Engagement") dataValue = "peristiwa_lainnya";
                      setFormData({ ...formData, category: dataValue });
                    }}
                    className={inputClassName}
                  >
                    {formCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold">Date</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={inputClassName} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Cover Image URL</label>
                <input type="text" value={formData.coverImage} onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })} className={inputClassName} placeholder="https://..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Story</label>
                <textarea value={formData.story} onChange={(e) => setFormData({ ...formData, story: e.target.value })} className={inputClassName} rows={4} placeholder="Cerita singkat album ini..." />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Images</label>
                <div className="space-y-2">
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {formData.images.map((img, i) => (
                        <div key={i} className="relative aspect-square rounded-lg bg-premium-beige/5 overflow-hidden">
                          <img src={img} alt="" className="h-full w-full object-cover" />
                          <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 rounded-full bg-red-500 p-1 text-white">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border-line p-4 text-sm text-foreground-secondary hover:border-premium-beige hover:text-premium-beige">
                    <Upload size={16} />
                    Add Images
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="h-4 w-4 rounded border-border-line" />
                <span className="text-sm">Publish album (visible on website)</span>
              </label>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingAlbum(null); }} className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold">Cancel</button>
                <button type="submit" className="rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white">{editingAlbum ? "Update" : "Create"} Album</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}