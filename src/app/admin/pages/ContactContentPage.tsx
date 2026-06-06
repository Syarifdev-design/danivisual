import { Edit2, ExternalLink, MessageCircle, Instagram, Youtube, MapPin, Check, Inbox, ChevronRight, Phone, Trash2, Archive, UserCheck } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPreviewCard from "../components/AdminPreviewCard";
import AdminFormSection from "../components/AdminFormSection";
import { useContent } from "../../contexts/ContentContext";
import {
  getInquiries,
  updateInquiryStatus,
  deleteInquiry,
  type Inquiry,
  type InquiryStatus,
} from "../../../services/inquiryService";

const inputClass = "min-h-11 w-full border border-border-line bg-white px-3 text-sm outline-none transition focus:border-premium-beige";
const textareaClass = "min-h-24 w-full resize-y border border-border-line bg-white px-3 py-3 text-sm leading-relaxed outline-none transition focus:border-premium-beige";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary";

export default function ContactContentPage() {
  const { getField, updateField, content } = useContent();

  // Local edit state
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const handleEdit = (sectionId: string, fieldId: string, currentValue: string) => {
    setEditingSection(`${sectionId}:${fieldId}`);
    setEditValues({ ...editValues, [fieldId]: currentValue });
  };

  const handleSave = (sectionId: string, fieldId: string) => {
    updateField("contact", sectionId, fieldId, editValues[fieldId] || "");
    setEditingSection(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditValues({});
  };

  // Contact Information from ContentContext
  const whatsappLabel = getField("contact", "info", "whatsapp_label", "WhatsApp");
  const whatsappNumber = getField("contact", "info", "whatsapp_number", "082337279636");

  const instagramLabel = getField("contact", "info", "instagram_label", "Instagram");
  const instagramUsername = getField("contact", "info", "instagram_username", "@danivisual.photo");

  const youtubeLabel = getField("contact", "info", "youtube_label", "YouTube");
  const youtubeChannel = getField("contact", "info", "youtube_channel", "DANIVISUAL OFFICIAL");

  const addressLabel = getField("contact", "info", "address_label", "Alamat Studio");
  const address = getField("contact", "info", "address", "Utara lapangan, Mudah, Ngadirejan, Kec. Pringkuku, Kabupaten Pacitan, Jawa Timur 63552");
  const mapsUrl = getField("contact", "info", "maps_url", "https://maps.app.goo.gl/iUyGZ5zmFTDUFQ5z5");

  // Form labels
  const formTitle = getField("contact", "form", "title", "Kirim Inquiry");
  const formButton = getField("contact", "form", "submit_button", "Kirim Inquiry");
  const packagesButton = getField("contact", "form", "packages_button", "Lihat Semua Paket");
  const serviceOptions = getField("contact", "form", "service_options", "Wedding,Prewedding,Event,Studio,Lainnya");

  // Get contact content sections
  const contactMenu = content.find((c) => c.id === "contact");
  const contactSections = contactMenu?.sections || [];

  // Inquiry stats
  const [inquiryStats, setInquiryStats] = useState<{ total: number; new: number }>({ total: 0, new: 0 });

  // Inquiry Inbox state
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiryFilter, setInquiryFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  // Load inquiries
  const loadInquiries = useCallback(async () => {
    setInquiriesLoading(true);
    const data = await getInquiries();
    setInquiries(data);
    setInquiryStats({
      total: data.length,
      new: data.filter((i) => i.status === "new").length,
    });
    setInquiriesLoading(false);
  }, []);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  // Filter inquiries
  const filteredInquiries = inquiries.filter((inquiry) =>
    inquiryFilter === "all" || inquiry.status === inquiryFilter
  );

  // Handle status change
  const handleInquiryStatusChange = async (id: string, status: InquiryStatus) => {
    await updateInquiryStatus(id, status);
    await loadInquiries();
  };

  // Handle delete
  const handleDeleteInquiry = async (id: string) => {
    if (confirm("Yakin ingin menghapus inquiry ini?")) {
      await deleteInquiry(id);
      setSelectedInquiry(null);
      await loadInquiries();
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // WhatsApp link generator
  const getWhatsAppLink = (phone: string, message?: string) => {
    const digits = phone.replace(/\D/g, "");
    const formatted = digits.startsWith("0") ? "62" + digits.slice(1) : digits;
    const encodedMsg = message ? encodeURIComponent(message) : "";
    return `https://wa.me/${formatted}${encodedMsg ? `?text=${encodedMsg}` : ""}`;
  };

  // Status config
  const statusConfig: Record<InquiryStatus, { label: string; bg: string; text: string }> = {
    new: { label: "Baru", bg: "bg-blue-50", text: "text-blue-700" },
    contacted: { label: "Dihubungi", bg: "bg-amber-50", text: "text-amber-700" },
    converted: { label: "Konversi", bg: "bg-emerald-50", text: "text-emerald-700" },
    archived: { label: "Arsip", bg: "bg-gray-50", text: "text-gray-700" },
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        eyebrow="Website Content"
        title="Contact Page"
        description="Manage contact information, social links, studio address, and inquiry form settings."
        actions={
          <div className="flex items-center gap-3">
            {saved && (
              <span className="inline-flex min-h-11 items-center gap-2 bg-emerald-50 px-4 text-sm text-emerald-700">
                <Check size={16} /> Saved
              </span>
            )}
            <Link
              to="/admin/content/inquiries"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-premium-beige px-4 text-sm text-white transition hover:bg-premium-beige/90"
            >
              <Inbox size={16} />
              Inquiries ({inquiryStats.total})
              <ChevronRight size={14} />
            </Link>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Details */}
        <AdminPreviewCard
          eyebrow="Step 1"
          title="Contact Information"
          description="Edit WhatsApp, Instagram, YouTube, and studio address."
        >
          <div className="space-y-4">
            {/* WhatsApp */}
            <div className="rounded-lg border border-border-line bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <MessageCircle size={16} className="text-premium-beige" />
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-secondary">WhatsApp</span>
              </div>
              {editingSection === "info:whatsapp_label" ? (
                <div className="space-y-2">
                  <label className={labelClass}>Label</label>
                  <input
                    type="text"
                    value={editValues.whatsapp_label ?? whatsappLabel}
                    onChange={(e) => setEditValues({ ...editValues, whatsapp_label: e.target.value })}
                    className={inputClass}
                  />
                  <label className={labelClass}>Number</label>
                  <input
                    type="text"
                    value={editValues.whatsapp_number ?? whatsappNumber}
                    onChange={(e) => setEditValues({ ...editValues, whatsapp_number: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("info", "whatsapp_label")}
                      className="min-h-9 flex-1 bg-dark-premium px-3 text-xs text-white transition hover:bg-dark-premium/90"
                    >
                      Save
                    </button>
                    <button onClick={handleCancel} className="min-h-9 flex-1 border border-border-line px-3 text-xs text-foreground-secondary transition hover:border-premium-beige">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-1 font-medium">{whatsappLabel}</p>
                  <p className="mb-3 text-xs text-foreground-secondary">{whatsappNumber}</p>
                  <button
                    onClick={() => handleEdit("info", "whatsapp_label", whatsappLabel)}
                    className="inline-flex min-h-9 items-center gap-2 border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </>
              )}
            </div>

            {/* Instagram */}
            <div className="rounded-lg border border-border-line bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Instagram size={16} className="text-premium-beige" />
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-secondary">Instagram</span>
              </div>
              {editingSection === "info:instagram_label" ? (
                <div className="space-y-2">
                  <label className={labelClass}>Label</label>
                  <input
                    type="text"
                    value={editValues.instagram_label ?? instagramLabel}
                    onChange={(e) => setEditValues({ ...editValues, instagram_label: e.target.value })}
                    className={inputClass}
                  />
                  <label className={labelClass}>Username</label>
                  <input
                    type="text"
                    value={editValues.instagram_username ?? instagramUsername}
                    onChange={(e) => setEditValues({ ...editValues, instagram_username: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("info", "instagram_label")}
                      className="min-h-9 flex-1 bg-dark-premium px-3 text-xs text-white transition hover:bg-dark-premium/90"
                    >
                      Save
                    </button>
                    <button onClick={handleCancel} className="min-h-9 flex-1 border border-border-line px-3 text-xs text-foreground-secondary transition hover:border-premium-beige">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-1 font-medium">{instagramLabel}</p>
                  <p className="mb-3 text-xs text-foreground-secondary">{instagramUsername}</p>
                  <button
                    onClick={() => handleEdit("info", "instagram_label", instagramLabel)}
                    className="inline-flex min-h-9 items-center gap-2 border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </>
              )}
            </div>

            {/* YouTube */}
            <div className="rounded-lg border border-border-line bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <Youtube size={16} className="text-premium-beige" />
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-secondary">YouTube</span>
              </div>
              {editingSection === "info:youtube_label" ? (
                <div className="space-y-2">
                  <label className={labelClass}>Label</label>
                  <input
                    type="text"
                    value={editValues.youtube_label ?? youtubeLabel}
                    onChange={(e) => setEditValues({ ...editValues, youtube_label: e.target.value })}
                    className={inputClass}
                  />
                  <label className={labelClass}>Channel</label>
                  <input
                    type="text"
                    value={editValues.youtube_channel ?? youtubeChannel}
                    onChange={(e) => setEditValues({ ...editValues, youtube_channel: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("info", "youtube_label")}
                      className="min-h-9 flex-1 bg-dark-premium px-3 text-xs text-white transition hover:bg-dark-premium/90"
                    >
                      Save
                    </button>
                    <button onClick={handleCancel} className="min-h-9 flex-1 border border-border-line px-3 text-xs text-foreground-secondary transition hover:border-premium-beige">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-1 font-medium">{youtubeLabel}</p>
                  <p className="mb-3 text-xs text-foreground-secondary">{youtubeChannel}</p>
                  <button
                    onClick={() => handleEdit("info", "youtube_label", youtubeLabel)}
                    className="inline-flex min-h-9 items-center gap-2 border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </>
              )}
            </div>

            {/* Address */}
            <div className="rounded-lg border border-border-line bg-white p-4">
              <div className="mb-3 flex items-center gap-2">
                <MapPin size={16} className="text-premium-beige" />
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-secondary">Studio Address</span>
              </div>
              {editingSection === "info:address_label" ? (
                <div className="space-y-2">
                  <label className={labelClass}>Label</label>
                  <input
                    type="text"
                    value={editValues.address_label ?? addressLabel}
                    onChange={(e) => setEditValues({ ...editValues, address_label: e.target.value })}
                    className={inputClass}
                  />
                  <label className={labelClass}>Address</label>
                  <textarea
                    value={editValues.address ?? address}
                    onChange={(e) => setEditValues({ ...editValues, address: e.target.value })}
                    className={textareaClass}
                  />
                  <label className={labelClass}>Google Maps URL</label>
                  <input
                    type="text"
                    value={editValues.maps_url ?? mapsUrl}
                    onChange={(e) => setEditValues({ ...editValues, maps_url: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSave("info", "address_label")}
                      className="min-h-9 flex-1 bg-dark-premium px-3 text-xs text-white transition hover:bg-dark-premium/90"
                    >
                      Save
                    </button>
                    <button onClick={handleCancel} className="min-h-9 flex-1 border border-border-line px-3 text-xs text-foreground-secondary transition hover:border-premium-beige">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mb-1 font-medium">{addressLabel}</p>
                  <p className="mb-2 text-sm">{address}</p>
                  <p className="mb-3 text-xs text-foreground-secondary">{mapsUrl}</p>
                  <button
                    onClick={() => handleEdit("info", "address_label", addressLabel)}
                    className="inline-flex min-h-9 items-center gap-2 border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </AdminPreviewCard>

        {/* Intro Section */}
        <AdminPreviewCard
          eyebrow="Step 2"
          title="Page Introduction"
          description="Edit the contact page hero section."
        >
          <div className="space-y-4">
            {contactSections.find((s) => s.id === "intro")?.fields.map((field) => (
              <div key={field.id} className="rounded-lg border border-border-line bg-white p-4">
                {editingSection === `intro:${field.id}` ? (
                  <div className="space-y-2">
                    <label className={labelClass}>{field.label}</label>
                    {field.type === "textarea" ? (
                      <textarea
                        value={editValues[field.id] ?? field.value}
                        onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                        className={textareaClass}
                      />
                    ) : (
                      <input
                        type="text"
                        value={editValues[field.id] ?? field.value}
                        onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                        className={inputClass}
                      />
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave("intro", field.id)}
                        className="min-h-9 flex-1 bg-dark-premium px-3 text-xs text-white transition hover:bg-dark-premium/90"
                      >
                        Save
                      </button>
                      <button onClick={handleCancel} className="min-h-9 flex-1 border border-border-line px-3 text-xs text-foreground-secondary transition hover:border-premium-beige">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-secondary">{field.label}</span>
                      <button
                        onClick={() => handleEdit("intro", field.id, field.value)}
                        className="inline-flex min-h-8 items-center gap-1.5 border border-border-line bg-white px-2 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                    <p className="text-sm">{field.value}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </AdminPreviewCard>

        {/* Form Section */}
        <AdminPreviewCard
          eyebrow="Step 3"
          title="Inquiry Form"
          description="Edit form labels, placeholders, and service options."
        >
          <div className="space-y-4">
            {contactSections.find((s) => s.id === "form")?.fields.map((field) => (
              <div key={field.id} className="rounded-lg border border-border-line bg-white p-4">
                {editingSection === `form:${field.id}` ? (
                  <div className="space-y-2">
                    <label className={labelClass}>{field.label}</label>
                    {field.type === "textarea" || field.id === "service_options" ? (
                      <textarea
                        value={editValues[field.id] ?? field.value}
                        onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                        className={textareaClass}
                      />
                    ) : (
                      <input
                        type="text"
                        value={editValues[field.id] ?? field.value}
                        onChange={(e) => setEditValues({ ...editValues, [field.id]: e.target.value })}
                        className={inputClass}
                      />
                    )}
                    {field.helper && <p className="mt-1 text-xs text-foreground-secondary">{field.helper}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave("form", field.id)}
                        className="min-h-9 flex-1 bg-dark-premium px-3 text-xs text-white transition hover:bg-dark-premium/90"
                      >
                        Save
                      </button>
                      <button onClick={handleCancel} className="min-h-9 flex-1 border border-border-line px-3 text-xs text-foreground-secondary transition hover:border-premium-beige">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-medium uppercase tracking-[0.14em] text-foreground-secondary">{field.label}</span>
                      <button
                        onClick={() => handleEdit("form", field.id, field.value)}
                        className="inline-flex min-h-8 items-center gap-1.5 border border-border-line bg-white px-2 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                      >
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                    <p className="text-sm">{field.value}</p>
                    {field.helper && <p className="mt-1 text-xs text-foreground-secondary">{field.helper}</p>}
                  </>
                )}
              </div>
            ))}
          </div>
        </AdminPreviewCard>
      </div>

      {/* Preview Section */}
      <AdminFormSection
        title="Public Page Preview"
        description="View how contact info appears on the public contact page."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-border-line bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-premium-beige/10">
              <MessageCircle size={20} className="text-premium-beige" />
            </div>
            <div>
              <p className="text-xs text-foreground-secondary">{whatsappLabel}</p>
              <p className="font-medium">{whatsappNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border-line bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-premium-beige/10">
              <Instagram size={20} className="text-premium-beige" />
            </div>
            <div>
              <p className="text-xs text-foreground-secondary">{instagramLabel}</p>
              <p className="font-medium">{instagramUsername}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border-line bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-premium-beige/10">
              <Youtube size={20} className="text-premium-beige" />
            </div>
            <div>
              <p className="text-xs text-foreground-secondary">{youtubeLabel}</p>
              <p className="font-medium">{youtubeChannel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-border-line bg-white p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-premium-beige/10">
              <MapPin size={20} className="text-premium-beige" />
            </div>
            <div>
              <p className="text-xs text-foreground-secondary">{addressLabel}</p>
              <p className="font-medium truncate max-w-[150px]">{address}</p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <a
            href="/contact"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 border border-border-line bg-white px-5 text-sm transition hover:border-premium-beige hover:text-foreground"
          >
            <ExternalLink size={16} />
            Open Contact Page
          </a>
        </div>
      </AdminFormSection>

      {/* Inquiry Inbox Section */}
      <AdminFormSection
        title="Inquiry Inbox"
        description="Kelola inquiry dari form kontak."
        actions={
          <Link
            to="/admin/content/inquiries"
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border-line bg-white px-4 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
          >
            <ExternalLink size={14} />
            View All
          </Link>
        }
      >
        {/* Filter */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {["all", "new", "contacted", "converted", "archived"].map((status) => (
            <button
              key={status}
              onClick={() => setInquiryFilter(status)}
              className={`min-h-9 rounded-lg px-3 text-xs font-medium transition ${
                inquiryFilter === status
                  ? "bg-dark-premium text-white"
                  : "border border-border-line bg-white text-foreground-secondary hover:border-premium-beige hover:text-foreground"
              }`}
            >
              {status === "all" ? "Semua" : statusConfig[status as InquiryStatus]?.label}
              {status === "new" && inquiryStats.new > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
                  {inquiryStats.new}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Inquiry List */}
        {inquiriesLoading ? (
          <div className="py-8 text-center text-sm text-foreground-secondary">Loading...</div>
        ) : filteredInquiries.length === 0 ? (
          <div className="py-12 text-center">
            <Inbox size={40} className="mx-auto text-border-line" />
            <p className="mt-3 text-sm text-foreground-secondary">Belum ada inquiry</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInquiries.slice(0, 10).map((inquiry) => (
              <div
                key={inquiry.id}
                className="flex items-start justify-between gap-4 rounded-lg border border-border-line bg-white p-4 transition hover:border-premium-beige/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-medium">{inquiry.name}</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusConfig[inquiry.status].bg} ${statusConfig[inquiry.status].text}`}>
                      {statusConfig[inquiry.status].label}
                    </span>
                    {inquiry.serviceType && (
                      <span className="inline-block rounded bg-premium-beige/10 px-2 py-0.5 text-[10px] font-medium text-premium-beige">
                        {inquiry.serviceType}
                      </span>
                    )}
                  </div>
                  <div className="mb-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-secondary">
                    {inquiry.whatsapp && <span>{inquiry.whatsapp}</span>}
                    {inquiry.email && <span>{inquiry.email}</span>}
                    <span>{formatDate(inquiry.createdAt)}</span>
                  </div>
                  {inquiry.message && (
                    <p className="line-clamp-2 text-sm text-foreground-secondary">{inquiry.message}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  {inquiry.whatsapp && (
                    <a
                      href={getWhatsAppLink(inquiry.whatsapp, inquiry.message ? `Hi ${inquiry.name}, terima kasih sudah menghubungi Danivisual!` : undefined)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-9 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600"
                      title="Chat WhatsApp"
                    >
                      <Phone size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedInquiry(inquiry)}
                    className="inline-flex min-h-9 w-10 items-center justify-center rounded-lg border border-border-line text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                    title="Detail"
                  >
                    <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminFormSection>

      {/* Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-[0_18px_60px_rgba(40,28,16,0.15)]">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 border-b border-border-line bg-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-premium-beige">Detail Inquiry</p>
                  <h3 className="mt-1 text-xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                    {selectedInquiry.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="rounded-lg p-2 text-foreground-secondary hover:bg-premium-beige/10"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Status */}
              <div className="mb-4 flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusConfig[selectedInquiry.status].bg} ${statusConfig[selectedInquiry.status].text}`}>
                  {statusConfig[selectedInquiry.status].label}
                </span>
                <span className="text-xs text-foreground-secondary">{formatDate(selectedInquiry.createdAt)}</span>
              </div>

              {/* Contact Info */}
              <div className="mb-4 space-y-3 rounded-lg bg-background-soft p-4">
                {selectedInquiry.email && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">Email</p>
                    <p className="text-sm font-medium">{selectedInquiry.email}</p>
                  </div>
                )}
                {selectedInquiry.whatsapp && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">WhatsApp</p>
                    <p className="text-sm font-medium">{selectedInquiry.whatsapp}</p>
                  </div>
                )}
                {selectedInquiry.serviceType && (
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-foreground-secondary">Service Type</p>
                    <p className="text-sm font-medium">{selectedInquiry.serviceType}</p>
                  </div>
                )}
              </div>

              {/* Message */}
              {selectedInquiry.message && (
                <div className="mb-4">
                  <p className={labelClass}>Pesan</p>
                  <div className="rounded-lg border border-border-line bg-white p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedInquiry.message}</p>
                  </div>
                </div>
              )}

              {/* Status Actions */}
              <div className="space-y-3">
                <p className={labelClass}>Ubah Status</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleInquiryStatusChange(selectedInquiry.id, "contacted")}
                    disabled={selectedInquiry.status === "contacted"}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition ${
                      selectedInquiry.status === "contacted"
                        ? "bg-amber-50 text-amber-700"
                        : "border border-border-line bg-white text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                    }`}
                  >
                    <Phone size={12} /> Hubungi
                  </button>
                  <button
                    onClick={() => handleInquiryStatusChange(selectedInquiry.id, "converted")}
                    disabled={selectedInquiry.status === "converted"}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition ${
                      selectedInquiry.status === "converted"
                        ? "bg-emerald-50 text-emerald-700"
                        : "border border-border-line bg-white text-foreground-secondary hover:border-emerald-600 hover:border-emerald-200"
                    }`}
                  >
                    <UserCheck size={12} /> Konversi
                  </button>
                  <button
                    onClick={() => handleInquiryStatusChange(selectedInquiry.id, "archived")}
                    disabled={selectedInquiry.status === "archived"}
                    className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-medium transition ${
                      selectedInquiry.status === "archived"
                        ? "bg-gray-100 text-gray-700"
                        : "border border-border-line bg-white text-foreground-secondary hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <Archive size={12} /> Arsip
                  </button>
                  {selectedInquiry.whatsapp && (
                    <a
                      href={getWhatsAppLink(selectedInquiry.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 text-xs font-medium text-white transition hover:bg-emerald-600"
                    >
                      <Phone size={12} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border-line px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedInquiry(null)}
                  className="flex-1 inline-flex min-h-11 items-center justify-center rounded-lg border border-border-line bg-white px-4 text-sm font-medium text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
                >
                  Tutup
                </button>
                <button
                  onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                  className="flex-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-white px-4 text-sm font-medium text-destructive transition hover:bg-destructive/10"
                >
                  <Trash2 size={14} />
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}