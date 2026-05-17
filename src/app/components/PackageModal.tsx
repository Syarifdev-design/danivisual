import { X, Check, ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: "wedding" | "prewed-studio" | "prewed-outdoor" | "event";
}

type Category = "wedding" | "prewed-studio" | "prewed-outdoor" | "event";

interface Package {
  name: string;
  price: string;
  category: string;
  features: string[];
  recommended?: boolean;
}

export default function PackageModal({ isOpen, onClose, initialCategory = "wedding" }: PackageModalProps) {
  const [activeCategory, setActiveCategory] = useState<Category>(initialCategory);

  if (!isOpen) return null;

  const categories = [
    { id: "wedding" as Category, label: "Wedding" },
    { id: "prewed-studio" as Category, label: "Prewed Studio" },
    { id: "prewed-outdoor" as Category, label: "Prewed Outdoor" },
    { id: "event" as Category, label: "Event" },
  ];

  const packages: Record<Category, Package[]> = {
    wedding: [
      {
        name: "Wedding Basic",
        price: "Rp 5.000.000",
        category: "Wedding",
        features: ["6 hours coverage", "1 fotografer", "200 edited photos", "Online gallery", "H+2 story photos", "Private dashboard"],
      },
      {
        name: "Wedding Premium",
        price: "Rp 8.000.000",
        category: "Wedding",
        features: ["Full day coverage", "2 fotografer", "500 edited photos", "Online gallery", "H+2 story photos", "Album cetak", "Private dashboard"],
        recommended: true,
      },
      {
        name: "Wedding Deluxe",
        price: "Rp 12.000.000",
        category: "Wedding",
        features: ["Full day coverage", "3 fotografer", "Unlimited edited photos", "Online gallery", "H+2 story photos", "Album cetak premium", "Drone documentation", "Private dashboard"],
      },
    ],
    "prewed-studio": [
      {
        name: "Studio Basic",
        price: "Rp 2.500.000",
        category: "Prewed Studio",
        features: ["2 hours studio session", "1 konsep foto", "1 fotografer", "50 edited photos", "Online gallery", "Private dashboard"],
      },
      {
        name: "Studio Premium",
        price: "Rp 4.000.000",
        category: "Prewed Studio",
        features: ["4 hours studio session", "2 konsep foto", "1 fotografer", "100 edited photos", "Lighting setup", "Online gallery", "Private dashboard"],
        recommended: true,
      },
      {
        name: "Studio Deluxe",
        price: "Rp 6.000.000",
        category: "Prewed Studio",
        features: ["Full studio session", "3 konsep foto", "2 fotografer", "150 edited photos", "Premium lighting setup", "Album mini", "Online gallery", "Private dashboard"],
      },
    ],
    "prewed-outdoor": [
      {
        name: "Outdoor Basic",
        price: "Rp 3.500.000",
        category: "Prewed Outdoor",
        features: ["1 lokasi outdoor", "3 hours session", "1 fotografer", "80 edited photos", "Online gallery", "Private dashboard"],
      },
      {
        name: "Outdoor Premium",
        price: "Rp 5.500.000",
        category: "Prewed Outdoor",
        features: ["2 lokasi outdoor", "5 hours session", "2 fotografer", "150 edited photos", "Moodboard direction", "Online gallery", "Private dashboard"],
        recommended: true,
      },
      {
        name: "Outdoor Deluxe",
        price: "Rp 8.000.000",
        category: "Prewed Outdoor",
        features: ["3 lokasi outdoor", "Full day session", "2 fotografer", "250 edited photos", "Concept direction", "Drone documentation", "Album cetak", "Private dashboard"],
      },
    ],
    event: [
      {
        name: "Event Basic",
        price: "Rp 3.000.000",
        category: "Event",
        features: ["4 hours coverage", "1 fotografer", "150 edited photos", "Online gallery", "H+2 highlight photos", "Private dashboard"],
      },
      {
        name: "Event Premium",
        price: "Rp 5.000.000",
        category: "Event",
        features: ["6 hours coverage", "2 fotografer", "300 edited photos", "Online gallery", "H+2 highlight photos", "Private dashboard"],
        recommended: true,
      },
      {
        name: "Event Deluxe",
        price: "Rp 8.500.000",
        category: "Event",
        features: ["Full event coverage", "2 fotografer", "1 videografer", "500 edited photos", "Highlight video", "Online gallery", "Private dashboard"],
      },
    ],
  };

  const currentPackages = packages[activeCategory];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto p-4">
        <div className="flex min-h-full items-center justify-center">
          <div
            className="relative bg-white rounded-sm w-full max-w-6xl shadow-2xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Fixed */}
            <div className="shrink-0 bg-white border-b border-border-line px-6 lg:px-8 py-6 rounded-t-sm">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl lg:text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                    Pilih Paket Dokumentasi
                  </h2>
                  <p className="text-sm lg:text-base text-foreground-secondary">
                    Pilih kategori dan paket terbaik untuk momen istimewa Anda
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-background-soft rounded-sm transition shrink-0"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Category Tabs */}
              <div className="flex flex-wrap gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                      activeCategory === cat.id
                        ? "bg-dark-premium text-white"
                        : "bg-white border border-border-line text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {currentPackages.map((pkg, index) => (
                <div
                  key={index}
                  className={`bg-white border rounded-sm p-6 transition-all hover:shadow-xl ${
                    pkg.recommended
                      ? "border-premium-beige ring-2 ring-premium-beige/20"
                      : "border-border-line"
                  }`}
                >
                  {/* Category & Badge */}
                  <div className="flex items-center flex-wrap gap-2 mb-4">
                    <span className="text-xs uppercase tracking-widest text-foreground-secondary">
                      {pkg.category}
                    </span>
                    {pkg.recommended && (
                      <span className="px-3 py-1 bg-premium-beige/20 text-premium-beige text-xs font-medium rounded-full">
                        Most Selected
                      </span>
                    )}
                  </div>

                  {/* Package Name */}
                  <h3 className="text-xl lg:text-2xl mb-3 min-h-[3.5rem]" style={{ fontFamily: "var(--font-heading)" }}>
                    {pkg.name}
                  </h3>

                  {/* Price */}
                  <p className="text-2xl lg:text-3xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                    {pkg.price}
                  </p>

                  <div className="w-full h-[1px] bg-border-line mb-6" />

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-premium-beige shrink-0 mt-0.5" />
                        <span className="text-foreground-secondary leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Footer Note */}
                  <p className="text-xs text-foreground-secondary text-center pt-4 border-t border-border-line">
                    Termasuk akses dashboard pribadi
                  </p>
                </div>
              ))}
            </div>

            {/* CTA Section */}
            <div className="bg-background-soft border border-border-line rounded-sm p-8 text-center">
              <h3 className="text-2xl mb-3" style={{ fontFamily: "var(--font-heading)" }}>
                Siap Untuk Booking?
              </h3>
              <p className="text-foreground-secondary mb-6 max-w-2xl mx-auto">
                Login atau daftar untuk memilih paket, mengisi data acara, dan melakukan
                pembayaran awal. Atau hubungi admin kami untuk konsultasi lebih lanjut.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link
                  to="/login"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm font-medium"
                >
                  Login & Book Now
                  <ArrowRight size={18} />
                </Link>
                <a
                  href="https://wa.me/6282337279636"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-8 py-4 border border-border-line text-foreground hover:bg-white transition-all rounded-sm text-sm font-medium"
                >
                  Chat Admin
                </a>
                <Link
                  to="/contact"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 px-8 py-4 border border-border-line text-foreground hover:bg-white transition-all rounded-sm text-sm font-medium"
                >
                  Make an Inquiry
                </Link>
              </div>
            </div>
          </div>

          {/* Footer - Fixed */}
          <div className="shrink-0 border-t border-border-line px-6 lg:px-8 py-4 bg-background-soft rounded-b-sm">
            <p className="text-xs lg:text-sm text-foreground-secondary text-center">
              DP awal Rp 500.000 untuk mengamankan tanggal acara • Pelunasan H+2 setelah acara •{" "}
              <Link to="/faq" onClick={onClose} className="text-premium-beige hover:underline">
                Lihat FAQ
              </Link>
            </p>
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
