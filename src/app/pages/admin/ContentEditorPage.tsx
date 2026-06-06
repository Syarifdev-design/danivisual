import { useState, useRef, useEffect, useMemo } from "react";
import {
  ChevronDown, ChevronUp, Image as ImageIcon, Eye, Check, Upload,
  Trash2, ImagePlus, Menu, Download, FileUp, Rocket, Archive
} from "lucide-react";
import { useContent } from "../../contexts/ContentContext";
import { useAdmin, type MediaFile } from "../../contexts/AdminContext";

const sectionConfigs = [
  { id: "home", label: "Home", icon: "🏠" },
  { id: "navigation", label: "Nav", icon: "🌐" },
  { id: "portfolio", label: "Portfolio", icon: "🖼️" },
  { id: "services_page", label: "Services", icon: "📄" },
  { id: "packages", label: "Packages", icon: "📦" },
  { id: "faq", label: "FAQ", icon: "❓" },
  { id: "about", label: "About", icon: "📝" },
  { id: "contact", label: "Contact", icon: "📞" },
  { id: "auth", label: "Auth", icon: "🔐" },
  { id: "footer", label: "Footer", icon: "⚙️" },
];

const previewPaths: Record<string, string> = {
  home: "/",
  portfolio: "/portfolio",
  services_page: "/services",
  packages: "/packages",
  faq: "/faq",
  about: "/about",
  contact: "/contact",
  auth: "/login",
};

// Image size guidelines by field pattern
const imageSizeGuide: Record<string, { size: string; ratio: string; note: string }> = {
  // Hero slides - Fullscreen banner
  home_slide: { size: "1920×1080", ratio: "16:9", note: "Hero slider (fullscreen)" },
  // Featured stories - Portfolio images
  home_story: { size: "1200×750", ratio: "16:10", note: "Story/portfolio image" },
  // Service images
  home_svc: { size: "800×600", ratio: "4:3", note: "Service card thumbnail" },
  // CTA background
  home_cta: { size: "1920×800", ratio: "21:9", note: "CTA banner (wide)" },
  // About intro/cover
  about_image: { size: "1400×800", ratio: "16:9", note: "About page cover" },
  about_testimonial: { size: "600×450", ratio: "4:3", note: "Testimonial photo" },
  // Portfolio/Packages/FAQ intro
  portfolio_image: { size: "1400×800", ratio: "16:9", note: "Page intro cover" },
  packages_image: { size: "1400×800", ratio: "16:9", note: "Page intro cover" },
  faq_image: { size: "1400×800", ratio: "16:9", note: "Page intro cover" },
  services_page_image: { size: "1400×800", ratio: "16:9", note: "Page intro cover" },
  // Services page service images
  services_wedding_image: { size: "900×600", ratio: "3:2", note: "Service gallery" },
  services_prewedding_image: { size: "900×600", ratio: "3:2", note: "Service gallery" },
  services_event_image: { size: "900×600", ratio: "3:2", note: "Service gallery" },
  services_studio_image: { size: "900×600", ratio: "3:2", note: "Service gallery" },
  services_lainnya_image: { size: "900×600", ratio: "3:2", note: "Service gallery" },
};

function getImageGuide(fieldId: string) {
  // Find matching pattern
  for (const [pattern, guide] of Object.entries(imageSizeGuide)) {
    if (fieldId.includes(pattern)) return guide;
  }
  // Default
  return { size: "1200×800", ratio: "3:2", note: "Gambar umum" };
}

