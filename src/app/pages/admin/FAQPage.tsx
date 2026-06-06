import { useState } from "react";
import {
  Plus, Edit2, Trash2, X, HelpCircle, ChevronDown, ChevronUp,
  GripVertical, Eye, EyeOff, Save
} from "lucide-react";
import { useAdmin, FAQ } from "../../contexts/AdminContext";

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

const faqCategories = ["Booking", "Pembayaran", "Hasil", "General", "Lainnya"];

export default function FAQPage() {
  const { faqs, faqsLoading, faqsError, addFAQ, updateFAQ, deleteFAQ, reorderFAQs, refreshFAQs } = useAdmin();
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: faqCategories[0],
    question: "",
    answer: "",
    isPublished: true,
  });

  const filteredFAQs = categoryFilter === "all"
    ? faqs.sort((a, b) => a.sortOrder - b.sortOrder)
    : faqs.filter(f => f.category === categoryFilter).sort((a, b) => a.sortOrder - b.sortOrder);

  const handleOpenModal = (faq?: FAQ) => {
    if (faq) {
      setEditingFAQ(faq);
      setFormData({
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        isPublished: faq.isPublished,
      });
    } else {
      setEditingFAQ(null);
      setFormData({
        category: faqCategories[0],
        question: "",
        answer: "",
        isPublished: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFAQ) {
      updateFAQ(editingFAQ.id, formData);
    } else {
      addFAQ(formData);
    }
    setShowModal(false);
    setEditingFAQ(null);
  };

  const handleDelete = (id: string) => {
    if (confirm("Yakin ingin menghapus FAQ ini?")) {
      deleteFAQ(id);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const items = filteredFAQs.map(f => f.id);
    const fromIndex = items.indexOf(draggedId);
    const toIndex = items.indexOf(targetId);

    if (fromIndex === -1 || toIndex === -1) return;

    const newOrder = [...items];
    newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, draggedId);

    reorderFAQs(newOrder);
    setDraggedId(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white/86 p-5 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-premium-beige">Content Management</p>
            <h2 className="mt-2 text-3xl" style={{ fontFamily: "var(--font-heading)" }}>FAQ</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground-secondary">
              Kelola pertanyaan dan jawaban yang tampil di halaman FAQ website.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {faqsLoading && (
              <span className="text-xs text-foreground-secondary">Loading...</span>
            )}
            {faqsError && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                Error
              </span>
            )}
            <button
              onClick={refreshFAQs}
              disabled={faqsLoading}
              className="inline-flex items-center gap-2 rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold text-foreground-secondary transition hover:bg-premium-beige/10 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white transition hover:bg-dark-premium/90"
            >
              <Plus size={14} />
              Add FAQ
            </button>
          </div>
        </div>
      </div>

      {/* Stats & Filter */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-premium-beige/25 bg-white/86 p-4 shadow-[0_18px_60px_rgba(40,28,16,0.08)] backdrop-blur">
        <div className="flex items-center gap-4">
          <span className="text-sm text-foreground-secondary">{faqs.length} questions</span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            {faqs.filter(f => f.isPublished).length} published
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
              categoryFilter === "all" ? "bg-dark-premium text-white" : "bg-white border border-border-line"
            }`}
          >
            All
          </button>
          {faqCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                categoryFilter === cat ? "bg-dark-premium text-white" : "bg-white border border-border-line"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ List */}
      <div className="rounded-2xl border border-premium-beige/25 bg-white shadow-[0_18px_60px_rgba(40,28,16,0.08)] overflow-hidden">
        {filteredFAQs.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle size={48} className="mx-auto text-border-line" />
            <p className="mt-4 text-sm text-foreground-secondary">Belum ada FAQ</p>
            <button onClick={() => handleOpenModal()} className="mt-4 text-sm font-semibold text-premium-beige hover:underline">
              Tambah FAQ pertama
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border-line">
            {filteredFAQs.map((faq, index) => (
              <div
                key={faq.id}
                draggable
                onDragStart={(e) => handleDragStart(e, faq.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, faq.id)}
                className={`group flex items-start gap-4 p-4 transition ${
                  draggedId === faq.id ? "bg-premium-beige/10" : "hover:bg-premium-beige/5"
                }`}
              >
                <div className="flex cursor-move items-center text-foreground-secondary opacity-0 transition group-hover:opacity-100">
                  <GripVertical size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-premium-beige/10 px-2 py-1 text-xs text-premium-beige">{faq.category}</span>
                        {!faq.isPublished && (
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500">Hidden</span>
                        )}
                      </div>
                      <h3 className="mt-2 font-semibold">{faq.question}</h3>
                      <p className="mt-1 text-sm text-foreground-secondary line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateFAQ(faq.id, { isPublished: !faq.isPublished })}
                        className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                        title={faq.isPublished ? "Hide" : "Publish"}
                      >
                        {faq.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                        className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                      >
                        {expandedId === faq.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button onClick={() => handleOpenModal(faq)} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(faq.id)} className="rounded-lg p-2 text-red-500 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  {expandedId === faq.id && (
                    <div className="mt-4 rounded-lg bg-premium-beige/5 p-4">
                      <p className="text-sm leading-relaxed">{faq.answer}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="rounded-2xl border border-dashed border-premium-beige/40 bg-white/65 p-5">
        <p className="text-sm text-foreground-secondary">
          <strong>Tips:</strong> Drag and drop untuk mengubah urutan FAQ. FAQ yang published akan tampil di website.
        </p>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">{editingFAQ ? "Edit" : "Add"} FAQ</p>
                <h3 className="mt-1 text-xl font-semibold">{editingFAQ ? "Edit FAQ" : "New FAQ"}</h3>
              </div>
              <button onClick={() => { setShowModal(false); setEditingFAQ(null); }} className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-semibold">Category *</label>
                <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputClassName}>
                  {faqCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Question *</label>
                <input type="text" required value={formData.question} onChange={(e) => setFormData({ ...formData, question: e.target.value })} className={inputClassName} placeholder="Pertanyaan yang sering ditanyakan" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold">Answer *</label>
                <textarea required value={formData.answer} onChange={(e) => setFormData({ ...formData, answer: e.target.value })} className={inputClassName} rows={4} placeholder="Jawaban yang informatif dan membantu" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={formData.isPublished} onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })} className="h-4 w-4 rounded border-border-line" />
                <span className="text-sm">Publish FAQ (tampil di website)</span>
              </label>
              <div className="flex justify-end gap-2 pt-4">
                <button type="button" onClick={() => { setShowModal(false); setEditingFAQ(null); }} className="rounded-full border border-border-line bg-white px-4 py-2 text-xs font-semibold">Cancel</button>
                <button type="submit" className="rounded-full bg-dark-premium px-4 py-2 text-xs font-semibold text-white">{editingFAQ ? "Update" : "Add"} FAQ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}