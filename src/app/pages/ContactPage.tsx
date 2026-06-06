import { MapPin, MessageCircle, Instagram, Youtube, Check, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { useState, FormEvent } from "react";
import PageIntro from "../components/PageIntro";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";
import { createInquiry } from "../../services/inquiryService";

// Helper to convert phone number format for WhatsApp URL
const formatPhoneForWhatsApp = (phone: string): string => {
  // Remove any non-digit characters
  const digits = phone.replace(/\D/g, "");
  // If starts with 0, replace with 62
  if (digits.startsWith("0")) {
    return "62" + digits.slice(1);
  }
  // If starts with 62, keep as is
  if (digits.startsWith("62")) {
    return digits;
  }
  // Otherwise just return
  return digits;
};

// Helper to generate WhatsApp URL
const getWhatsAppUrl = (phone: string): string => {
  const formatted = formatPhoneForWhatsApp(phone);
  return `https://wa.me/${formatted}`;
};

// Helper to generate Instagram URL
const getInstagramUrl = (username: string): string => {
  // Remove @ if present
  const cleanUsername = username.replace("@", "").trim();
  return `https://www.instagram.com/${cleanUsername}`;
};

// Helper to generate YouTube URL
const getYouTubeUrl = (channel: string): string => {
  // Remove @ if present
  const cleanChannel = channel.replace("@", "").trim();
  return `https://www.youtube.com/@${cleanChannel}`;
};

// Default service options
const DEFAULT_SERVICE_OPTIONS = [
  "Wedding",
  "Prewedding",
  "Event",
  "Studio",
  "Lainnya",
];

export default function ContactPage() {
  const { t, language } = useLanguage();
  const { getField } = useContent();

  // Contact Information
  const whatsappLabel = getField("contact", "info", "whatsapp_label", "WhatsApp");
  const whatsappNumber = getField("contact", "info", "whatsapp_number", "082337279636");
  const whatsappUrl = getWhatsAppUrl(whatsappNumber);

  const instagramLabel = getField("contact", "info", "instagram_label", "Instagram");
  const instagramUsername = getField("contact", "info", "instagram_username", "@danivisual.photo");
  const instagramUrl = getInstagramUrl(instagramUsername);

  const youtubeLabel = getField("contact", "info", "youtube_label", "YouTube");
  const youtubeChannel = getField("contact", "info", "youtube_channel", "DANIVISUAL OFFICIAL");
  const youtubeUrl = getYouTubeUrl(youtubeChannel);

  const addressLabel = getField(
    "contact",
    "info",
    "address_label",
    language === "ID" ? "Alamat Studio" : "Studio Address"
  );
  const address = getField(
    "contact",
    "info",
    "address",
    "Utara lapangan, Mudah, Ngadirejan, Kec. Pringkuku, Kabupaten Pacitan, Jawa Timur 63552"
  );
  const mapsUrl = getField(
    "contact",
    "info",
    "maps_url",
    "https://maps.app.goo.gl/iUyGZ5zmFTDUFQ5z5"
  );

  // Form Labels
  const formTitle = getField("contact", "form", "title", t({ ID: "Kirim Inquiry", EN: "Send an Inquiry" }));
  const namePlaceholder = getField("contact", "form", "name_placeholder", t({ ID: "Nama", EN: "Name" }));
  const emailPlaceholder = getField("contact", "form", "email_placeholder", "Email");
  const whatsappPlaceholder = getField("contact", "form", "whatsapp_placeholder", "WhatsApp");
  const serviceTypePlaceholder = getField(
    "contact",
    "form",
    "service_type_placeholder",
    t({ ID: "Jenis Layanan", EN: "Service Type" })
  );
  const messagePlaceholder = getField(
    "contact",
    "form",
    "message_placeholder",
    t({ ID: "Ceritakan rencana Anda", EN: "Tell us about your plans" })
  );
  const submitButton = getField(
    "contact",
    "form",
    "submit_button",
    t({ ID: "Kirim Inquiry", EN: "Submit Inquiry" })
  );
  const packagesButton = getField(
    "contact",
    "form",
    "packages_button",
    t({ ID: "Lihat Semua Paket", EN: "View All Packages" })
  );

  // Service options from content or fallback
  const serviceOptionsRaw = getField("contact", "form", "service_options", "");
  const serviceOptions = serviceOptionsRaw
    ? serviceOptionsRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : DEFAULT_SERVICE_OPTIONS;

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp: "",
    serviceType: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Handle input change
  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    setSubmitError("");
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.name.trim()) {
      setSubmitError(t({ ID: "Nama wajib diisi", EN: "Name is required" }));
      return;
    }

    // WhatsApp OR email at least one required
    if (!formData.whatsapp.trim() && !formData.email.trim()) {
      setSubmitError(t({ ID: "WhatsApp atau Email wajib diisi minimal salah satu", EN: "WhatsApp or Email is required (at least one)" }));
      return;
    }

    // Validate email format if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setSubmitError(t({ ID: "Format email tidak valid", EN: "Invalid email format" }));
        return;
      }
    }

    // Validate WhatsApp format if provided (basic check for digits)
    if (formData.whatsapp.trim()) {
      const digitsOnly = formData.whatsapp.replace(/\D/g, "");
      if (digitsOnly.length < 8) {
        setSubmitError(t({ ID: "Nomor WhatsApp terlalu pendek", EN: "WhatsApp number is too short" }));
        return;
      }
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const result = await createInquiry({
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        whatsapp: formData.whatsapp.trim() || undefined,
        serviceType: formData.serviceType || undefined,
        message: formData.message.trim() || undefined,
      });

      if (result) {
        // Reset form and show success
        setFormData({ name: "", email: "", whatsapp: "", serviceType: "", message: "" });
        setSubmitSuccess(true);
        window.setTimeout(() => setSubmitSuccess(false), 6000);
      } else {
        setSubmitError(t({ ID: "Gagal mengirim inquiry. Silakan coba lagi.", EN: "Failed to submit inquiry. Please try again." }));
      }
    } catch (err) {
      console.error("Failed to submit inquiry:", err);
      setSubmitError(t({ ID: "Terjadi kesalahan. Silakan coba lagi.", EN: "An error occurred. Please try again." }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow={getField("contact", "intro", "eyebrow", t({ ID: "Mulai Percakapan", EN: "Start the Conversation" }))}
        title={getField("contact", "intro", "title", t({ ID: "Konsultasi dengan Tim Kami", EN: "Connect with Our Team" }))}
        description={getField("contact", "intro", "description", t({
          ID: "Ceritakan rencana wedding, prewedding, atau event Anda. Kami akan membantu menyusun kebutuhan visual sejak awal dengan arahan yang jelas dan elegan.",
          EN: "Share your wedding, prewedding, or event plans with us. Our team will help shape a clear, elegant visual direction from the very first conversation.",
        }))}
      />

      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Left Column - Contact Info */}
          <div>
            <h2 className="text-3xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              {t({ ID: "Informasi Kontak", EN: "Contact Information" })}
            </h2>
            <div className="space-y-6">
              {/* WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 bg-white border border-border-line rounded-sm hover:shadow-lg transition"
              >
                <MessageCircle className="text-premium-beige mt-1 shrink-0" size={24} />
                <div>
                  <h3 className="font-medium mb-1">{whatsappLabel}</h3>
                  <p className="text-sm text-foreground-secondary">{whatsappNumber}</p>
                </div>
              </a>

              {/* Instagram */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 bg-white border border-border-line rounded-sm hover:shadow-lg transition"
              >
                <Instagram className="text-premium-beige mt-1 shrink-0" size={24} />
                <div>
                  <h3 className="font-medium mb-1">{instagramLabel}</h3>
                  <p className="text-sm text-foreground-secondary">{instagramUsername}</p>
                </div>
              </a>

              {/* YouTube */}
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 bg-white border border-border-line rounded-sm hover:shadow-lg transition"
              >
                <Youtube className="text-premium-beige mt-1 shrink-0" size={24} />
                <div>
                  <h3 className="font-medium mb-1">{youtubeLabel}</h3>
                  <p className="text-sm text-foreground-secondary">{youtubeChannel}</p>
                </div>
              </a>

              {/* Address */}
              <div className="flex items-start gap-4 p-6 bg-white border border-border-line rounded-sm">
                <MapPin className="text-premium-beige mt-1 shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{addressLabel}</h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    {address}
                  </p>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-premium-beige/10 text-premium-beige hover:bg-premium-beige hover:text-white transition-all rounded-sm text-sm font-medium"
                  >
                    <MapPin size={16} />
                    {t({ ID: "Lihat di Google Maps", EN: "Open in Google Maps" })}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <h2 className="text-3xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              {formTitle}
            </h2>

            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
                <Check size={18} />
                <span>{t({ ID: "Inquiry berhasil dikirim! Kami akan segera menghubungi Anda.", EN: "Inquiry submitted successfully! We'll contact you soon." })}</span>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <input
                type="text"
                placeholder={namePlaceholder}
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />

              {/* Email */}
              <input
                type="email"
                placeholder={emailPlaceholder}
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />

              {/* WhatsApp */}
              <input
                type="text"
                placeholder={whatsappPlaceholder}
                value={formData.whatsapp}
                onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                required
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />

              {/* Service Type */}
              <select
                value={formData.serviceType}
                onChange={(e) => handleInputChange("serviceType", e.target.value)}
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              >
                <option value="">{serviceTypePlaceholder}</option>
                {serviceOptions.map((option, index) => (
                  <option key={index} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              {/* Message */}
              <textarea
                placeholder={messagePlaceholder}
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              ></textarea>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  submitButton
                )}
              </button>
            </form>

            {/* Alternative Action */}
            <div className="mt-6">
              <p className="text-sm text-foreground-secondary text-center mb-4">{t({ ID: "atau", EN: "or" })}</p>
              <Link
                to="/packages"
                className="w-full px-6 py-3 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm flex items-center justify-center"
              >
                {packagesButton}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}