function ImageWidget({ fieldId, label, imageUrl, fieldType, mediaFiles, onUpload, onDelete, onSelectMedia }: {
  fieldId: string; label: string; imageUrl: string;
  fieldType?: "image" | "video";
  mediaFiles: MediaFile[];
  onUpload: (id: string, file: File) => Promise<void>; onDelete: (id: string) => void;
  onSelectMedia: (id: string, mediaId: string) => void;
}) {
  const [drag, setDrag] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [url, setUrl] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const guide = getImageGuide(fieldId);

  const upload = (file: File) => {
    const expectedType = fieldType || "image";
    if (!file?.type?.startsWith(`${expectedType}/`)) return;
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
    onUpload(fieldId, file);
  };

  const uploadUrl = (imageUrl: string) => {
    // Create a fake File with the URL as the "name" so parent can detect it's a URL
    const fakeFile = new File([], imageUrl, { type: "image/url" });
    onUpload(fieldId, fakeFile);
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600 truncate">{label}</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowGuide(!showGuide)} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded hover:bg-gray-200" title="Size guide">
            📐
          </button>
          <button onClick={() => setShowLibrary(!showLibrary)} className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded hover:bg-amber-200" title="Media library">
            LIB
          </button>
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">IMG</span>
        </div>
      </div>

      {showLibrary && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-2">
          {mediaFiles.filter(file => file.type === (fieldType || "image")).length === 0 ? (
            <p className="text-[10px] text-amber-700">Media Library masih kosong.</p>
          ) : (
            <select
              value=""
              onChange={(event) => {
                if (!event.target.value) return;
                onSelectMedia(fieldId, event.target.value);
                setShowLibrary(false);
              }}
              className="w-full rounded border border-amber-200 bg-white px-2 py-1 text-[11px]"
            >
              <option value="">Pilih dari Media Library</option>
              {mediaFiles.filter(file => file.type === (fieldType || "image")).map(file => (
                <option key={file.id} value={file.id}>{file.filename}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Size Guide Tooltip */}
      {showGuide && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-[10px] text-blue-800">
          <div className="font-semibold mb-1">📐 Ukuran yang Disarankan:</div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            <span>Size:</span><span className="font-mono font-semibold">{guide.size}px</span>
            <span>Ratio:</span><span className="font-mono">{guide.ratio}</span>
          </div>
          <div className="mt-1 text-gray-600">{guide.note}</div>
        </div>
      )}
      {imageUrl ? (
        <div className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
          {(fieldType || "image") === "video" ? (
            <video src={imageUrl} className="w-full h-24 object-cover" muted playsInline />
          ) : (
            <img src={imageUrl} alt="" className="w-full h-24 object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
            <button onClick={() => inputRef.current?.click()} className="p-1.5 bg-white rounded shadow" title="Replace">
              <Upload size={12} />
            </button>
            <button onClick={() => onDelete(fieldId)} className="p-1.5 bg-red-500 rounded shadow" title="Delete">
              <Trash2 size={12} className="text-white" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]); }}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onClick={() => { if (!showUrl) inputRef.current?.click(); }}
          className={`h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition ${drag ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}`}>
          {showUrl ? (
            <div className="w-full px-2 space-y-1">
              <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Image URL"
                className="w-full px-2 py-1 text-xs border rounded" autoFocus />
              <div className="flex gap-1">
                <button onClick={(e) => { e.stopPropagation(); uploadUrl(url); setShowUrl(false); setUrl(""); }}
                  className="flex-1 text-xs bg-blue-600 text-white py-1 rounded">Add</button>
                <button onClick={(e) => { e.stopPropagation(); setShowUrl(false); setUrl(""); }}
                  className="flex-1 text-xs border py-1 rounded">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <ImagePlus size={16} className="text-gray-400" />
              <span className="text-[10px] text-gray-500 mt-1">Drop/Click</span>
            </>
          )}
        </div>
      )}
      <input ref={inputRef} type="file" accept={(fieldType || "image") === "video" ? "video/*" : "image/*"} onChange={(e) => upload(e.target.files?.[0])} className="hidden" />
      {!showUrl && !imageUrl && (
        <button onClick={() => setShowUrl(true)} className="text-[10px] text-gray-400 hover:text-gray-600 underline">
          Or paste URL
        </button>
      )}
    </div>
  );
}

function TextInput({ label, value, type, onChange }: {
  label: string; value: string; type?: string; onChange: (v: string) => void;
}) {
  const cls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition";
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {type === "textarea" ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className={cls + " resize-none"} />
      ) : (
        <input type={type === "url" ? "url" : "text"} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
      )}
    </div>
  );
}

