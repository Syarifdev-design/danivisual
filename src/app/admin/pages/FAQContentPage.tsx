import { Edit2, ExternalLink, Plus, Trash2 } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import AdminDataTable, { type AdminDataTableColumn } from "../components/AdminDataTable";
import AdminFormSection from "../components/AdminFormSection";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPreviewCard from "../components/AdminPreviewCard";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { type FAQ, useAdmin } from "../../contexts/AdminContext";
import { faqCategories } from "../../data/defaultFaqs";

const emptyForm = {
  category: "Booking",
  question: "",
  answer: "",
  sortOrder: 1,
  isPublished: true,
};

type FAQForm = typeof emptyForm;

const inputClass = "min-h-11 w-full border border-border-line bg-white px-3 text-sm outline-none transition focus:border-premium-beige";
const textareaClass = "min-h-32 w-full resize-y border border-border-line bg-white px-3 py-3 text-sm leading-relaxed outline-none transition focus:border-premium-beige";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary";

export default function FAQContentPage() {
  const { faqs, addFAQ, updateFAQ, deleteFAQ } = useAdmin();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FAQForm>({
    ...emptyForm,
    sortOrder: Math.max(0, ...faqs.map((faq) => faq.sortOrder)) + 1,
  });

  const sortedFaqs = useMemo(
    () => [...faqs].sort((a, b) => a.sortOrder - b.sortOrder),
    [faqs],
  );

  const filteredFaqs = useMemo(
    () => sortedFaqs.filter((faq) => categoryFilter === "all" || faq.category === categoryFilter),
    [categoryFilter, sortedFaqs],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      category: categoryFilter === "all" ? "Booking" : categoryFilter,
      sortOrder: Math.max(0, ...faqs.map((faq) => faq.sortOrder)) + 1,
    });
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const payload = {
      category: form.category,
      question: form.question.trim(),
      answer: form.answer.trim(),
      sortOrder: Number(form.sortOrder) || 1,
      isPublished: form.isPublished,
    };

    if (!payload.question || !payload.answer) return;

    if (editingId) {
      updateFAQ(editingId, payload);
    } else {
      addFAQ(payload);
    }

    resetForm();
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setForm({
      category: faq.category,
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sortOrder,
      isPublished: faq.isPublished,
    });
  };

  const columns: AdminDataTableColumn<FAQ>[] = [
    {
      key: "order",
      header: "Order",
      render: (faq) => <span className="font-medium">{faq.sortOrder}</span>,
    },
    {
      key: "category",
      header: "Category",
      render: (faq) => faq.category,
    },
    {
      key: "question",
      header: "Question",
      render: (faq) => (
        <div>
          <p className="font-medium text-foreground">{faq.question}</p>
          <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-relaxed text-foreground-secondary">{faq.answer}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (faq) => (
        <AdminStatusBadge tone={faq.isPublished ? "success" : "neutral"}>
          {faq.isPublished ? "Published" : "Draft"}
        </AdminStatusBadge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (faq) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => startEdit(faq)}
            className="inline-flex min-h-9 items-center gap-2 border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
          >
            <Edit2 size={13} /> Edit
          </button>
          <button
            type="button"
            onClick={() => {
              deleteFAQ(faq.id);
              if (editingId === faq.id) resetForm();
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
        title="FAQ Page"
        description="Manage client questions for the public FAQ page. If no admin FAQ exists, the public page keeps using the default FAQ content."
        actions={
          <>
            <a href="/faq" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
              <ExternalLink size={15} /> Preview FAQ
            </a>
            <button type="button" onClick={resetForm} className="inline-flex min-h-11 items-center gap-2 bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90">
              <Plus size={15} /> New FAQ
            </button>
          </>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border-line pb-3">
        {["all", ...faqCategories].map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setCategoryFilter(category)}
            className={`min-h-11 shrink-0 border px-5 text-sm transition ${
              categoryFilter === category
                ? "border-premium-beige bg-premium-beige/10 text-foreground"
                : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige hover:text-foreground"
            }`}
          >
            {category === "all" ? "All Categories" : category}
          </button>
        ))}
      </div>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-8">
          <AdminDataTable
            columns={columns}
            rows={filteredFaqs}
            emptyText="No FAQ yet. Add the first FAQ to replace the public default FAQ content."
          />
        </div>

        <aside className="grid min-w-0 gap-5 content-start">
          <AdminFormSection
            eyebrow={editingId ? "Edit FAQ" : "New FAQ"}
            title={editingId ? "Update Question" : "Create Question"}
            description="Published FAQ items will appear on the public FAQ page after saving."
          >
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className={labelClass}>Category</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                  className={inputClass}
                >
                  {faqCategories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <Field label="Question" value={form.question} onChange={(value) => setForm((current) => ({ ...current, question: value }))} />
              <TextArea label="Answer" value={form.answer} onChange={(value) => setForm((current) => ({ ...current, answer: value }))} />

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Order"
                  type="number"
                  value={String(form.sortOrder)}
                  onChange={(value) => setForm((current) => ({ ...current, sortOrder: Number(value) || 1 }))}
                />
                <label className="flex min-h-11 items-center gap-3 border border-border-line bg-background-soft px-4 text-sm text-foreground sm:mt-6">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) => setForm((current) => ({ ...current, isPublished: event.target.checked }))}
                    className="accent-black"
                  />
                  Published
                </label>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button type="submit" className="inline-flex min-h-11 items-center gap-2 bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90">
                  {editingId ? "Save FAQ" : "Add FAQ"}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="min-h-11 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </AdminFormSection>

          <AdminPreviewCard eyebrow={form.category} title={form.question || "FAQ preview"}>
            <p>{form.answer || "Write an answer to preview how the FAQ content reads."}</p>
            <div className="mt-4">
              <AdminStatusBadge tone={form.isPublished ? "success" : "neutral"}>
                {form.isPublished ? "Published" : "Draft"}
              </AdminStatusBadge>
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
