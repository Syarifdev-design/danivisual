import { Edit2, ExternalLink, Plus, Trash2, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import AdminDataTable, { type AdminDataTableColumn } from "../components/AdminDataTable";
import AdminFormSection from "../components/AdminFormSection";
import AdminImageUploader from "../components/AdminImageUploader";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPreviewCard from "../components/AdminPreviewCard";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { type Album, useAdmin } from "../../contexts/AdminContext";

const portfolioCategories = ["Wedding", "Prewedding", "Event", "Studio", "Peristiwa Lainnya"] as const;

// Category tabs for filtering with normalized values
const categoryTabs = [
  { label: "All Albums", value: "all" },
  { label: "Wedding", value: "wedding" },
  { label: "Prewedding", value: "prewedding" },
  { label: "Event", value: "event" },
  { label: "Studio", value: "studio" },
  { label: "Peristiwa Lainnya", value: "peristiwa_lainnya" },
];

// Normalize portfolio category for comparison
function normalizePortfolioCategory(value: string | undefined | null): string {
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
function categoryMatchesFilter(albumCategory: string | undefined | null, filterValue: string): boolean {
  if (filterValue === "all") return true;
  return normalizePortfolioCategory(albumCategory) === normalizePortfolioCategory(filterValue);
}

// Get label for category filter value
function getCategoryLabel(filterValue: string): string {
  const tab = categoryTabs.find(t => t.value === filterValue);
  return tab?.label || filterValue;
}

const emptyForm = {
  title: "",
  slug: "",
  category: "Wedding",
  coupleName: "",
  location: "",
  eventDate: "",
  story: "",
  coverImage: "",
  galleryImages: [] as string[],
  isFeatured: false,
  isPublished: true,
};

type PortfolioForm = typeof emptyForm;

const inputClass = "min-h-11 w-full border border-border-line bg-white px-3 text-sm outline-none transition focus:border-premium-beige";
const textareaClass = "min-h-36 w-full resize-y border border-border-line bg-white px-3 py-3 text-sm leading-relaxed outline-none transition focus:border-premium-beige";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const value = event.target?.result;
      typeof value === "string" ? resolve(value) : reject(new Error("Invalid file result"));
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

function toForm(album: Album): PortfolioForm {
  return {
    title: album.title || album.name || "",
    slug: album.slug || album.id,
    category: album.category || "Wedding",
    coupleName: album.coupleName || album.name || "",
    location: album.location || "",
    eventDate: album.eventDate || album.date || "",
    story: album.story || "",
    coverImage: album.coverImage || "",
    galleryImages: album.galleryImages?.length ? album.galleryImages : album.images || [],
    isFeatured: Boolean(album.isFeatured),
    isPublished: album.isPublished,
  };
}

export default function PortfolioContentPage() {
  const { albums, addAlbum, updateAlbum, deleteAlbum } = useAdmin();
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PortfolioForm>(emptyForm);

  const adminAlbums = useMemo(
    () => albums.filter((album) => !/^album-[12]$/.test(album.id)).sort((a, b) => a.sortOrder - b.sortOrder),
    [albums],
  );

  const filteredAlbums = useMemo(
    () => adminAlbums.filter((album) => categoryFilter === "all" || categoryMatchesFilter(album.category, categoryFilter)),
    [adminAlbums, categoryFilter],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm({ ...emptyForm, category: categoryFilter === "all" ? "Wedding" : categoryFilter });
  };

  const setFormValue = <K extends keyof PortfolioForm>(key: K, value: PortfolioForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (value: string) => {
    setForm((current) => ({
      ...current,
      title: value,
      slug: current.slug && editingId ? current.slug : slugify(value),
      coupleName: current.coupleName || value,
    }));
  };

  const handleGalleryUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
    setForm((current) => ({ ...current, galleryImages: [...current.galleryImages, ...dataUrls] }));
    event.target.value = "";
  };

  const removeGalleryImage = (index: number) => {
    setForm((current) => ({
      ...current,
      galleryImages: current.galleryImages.filter((_, imageIndex) => imageIndex !== index),
    }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const title = form.title.trim();
    const slug = slugify(form.slug || title);
    if (!title || !slug) return;

    const payload = {
      title,
      slug,
      name: title,
      coupleName: form.coupleName.trim() || title,
      category: form.category,
      location: form.location.trim(),
      eventDate: form.eventDate,
      date: form.eventDate,
      story: form.story.trim(),
      coverImage: form.coverImage,
      galleryImages: form.galleryImages,
      images: form.galleryImages,
      isFeatured: form.isFeatured,
      isPublished: form.isPublished,
    };

    if (editingId) {
      updateAlbum(editingId, payload);
    } else {
      addAlbum(payload);
    }

    resetForm();
  };

  const startEdit = (album: Album) => {
    setEditingId(album.id);
    setForm(toForm(album));
  };

  const columns: AdminDataTableColumn<Album>[] = [
    {
      key: "cover",
      header: "Cover",
      render: (album) => {
        const image = album.coverImage || album.galleryImages?.[0] || album.images?.[0];
        return image ? (
          <img src={image} alt={album.title || album.name} className="h-16 w-12 object-cover" />
        ) : (
          <div className="h-16 w-12 border border-border-line bg-background-soft" />
        );
      },
    },
    {
      key: "title",
      header: "Album",
      render: (album) => (
        <div>
          <p className="font-medium text-foreground">{album.title || album.name}</p>
          <p className="mt-1 text-xs text-foreground-secondary">{album.slug || album.id}</p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (album) => album.category,
    },
    {
      key: "location",
      header: "Location",
      render: (album) => album.location || "-",
    },
    {
      key: "status",
      header: "Status",
      render: (album) => (
        <div className="flex flex-wrap gap-2">
          <AdminStatusBadge tone={album.isPublished ? "success" : "neutral"}>
            {album.isPublished ? "Published" : "Draft"}
          </AdminStatusBadge>
          {album.isFeatured && <AdminStatusBadge tone="gold">Featured</AdminStatusBadge>}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (album) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startEdit(album)}
            className="inline-flex min-h-9 items-center gap-2 border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
          >
            <Edit2 size={13} /> Edit
          </button>
          <button
            type="button"
            onClick={() => {
              deleteAlbum(album.id);
              if (editingId === album.id) resetForm();
            }}
            className="inline-flex min-h-9 items-center gap-2 border border-destructive/20 bg-white px-3 text-xs text-destructive transition hover:bg-destructive/10"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website Content"
        title="Portfolio Albums"
        description="Create and curate portfolio albums for the public Portfolio page."
        actions={
          <>
            <a href="/portfolio" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
              <ExternalLink size={15} /> Preview Portfolio
            </a>
            <button type="button" onClick={resetForm} className="inline-flex min-h-11 items-center gap-2 bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90">
              <Plus size={15} /> New Album
            </button>
          </>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border-line pb-3">
        {categoryTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCategoryFilter(tab.value)}
            className={`min-h-11 shrink-0 border px-5 text-sm transition ${
              categoryFilter === tab.value
                ? "border-premium-beige bg-premium-beige/10 text-foreground"
                : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid min-w-0 gap-8">
          <AdminDataTable
            columns={columns}
            rows={filteredAlbums}
            emptyText={categoryFilter === "all"
              ? "No portfolio album yet. Click 'New Album' to create your first portfolio."
              : `No album found for category "${getCategoryLabel(categoryFilter)}".`}
          />
        </div>

        <aside className="grid min-w-0 gap-5 content-start">
          <AdminFormSection
            eyebrow={editingId ? "Edit Album" : "New Album"}
            title={editingId ? "Update Portfolio" : "Create Portfolio"}
            description="Published albums with a cover or gallery image will replace the default public portfolio data."
          >
            <form onSubmit={handleSubmit} className="grid gap-4">
              <Field label="Title" value={form.title} onChange={handleTitleChange} />
              <Field label="Slug" value={form.slug} onChange={(value) => setFormValue("slug", slugify(value))} />
              <div>
                <label className={labelClass}>Category</label>
                <select value={form.category} onChange={(event) => setFormValue("category", event.target.value)} className={inputClass}>
                  {portfolioCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <Field label="Couple Name" value={form.coupleName} onChange={(value) => setFormValue("coupleName", value)} />
              <Field label="Location" value={form.location} onChange={(value) => setFormValue("location", value)} />
              <Field label="Event Date" type="date" value={form.eventDate} onChange={(value) => setFormValue("eventDate", value)} />
              <TextArea label="Story" value={form.story} onChange={(value) => setFormValue("story", value)} />

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex min-h-11 items-center gap-3 border border-border-line bg-background-soft px-4 text-sm text-foreground">
                  <input type="checkbox" checked={form.isFeatured} onChange={(event) => setFormValue("isFeatured", event.target.checked)} className="accent-black" />
                  Featured
                </label>
                <label className="flex min-h-11 items-center gap-3 border border-border-line bg-background-soft px-4 text-sm text-foreground">
                  <input type="checkbox" checked={form.isPublished} onChange={(event) => setFormValue("isPublished", event.target.checked)} className="accent-black" />
                  Published
                </label>
              </div>

              <AdminImageUploader
                label="Cover Image"
                imageUrl={form.coverImage}
                onChange={(value) => setFormValue("coverImage", value)}
              />

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className={labelClass}>Gallery Images</label>
                  <button type="button" onClick={() => galleryInputRef.current?.click()} className="inline-flex min-h-9 items-center gap-2 border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
                    <Upload size={14} /> Upload Multiple
                  </button>
                  <input ref={galleryInputRef} type="file" accept="image/*" multiple className="sr-only" onChange={handleGalleryUpload} />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {form.galleryImages.map((image, index) => (
                    <div key={`${image}-${index}`} className="group relative aspect-[4/5] overflow-hidden border border-border-line bg-background-soft">
                      <img src={image} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover" />
                      <button type="button" onClick={() => removeGalleryImage(index)} className="absolute right-2 top-2 hidden bg-white px-2 py-1 text-xs text-destructive shadow group-hover:block">
                        Remove
                      </button>
                    </div>
                  ))}
                  {form.galleryImages.length === 0 && (
                    <div className="col-span-3 border border-dashed border-premium-beige/50 bg-background-soft p-5 text-center text-xs text-foreground-secondary">
                      No gallery image uploaded yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className="inline-flex min-h-11 items-center bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90">
                  {editingId ? "Save Album" : "Add Album"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="min-h-11 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </AdminFormSection>

          <AdminPreviewCard eyebrow={form.category} title={form.coupleName || form.title || "Portfolio preview"} imageUrl={form.coverImage || form.galleryImages[0]}>
            <p>{form.location || "Location"} {form.eventDate ? `- ${form.eventDate}` : ""}</p>
            <p className="mt-2">{form.story || "Write a story to preview album narrative."}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <AdminStatusBadge tone={form.isPublished ? "success" : "neutral"}>{form.isPublished ? "Published" : "Draft"}</AdminStatusBadge>
              {form.isFeatured && <AdminStatusBadge tone="gold">Featured</AdminStatusBadge>}
            </div>
          </AdminPreviewCard>
        </aside>
      </section>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input type={type} value={value || ""} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} className={textareaClass} />
    </div>
  );
}
