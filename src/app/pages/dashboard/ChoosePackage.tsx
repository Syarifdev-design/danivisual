import { Check, Plus, Minus, Camera, Video, Clock, Zap, Plane, BookImage, Image, Instagram, Usb, MapPin } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";

type Category = "wedding" | "prewed-studio" | "prewed-outdoor" | "event";

interface Package {
  name: string;
  price: string;
  category: string;
  features: string[];
  recommended?: boolean;
}

interface Addon {
  id: string;
  name: string;
  price: string;
  description: string;
  hasQuantity?: boolean;
  icon: any;
  color: string;
}

export default function ChoosePackage() {
  const [activeCategory, setActiveCategory] = useState<Category>("wedding");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: number }>({});

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

  const addons: Addon[] = [
    {
      id: "extra-photographer",
      name: "Tambahan Fotografer",
      price: "Rp 1.000.000",
      description: "Tambahan fotografer untuk coverage lebih luas.",
      icon: Camera,
      color: "blue",
    },
    {
      id: "extra-videographer",
      name: "Tambahan Videografer",
      price: "Rp 1.500.000",
      description: "Dokumentasi video tambahan untuk momen penting.",
      icon: Video,
      color: "red",
    },
    {
      id: "extra-hours",
      name: "Extra Hours",
      price: "Rp 500.000 / jam",
      description: "Tambahan durasi dokumentasi acara.",
      hasQuantity: true,
      icon: Clock,
      color: "amber",
    },
    {
      id: "same-day-edit",
      name: "Same Day Edit",
      price: "Rp 2.000.000",
      description: "Editing cepat untuk kebutuhan display di hari yang sama.",
      icon: Zap,
      color: "yellow",
    },
    {
      id: "drone",
      name: "Drone Documentation",
      price: "Rp 1.500.000",
      description: "Pengambilan visual udara untuk lokasi outdoor atau venue besar.",
      icon: Plane,
      color: "sky",
    },
    {
      id: "album-premium",
      name: "Album Cetak Premium",
      price: "Rp 1.200.000",
      description: "Album cetak premium dengan finishing elegan.",
      icon: BookImage,
      color: "purple",
    },
    {
      id: "print-large",
      name: "Cetak Foto Besar",
      price: "Rp 350.000",
      description: "Cetak foto ukuran besar untuk display atau kenangan.",
      icon: Image,
      color: "pink",
    },
    {
      id: "ig-reels",
      name: "Instagram Highlight Reels",
      price: "Rp 750.000",
      description: "Reels singkat untuk kebutuhan posting media sosial.",
      icon: Instagram,
      color: "fuchsia",
    },
    {
      id: "flashdisk",
      name: "Flashdisk Custom",
      price: "Rp 250.000",
      description: "Flashdisk custom berisi file pilihan.",
      icon: Usb,
      color: "green",
    },
    {
      id: "transport",
      name: "Transport Luar Kota",
      price: "Menunggu konfirmasi",
      description: "Biaya transport untuk lokasi di luar area utama.",
      icon: MapPin,
      color: "orange",
    },
  ];

  const toggleAddon = (addonId: string) => {
    setSelectedAddons((prev) => {
      const newAddons = { ...prev };
      if (newAddons[addonId]) {
        delete newAddons[addonId];
      } else {
        newAddons[addonId] = 1;
      }
      return newAddons;
    });
  };

  const updateQuantity = (addonId: string, delta: number) => {
    setSelectedAddons((prev) => {
      const current = prev[addonId] || 0;
      const newQuantity = Math.max(0, current + delta);
      if (newQuantity === 0) {
        const { [addonId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: newQuantity };
    });
  };

  const currentPackages = packages[activeCategory];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Pilih Paket Dokumentasi
        </h1>
        <p className="text-foreground-secondary mb-6">
          Pilih kategori layanan dan paket terbaik sesuai kebutuhan acara Anda.
        </p>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
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

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {currentPackages.map((pkg, index) => {
          const isSelected = selectedPackage?.name === pkg.name;

          // Color themes for each package tier
          const getColorTheme = () => {
            if (index === 0) {
              // Basic - Soft Blue
              return {
                border: isSelected ? "border-blue-400 ring-2 ring-blue-400/20" : "border-blue-200",
                badge: "bg-blue-50 text-blue-600",
                accent: "from-blue-50 to-white",
                icon: "text-blue-500",
                button: "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              };
            } else if (index === 1) {
              // Premium - Gold/Amber
              return {
                border: isSelected ? "border-amber-400 ring-2 ring-amber-400/20" : "border-amber-300",
                badge: "bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700",
                accent: "from-amber-50 via-yellow-50 to-white",
                icon: "text-amber-500",
                button: "bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
              };
            } else {
              // Deluxe - Purple/Indigo
              return {
                border: isSelected ? "border-purple-400 ring-2 ring-purple-400/20" : "border-purple-300",
                badge: "bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700",
                accent: "from-purple-50 via-indigo-50 to-white",
                icon: "text-purple-500",
                button: "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              };
            }
          };

          const theme = getColorTheme();

          return (
            <div
              key={index}
              className={`bg-gradient-to-b ${theme.accent} border-2 ${theme.border} rounded-sm p-6 transition-all hover:shadow-xl flex flex-col ${
                isSelected ? "shadow-lg" : ""
              }`}
            >
              {/* Header with badges */}
              <div className="mb-4">
                <span className="text-xs uppercase tracking-widest text-foreground-secondary">
                  {pkg.category}
                </span>
                {pkg.recommended && (
                  <span className={`inline-block ml-2 px-3 py-1 ${theme.badge} text-xs font-medium rounded-full`}>
                    Most Selected
                  </span>
                )}
                {isSelected && (
                  <span className="inline-block ml-2 px-3 py-1 bg-dark-premium text-white text-xs font-medium rounded-full">
                    Selected
                  </span>
                )}
              </div>

              {/* Package name */}
              <h3 className="text-2xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
                {pkg.name}
              </h3>

              {/* Price */}
              <p className="text-3xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                {pkg.price}
              </p>

              <div className="w-full h-[1px] bg-border-line mb-6" />

              {/* Features - flex-grow to push button to bottom */}
              <ul className="space-y-3 mb-6 flex-grow">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check size={16} className={`${theme.icon} shrink-0 mt-0.5`} />
                    <span className="text-foreground-secondary">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Button - always at bottom */}
              <div className="mt-auto">
                <button
                  onClick={() => setSelectedPackage(pkg)}
                  className={`block w-full text-center px-6 py-3 transition-all rounded-sm text-sm font-medium text-white shadow-md hover:shadow-lg ${
                    isSelected
                      ? `${theme.button} cursor-default opacity-90`
                      : theme.button
                  }`}
                >
                  {isSelected ? "✓ Paket Dipilih" : "Pilih Paket Ini"}
                </button>
                <p className="text-xs text-foreground-secondary text-center mt-3">
                  Termasuk akses dashboard pribadi
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add-ons Section */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-2xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Tambahan Opsional
          </h2>
          <p className="text-foreground-secondary">
            Pilih kebutuhan tambahan di luar paket utama sesuai kebutuhan acara Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {addons.map((addon) => {
            const isChecked = selectedAddons[addon.id] !== undefined;
            const quantity = selectedAddons[addon.id] || 0;
            const Icon = addon.icon;

            // Color theme mapping
            const colorThemes: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
              blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", iconBg: "bg-gradient-to-br from-blue-400 to-blue-600" },
              red: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", iconBg: "bg-gradient-to-br from-red-400 to-red-600" },
              amber: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", iconBg: "bg-gradient-to-br from-amber-400 to-amber-600" },
              yellow: { bg: "bg-yellow-50", text: "text-yellow-600", border: "border-yellow-200", iconBg: "bg-gradient-to-br from-yellow-400 to-yellow-600" },
              sky: { bg: "bg-sky-50", text: "text-sky-600", border: "border-sky-200", iconBg: "bg-gradient-to-br from-sky-400 to-sky-600" },
              purple: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200", iconBg: "bg-gradient-to-br from-purple-400 to-purple-600" },
              pink: { bg: "bg-pink-50", text: "text-pink-600", border: "border-pink-200", iconBg: "bg-gradient-to-br from-pink-400 to-pink-600" },
              fuchsia: { bg: "bg-fuchsia-50", text: "text-fuchsia-600", border: "border-fuchsia-200", iconBg: "bg-gradient-to-br from-fuchsia-400 to-fuchsia-600" },
              green: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200", iconBg: "bg-gradient-to-br from-green-400 to-green-600" },
              orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", iconBg: "bg-gradient-to-br from-orange-400 to-orange-600" },
            };

            const theme = colorThemes[addon.color] || colorThemes.blue;

            return (
              <div
                key={addon.id}
                className={`bg-white border-2 rounded-sm p-5 transition-all hover:shadow-lg ${
                  isChecked ? `${theme.border} ${theme.bg}` : "border-border-line hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`shrink-0 w-12 h-12 ${theme.iconBg} rounded-lg flex items-center justify-center shadow-md`}>
                    <Icon size={24} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleAddon(addon.id)}
                        className="mt-1 rounded accent-dark-premium"
                      />
                      <h4 className="font-medium text-sm leading-tight">{addon.name}</h4>
                    </div>
                    <p className="text-xs text-foreground-secondary mb-2 leading-relaxed">{addon.description}</p>
                    <p className={`text-sm font-semibold ${theme.text}`}>{addon.price}</p>
                  </div>
                </div>

                {addon.hasQuantity && isChecked && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border-line">
                    <span className="text-xs font-medium text-foreground-secondary">Quantity:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(addon.id, -1)}
                        className={`w-8 h-8 border-2 ${theme.border} rounded-md flex items-center justify-center ${theme.bg} ${theme.text} hover:shadow-md transition-all`}
                      >
                        <Minus size={16} />
                      </button>
                      <span className={`w-10 text-center font-bold text-base ${theme.text}`}>{quantity}</span>
                      <button
                        onClick={() => updateQuantity(addon.id, 1)}
                        className={`w-8 h-8 border-2 ${theme.border} rounded-md flex items-center justify-center ${theme.bg} ${theme.text} hover:shadow-md transition-all`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Card */}
      <div className="bg-white border border-border-line rounded-sm p-8">
        <h3 className="text-xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
          Ringkasan Pilihan
        </h3>
        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-start">
            <span className="text-sm text-foreground-secondary">Kategori</span>
            <span className="text-sm font-medium capitalize">{activeCategory.replace("-", " ")}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-foreground-secondary">Paket Dipilih</span>
            <span className="text-sm font-medium">{selectedPackage?.name || "-"}</span>
          </div>
          <div className="flex justify-between items-start">
            <span className="text-sm text-foreground-secondary">Harga Paket</span>
            <span className="text-sm font-medium">{selectedPackage?.price || "-"}</span>
          </div>
          <div className="w-full h-[1px] bg-border-line" />
          <div className="flex justify-between items-start">
            <span className="text-sm text-foreground-secondary">Add-ons Terpilih</span>
            <span className="text-sm font-medium">{Object.keys(selectedAddons).length} item</span>
          </div>
          <div className="w-full h-[1px] bg-border-line" />
          <div className="flex justify-between items-start">
            <span className="text-sm font-medium">Estimasi Total</span>
            <span className="text-lg font-medium" style={{ fontFamily: "var(--font-heading)" }}>
              Lihat di checkout
            </span>
          </div>
        </div>
        <Link
          to={selectedPackage ? "/dashboard/checkout" : "#"}
          className={`block w-full text-center px-6 py-4 transition-all rounded-sm text-sm font-medium ${
            selectedPackage
              ? "bg-dark-premium text-white hover:bg-dark-premium/90"
              : "bg-muted text-foreground-secondary cursor-not-allowed"
          }`}
          onClick={(e) => !selectedPackage && e.preventDefault()}
        >
          {selectedPackage ? "Lanjut ke Checkout" : "Pilih paket terlebih dahulu"}
        </Link>
      </div>
    </div>
  );
}
