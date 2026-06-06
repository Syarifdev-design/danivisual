import { useState } from "react";
import {
  Plus, Edit2, Trash2, X, ChevronDown, Package as PackageIcon,
  Check, Eye, GripVertical, ToggleLeft, ToggleRight
} from "lucide-react";
import { useAdmin, Package, PackageCategory, Addon } from "../../contexts/AdminContext";
import { DEFAULT_CATEGORIES, DEFAULT_PACKAGES, DEFAULT_ADDONS } from "../../data/defaultPackages";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

export default function PackagesPage() {
  const {
    packages, packagesLoading, packagesError,
    categories, addons, addonsLoading, addonsError,
    addPackage, updatePackage, deletePackage,
    addCategory, updateCategory, deleteCategory,
    addAddon, updateAddon, deleteAddon,
    refreshPackages,
  } = useAdmin();

  // Use AdminContext data, fallback to shared defaults if empty
  const safeCategories = Array.isArray(categories) && categories.length > 0
    ? categories
    : DEFAULT_CATEGORIES.map(c => ({
        id: c.id,
        name: c.name,
        eyebrow: c.eyebrow,
        note: c.note,
        isActive: c.isActive,
        sortOrder: c.sortOrder,
      }));

  const safePackages = Array.isArray(packages) && packages.length > 0
    ? packages
    : DEFAULT_PACKAGES.map(p => ({
        id: p.id,
        categoryId: p.categoryId,
        categoryName: p.categoryId,
        name: p.name,
        serviceType: p.serviceType,
        isMostSelected: p.isMostSelected,
        startingPrice: p.startingPrice,
        price: p.price,
        description: p.description,
        benefits: p.benefits,
        isActive: p.isActive,
        sortOrder: p.sortOrder,
      }));

  const safeAddons = Array.isArray(addons) && addons.length > 0
    ? addons
    : DEFAULT_ADDONS.map(a => ({
        id: a.id,
        categoryIds: a.categoryIds,
        name: a.name,
        description: a.description || "",
        price: a.price,
        displayPrice: a.displayPrice,
        unit: a.unit,
        hasQuantity: a.hasQuantity,
        isActive: a.isActive,
      }));

  const isLoading = packagesLoading || addonsLoading;
  const [activeTab, setActiveTab] = useState<"categories" | "packages" | "addons">("categories");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"category" | "package" | "addon" | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "", eyebrow: "", note: "" });
  const [packageForm, setPackageForm] = useState({
    categoryId: "",
    name: "",
    serviceType: "Photo" as "Photo" | "Video" | "Photo + Video",
    price: 0,
    startingPrice: 0,
    description: "",
    benefits: "",
    isActive: true,
    isMostSelected: false,
  });
  const [addonForm, setAddonForm] = useState({
    categoryIds: [] as string[],
    name: "",
    description: "",
    price: 0,
    displayPrice: "",
    unit: "",
    hasQuantity: false,
  });

  const handleOpenModal = (type: typeof modalType, item?: any) => {
    setModalType(type);
    setEditingItem(item);
    if (type === "category" && item) {
      setCategoryForm({ name: item.name, eyebrow: item.eyebrow, note: item.note || "" });
    } else if (type === "package" && item) {
      const benefits = Array.isArray(item.benefits) ? item.benefits : [];
      const safeBenefits = benefits.map(b => String(b ?? "")).filter(Boolean);
      setPackageForm({ categoryId: item.categoryId || "", name: item.name || "", serviceType: item.serviceType || "Photo", price: item.price || 0, startingPrice: item.startingPrice || 0, description: item.description || "", benefits: safeBenefits.join("\n"), isActive: item.isActive ?? true, isMostSelected: Boolean(item.isMostSelected) });
    } else if (type === "addon" && item) {
      setAddonForm({ categoryIds: Array.isArray(item.categoryIds) ? item.categoryIds : [], name: item.name || "", description: item.description || "", price: item.price || 0, displayPrice: item.displayPrice || "", unit: item.unit || "", hasQuantity: Boolean(item.hasQuantity) });
    } else {
      setCategoryForm({ name: "", eyebrow: "", note: "" });
      setPackageForm({ categoryId: safeCategories[0]?.id || "", name: "", serviceType: "Photo", price: 0, startingPrice: 0, description: "", benefits: "", isActive: true, isMostSelected: false });
      setAddonForm({ categoryIds: safeCategories[0]?.id ? [safeCategories[0].id] : [], name: "", description: "", price: 0, displayPrice: "", unit: "", hasQuantity: false });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalType === "category") {
      if (editingItem) {
        updateCategory(editingItem.id, categoryForm);
      } else {
        addCategory({ ...categoryForm, isActive: true });
      }
    } else if (modalType === "package") {
      if (editingItem) {
        updatePackage(editingItem.id, { ...packageForm, benefits: packageForm.benefits.split("\n").filter(b => b.trim()) });
      } else {
        const cat = safeCategories.find(c => c.id === packageForm.categoryId);
        addPackage({ ...packageForm, categoryName: cat?.name || "", benefits: packageForm.benefits.split("\n").filter(b => b.trim()), isActive: true });
      }
    } else if (modalType === "addon") {
      if (editingItem) {
        updateAddon(editingItem.id, addonForm);
      } else {
        addAddon({ ...addonForm, isActive: true });
      }
    }
    setShowModal(false);
    setEditingItem(null);
  };

  const handleDelete = (type: string, id: string) => {
    if (confirm("Yakin ingin menghapus?")) {
      if (type === "category") deleteCategory(id);
      else if (type === "package") deletePackage(id);
      else if (type === "addon") deleteAddon(id);
    }
  };

  const getCategoryPackages = (categoryId: string) => safePackages.filter(p => p.categoryId === categoryId);
  const getAddonCategoryIds = (addon: Addon): string[] => {
    if (!addon) return [];
    if (!Array.isArray(addon.categoryIds)) return [];
    return addon.categoryIds;
  };
  const toggleAddonCategory = (categoryId: string) => {
    setAddonForm((prev) => ({
      ...prev,
      categoryIds: (Array.isArray(prev.categoryIds) ? prev.categoryIds : []).includes(categoryId)
        ? (Array.isArray(prev.categoryIds) ? prev.categoryIds : []).filter((id) => id !== categoryId)
        : [...(Array.isArray(prev.categoryIds) ? prev.categoryIds : []), categoryId],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Content Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>Packages & Add-ons</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola kategori paket, harga, benefit, dan add-ons.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <span className="text-xs text-foreground-secondary">Loading...</span>
            )}
            {(packagesError || addonsError) && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                Error
              </span>
            )}
            <button
              onClick={refreshPackages}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:bg-premium-beige/10 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(["categories", "packages", "addons"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${
              activeTab === tab ? "border border-premium-beige bg-dark-premium text-white" : "border border-border-line bg-white text-foreground-secondary hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-premium-beige/25 bg-white p-6 text-sm text-foreground-secondary shadow-[0_18px_60px_rgba(40,28,16,0.08)]">
          Memuat data packages...
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-line p-4">
            <h3 className="font-semibold">Package Categories</h3>
            <button onClick={() => handleOpenModal("category")} className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white">
              <Plus size={14} /> Add Category
            </button>
          </div>
          <div className="divide-y divide-border-line">
            {safeCategories.length === 0 ? (
              <div className="p-12 text-center">
                <PackageIcon size={48} className="mx-auto text-border-line" />
                <p className="mt-4 text-sm text-foreground-secondary">Belum ada kategori</p>
              </div>
            ) : (
              safeCategories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold">{cat.name}</p>
                    <p className="text-xs text-foreground-secondary">{cat.eyebrow}</p>
                    <p className="text-xs text-foreground-secondary">{getCategoryPackages(cat.id).length} packages</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${cat.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </span>
                    <button onClick={() => updateCategory(cat.id, { isActive: !cat.isActive })} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                      {cat.isActive ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} />}
                    </button>
                    <button onClick={() => handleOpenModal("category", cat)} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete("category", cat.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === "packages" && (
        <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-line p-4">
            <h3 className="font-semibold">All Packages</h3>
            <button onClick={() => handleOpenModal("package")} className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white">
              <Plus size={14} /> Add Package
            </button>
          </div>
          <div className="divide-y divide-border-line">
            {safePackages.length === 0 ? (
              <div className="p-12 text-center">
                <PackageIcon size={48} className="mx-auto text-border-line" />
                <p className="mt-4 text-sm text-foreground-secondary">Belum ada paket</p>
              </div>
            ) : (
              safePackages.map((pkg) => {
                const cat = safeCategories.find(c => c.id === pkg.categoryId);
                return (
                  <div key={pkg.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{pkg.name}</p>
                        {pkg.isMostSelected && <span className="rounded-full bg-premium-beige/10 px-2 py-1 text-xs text-premium-beige">Popular</span>}
                      </div>
                      <p className="text-xs text-foreground-secondary">{cat?.name || "Unknown"} · {(pkg.serviceType as string | undefined) || "Photo"}</p>
                      <p className="text-sm font-semibold text-premium-beige">{formatCurrency(pkg.price || 0)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${pkg.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {pkg.isActive ? "Active" : "Inactive"}
                      </span>
                      <button onClick={() => updatePackage(pkg.id, { isActive: !pkg.isActive })} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                        {pkg.isActive ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => handleOpenModal("package", pkg)} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete("package", pkg.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Addons Tab */}
      {activeTab === "addons" && (
        <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-line p-4">
            <h3 className="font-semibold">Add-ons</h3>
            <button onClick={() => handleOpenModal("addon")} className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white">
              <Plus size={14} /> Add Add-on
            </button>
          </div>
          <div className="divide-y divide-border-line">
            {safeAddons.length === 0 ? (
              <div className="p-12 text-center">
                <PackageIcon size={48} className="mx-auto text-border-line" />
                <p className="mt-4 text-sm text-foreground-secondary">Belum ada add-on</p>
              </div>
            ) : (
              safeAddons.map((addon) => {
                const categoryIds = getAddonCategoryIds(addon);
                return (
                  <div key={addon.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold">{addon.name}</p>
                      <p className="text-xs text-foreground-secondary">{addon.description}</p>
                      <p className="text-xs text-foreground-secondary">
                        {categoryIds.length ? categoryIds.map(id => safeCategories.find(cat => cat.id === id)?.name || id).join(", ") : "Belum ada kategori"}
                      </p>
                      <p className="text-sm font-semibold text-premium-beige">{formatCurrency(addon.price || 0)} {addon.unit && <span className="text-xs">/{addon.unit}</span>}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${addon.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        {addon.isActive ? "Active" : "Inactive"}
                      </span>
                      <button onClick={() => updateAddon(addon.id, { isActive: !addon.isActive })} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                        {addon.isActive ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} />}
                      </button>
                      <button onClick={() => handleOpenModal("addon", addon)} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete("addon", addon.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">{editingItem ? "Edit" : "Add"} {modalType}</p>
                <h3 className="mt-1 text-xl font-semibold capitalize">{modalType}</h3>
              </div>
              <button onClick={() => { setShowModal(false); setEditingItem(null); }} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {modalType === "category" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Name *</label>
                    <input type="text" required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Eyebrow *</label>
                    <input type="text" required value={categoryForm.eyebrow} onChange={(e) => setCategoryForm({ ...categoryForm, eyebrow: e.target.value })} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Note</label>
                    <input type="text" value={categoryForm.note} onChange={(e) => setCategoryForm({ ...categoryForm, note: e.target.value })} className={inputClassName} />
                  </div>
                </>
              )}
              {modalType === "package" && (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Category *</label>
                    <select required value={packageForm.categoryId} onChange={(e) => setPackageForm({ ...packageForm, categoryId: e.target.value })} className={inputClassName}>
                      <option value="">Select category</option>
                      {safeCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Name *</label>
                    <input type="text" required value={packageForm.name} onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Service Type</label>
                    <select value={packageForm.serviceType} onChange={(e) => setPackageForm({ ...packageForm, serviceType: e.target.value as typeof packageForm.serviceType })} className={inputClassName}>
                      <option value="Photo">Photo</option>
                      <option value="Video">Video</option>
                      <option value="Photo + Video">Photo + Video</option>
                    </select>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Price *</label>
                      <input type="number" required value={packageForm.price} onChange={(e) => setPackageForm({ ...packageForm, price: Number(e.target.value) })} className={inputClassName} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Starting Price</label>
                      <input type="number" value={packageForm.startingPrice} onChange={(e) => setPackageForm({ ...packageForm, startingPrice: Number(e.target.value) })} className={inputClassName} />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Description</label>
                    <textarea value={packageForm.description} onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })} className={inputClassName} rows={2} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Benefits (one per line)</label>
                    <textarea value={packageForm.benefits} onChange={(e) => setPackageForm({ ...packageForm, benefits: e.target.value })} className={inputClassName} rows={4} placeholder="Benefit 1&#10;Benefit 2&#10;Benefit 3" />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={packageForm.isMostSelected} onChange={(e) => setPackageForm({ ...packageForm, isMostSelected: e.target.checked })} className="h-4 w-4 rounded border-border-line" />
                      <span className="text-sm">Mark as Popular</span>
                    </label>
                  </div>
                </>
              )}
              {modalType === "addon" && (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-semibold">Visible for Categories *</label>
                    <div className="grid gap-2 rounded-lg border border-border-line p-3 sm:grid-cols-2">
                      {safeCategories.map((cat) => (
                        <label key={cat.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={(Array.isArray(addonForm.categoryIds) ? addonForm.categoryIds : []).includes(cat.id)}
                            onChange={() => toggleAddonCategory(cat.id)}
                            className="h-4 w-4 rounded border-border-line"
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Name *</label>
                    <input type="text" required value={addonForm.name} onChange={(e) => setAddonForm({ ...addonForm, name: e.target.value })} className={inputClassName} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Description</label>
                    <input type="text" value={addonForm.description} onChange={(e) => setAddonForm({ ...addonForm, description: e.target.value })} className={inputClassName} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Price *</label>
                      <input type="number" required value={addonForm.price} onChange={(e) => setAddonForm({ ...addonForm, price: Number(e.target.value) })} className={inputClassName} />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-semibold">Unit (optional)</label>
                      <input type="text" value={addonForm.unit} onChange={(e) => setAddonForm({ ...addonForm, unit: e.target.value })} className={inputClassName} placeholder="pcs, hour, etc." />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-semibold">Display Price</label>
                    <input type="text" value={addonForm.displayPrice} onChange={(e) => setAddonForm({ ...addonForm, displayPrice: e.target.value })} className={inputClassName} placeholder="e.g. Rp 200.000/pcs" />
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={addonForm.hasQuantity} onChange={(e) => setAddonForm({ ...addonForm, hasQuantity: e.target.checked })} className="h-4 w-4 rounded border-border-line" />
                    <span className="text-sm">Allow quantity selector</span>
                  </label>
                </>
              )}
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); }} className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold">Cancel</button>
                <button type="submit" className="rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white">{editingItem ? "Update" : "Add"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