export default function ContentEditorPage() {
  const {
    content,
    images,
    getImage,
    updateField,
    updateImage,
    deleteImage,
    uploadImage,
    updateMenuMeta,
    publishMenu,
    reorderSections,
    exportBackup,
    importBackup,
    resetContent,
    resetImages,
  } = useContent();
  const { mediaFiles } = useAdmin();
  const [page, setPage] = useState("home");
  const [openSections, setOpenSections] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const data = content.find(c => c.id === page);
  const currentSeo = data?.seo || { title: "", description: "" };
  const validationErrors = useMemo(() => {
    if (!data) return [];
    const errors: string[] = [];
    data.sections.forEach(section => {
      section.fields.forEach(field => {
        if ((field.type === "text" || field.type === "textarea" || !field.type) && field.label.toLowerCase().includes("title") && !field.value.trim()) {
          errors.push(`${section.title}: ${field.label} wajib diisi`);
        }
      });
    });
    if (!data.seo?.title?.trim()) errors.push("SEO title wajib diisi");
    if (!data.seo?.description?.trim()) errors.push("SEO description wajib diisi");
    if ((data.seo?.title?.length || 0) > 70) errors.push("SEO title disarankan maksimal 70 karakter");
    if ((data.seo?.description?.length || 0) > 170) errors.push("SEO description disarankan maksimal 170 karakter");
    return errors;
  }, [data]);

  useEffect(() => {
    if (data?.sections?.[0]) setOpenSections([data.sections[0].id]);
  }, [page]);

  const toggle = (id: string) => {
    setOpenSections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const set = (sectionId: string, fieldId: string, value: string) => {
    updateField(page, sectionId, fieldId, value);
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  const markSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1000);
  };

  const imgUpload = async (fieldId: string, file: File) => {
    if (file.name?.startsWith("http")) { updateImage(fieldId, file.name); return; }
    try { await uploadImage(fieldId, file); markSaved(); } catch {}
  };

  const handlePublish = () => {
    if (validationErrors.length > 0) {
      alert(`Perbaiki validasi sebelum publish:\n- ${validationErrors.join("\n- ")}`);
      return;
    }
    publishMenu(page);
    markSaved();
  };

  const moveSection = (sectionId: string, direction: -1 | 1) => {
    if (!data) return;
    const ids = data.sections.map(section => section.id);
    const current = ids.indexOf(sectionId);
    const next = current + direction;
    if (current < 0 || next < 0 || next >= ids.length) return;
    const reordered = [...ids];
    reordered.splice(current, 1);
    reordered.splice(next, 0, sectionId);
    reorderSections(page, reordered);
  };

  const downloadBackup = () => {
    const blob = new Blob([exportBackup()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `danivisual-cms-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file?: File) => {
    if (!file) return;
    try {
      importBackup(await file.text());
      markSaved();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Backup tidak bisa di-import.");
    }
  };

  const stats = {
    fields: content.reduce((s, c) => s + c.sections.reduce((a, sec) => a + sec.fields.length, 0), 0),
    images: Object.keys(images).length,
    imgFields: content.reduce((s, c) => s + c.sections.reduce((a, sec) => a + sec.fields.filter(f => f.type === "image" || f.type === "video").length, 0), 0),
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Global Image Guidelines Banner */}
      <div className="flex-shrink-0 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 py-2">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-[11px] text-blue-700">
          <span>📐</span>
          <span className="font-medium">Panduan Ukuran Gambar:</span>
          <span className="hidden sm:inline">Hero: <code className="bg-blue-100 px-1 rounded">1920×1080</code></span>
          <span className="hidden md:inline">• Story: <code className="bg-blue-100 px-1 rounded">1200×750</code></span>
          <span className="hidden md:inline">• Service: <code className="bg-blue-100 px-1 rounded">900×600</code></span>
          <span className="hidden lg:inline">• Cover: <code className="bg-blue-100 px-1 rounded">1400×800</code></span>
          <span className="ml-auto text-blue-500">Klik 📐 pada setiap gambar untuk detail</span>
        </div>
      </div>

      {/* Header - Compact */}
      <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu size={20} />
            </button>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900" style={{ fontFamily: "var(--font-heading)" }}>Content Editor</h1>
            <p className="text-xs text-gray-500">{data?.label || "Select a page"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`hidden rounded px-2 py-1 text-xs font-semibold sm:inline-flex ${
            data?.status === "draft" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
          }`}>
            {data?.status === "draft" ? "Draft" : "Published"}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
            <ImageIcon size={12} /> {stats.images}/{stats.imgFields}
          </span>
          <button
            onClick={() => window.open(`${previewPaths[page] || "/"}?cmsPreview=1`, "_blank")}
            className="hidden items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 sm:inline-flex"
          >
            <Eye size={12} /> Preview
          </button>
          <button
            onClick={() => { updateMenuMeta(page, { status: "draft" }); markSaved(); }}
            className="hidden items-center gap-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100 sm:inline-flex"
          >
            <Archive size={12} /> Draft
          </button>
          <button
            onClick={handlePublish}
            className="hidden items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700 sm:inline-flex"
          >
            <Rocket size={12} /> Publish
          </button>
          <button
            onClick={downloadBackup}
            className="hidden items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 md:inline-flex"
          >
            <Download size={12} /> Export
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="hidden items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 hover:bg-gray-200 md:inline-flex"
          >
            <FileUp size={12} /> Import
          </button>
          <input ref={importRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => handleImport(e.target.files?.[0])} />
          <span className="hidden sm:inline-flex text-xs text-gray-500">{stats.fields} fields</span>
          {saved && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <Check size={12} /> Saved
            </span>
          )}
          <button onClick={() => { if (confirm("Reset all?")) { resetContent(); resetImages(); } }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
            Reset
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Compact */}
        <aside className={`${mobileMenu ? "absolute inset-0 z-50 bg-white" : "hidden"} lg:block lg:relative lg:w-48 lg:flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto`}>
          <div className="p-2 space-y-0.5">
            {mobileMenu && (
              <button onClick={() => setMobileMenu(false)} className="w-full text-left px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded">
                ✕ Close
              </button>
            )}
            {sectionConfigs.map(cfg => {
              const d = content.find(c => c.id === cfg.id);
              const total = d?.sections.reduce((s, sec) => s + sec.fields.length, 0) || 0;
              const imgs = d?.sections.reduce((s, sec) => s + sec.fields.filter(f => f.type === "image" || f.type === "video").length, 0) || 0;
              return (
                <button key={cfg.id} onClick={() => { setPage(cfg.id); setMobileMenu(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition ${page === cfg.id ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
                  <span className="mr-2">{cfg.icon}</span>
                  {cfg.label}
                  <span className="float-right text-[10px] text-gray-400 mt-0.5">{total}{imgs > 0 ? `+${imgs}` : ""}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content - Dense Grid */}
        <main className="flex-1 overflow-y-auto p-3 space-y-2">
          {data && (
            <div className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">SEO & Publishing</h3>
                  <p className="text-[10px] text-gray-400">
                    Updated {data.updatedAt ? new Date(data.updatedAt).toLocaleString("id-ID") : "-"} · Published {data.publishedAt ? new Date(data.publishedAt).toLocaleString("id-ID") : "-"}
                  </p>
                </div>
                {validationErrors.length > 0 ? (
                  <div className="max-w-xl rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                    {validationErrors.slice(0, 3).map(error => <div key={error}>- {error}</div>)}
                  </div>
                ) : (
                  <span className="rounded bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700">Ready to publish</span>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                <TextInput
                  label="SEO Title"
                  value={currentSeo.title}
                  onChange={(value) => { updateMenuMeta(page, { seo: { ...currentSeo, title: value } }); markSaved(); }}
                />
                <TextInput
                  label="Canonical Path"
                  value={currentSeo.canonicalPath || ""}
                  onChange={(value) => { updateMenuMeta(page, { seo: { ...currentSeo, canonicalPath: value } }); markSaved(); }}
                />
                <TextInput
                  label="Keywords"
                  value={currentSeo.keywords || ""}
                  onChange={(value) => { updateMenuMeta(page, { seo: { ...currentSeo, keywords: value } }); markSaved(); }}
                />
                <TextInput
                  label="OG Image URL/Media ID"
                  value={currentSeo.ogImage || ""}
                  onChange={(value) => { updateMenuMeta(page, { seo: { ...currentSeo, ogImage: value } }); markSaved(); }}
                />
              </div>
              <div className="mt-2">
                <TextInput
                  label="SEO Description"
                  type="textarea"
                  value={currentSeo.description}
                  onChange={(value) => { updateMenuMeta(page, { seo: { ...currentSeo, description: value } }); markSaved(); }}
                />
              </div>
            </div>
          )}

          {data?.sections.map(sec => {
            const isOpen = openSections.includes(sec.id);
            const texts = sec.fields.filter(f => f.type !== "image" && f.type !== "video");
            const imgs = sec.fields.filter(f => f.type === "image" || f.type === "video");
            const sectionIndex = data.sections.findIndex(section => section.id === sec.id);

            return (
              <div key={sec.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-50">
                  <button onClick={() => toggle(sec.id)} className="min-w-0 flex-1 text-left">
                    <h3 className="text-sm font-semibold text-gray-800">{sec.title}</h3>
                    <p className="text-[10px] text-gray-400">{sec.description}</p>
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => moveSection(sec.id, -1)} disabled={sectionIndex === 0} className="rounded px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-100 disabled:opacity-30">Up</button>
                    <button onClick={() => moveSection(sec.id, 1)} disabled={sectionIndex === data.sections.length - 1} className="rounded px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-100 disabled:opacity-30">Down</button>
                    <span className="text-[10px] text-gray-400">{texts.length}T {imgs.length}I</span>
                    <button onClick={() => toggle(sec.id)}>
                      {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 p-3 bg-gray-50/50">
                    {/* Images Grid */}
                    {imgs.length > 0 && (
                      <div className="mb-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                          {imgs.map(f => (
                            <ImageWidget key={f.id} fieldId={f.id} label={f.label}
                              imageUrl={getImage(f.id)} fieldType={f.type === "video" ? "video" : "image"} mediaFiles={mediaFiles} onUpload={imgUpload} onDelete={deleteImage} onSelectMedia={updateImage} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Text Fields - Dense Grid */}
                    {texts.length > 0 && (
                      <div className={`grid gap-2 ${texts.length === 1 ? "" : texts.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`}>
                        {texts.map(f => (
                          <TextInput key={f.id} label={f.label} value={f.value} type={f.type}
                            onChange={(v) => set(sec.id, f.id, v)} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
}
