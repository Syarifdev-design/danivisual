import akadClose from "../../../asset/web/akad-close.jpg";
import couplePortrait from "../../../asset/web/couple-portrait.jpg";
import detailPortrait from "../../../asset/web/detail-portrait.jpg";
import heroRing from "../../../asset/web/hero-ring.jpg";
import outdoorCouple from "../../../asset/web/outdoor-couple.jpg";
import ringPortrait from "../../../asset/web/ring-portrait.jpg";

export type ServiceType = {
  id: string;
  name: "Photo" | "Video" | "Photo + Video";
  price: number;
  includes: string[];
  sampleImages: string[];
  sampleVideoUrl: string;
};

export type PackageItem = {
  id: string;
  categoryId: "wedding";
  name: string;
  isMostSelected?: boolean;
  startingPrice: number;
  price: number;
  description: string;
  benefits: string[];
  serviceTypes: ServiceType[];
};

export type PackageCategory = {
  id: "wedding";
  name: string;
  packages: PackageItem[];
};

export type Addon = {
  id: string;
  categoryIds: string[];
  name: string;
  description?: string;
  price: number;
  displayPrice: string;
  unit?: string;
  hasQuantity?: boolean;
};

const weddingSamples = [couplePortrait, akadClose, heroRing, detailPortrait, ringPortrait, outdoorCouple];

export const weddingPackages: PackageItem[] = [
  {
    id: "basic",
    categoryId: "wedding",
    name: "Wedding Basic",
    isMostSelected: false,
    startingPrice: 1900000,
    price: 1900000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "basic-photo",
        name: "Photo",
        price: 1900000,
        includes: ["150+ foto edited", "Album magnetic premium", "80 foto print 4R", "Print 12R + frame", "Link Google Drive"],
        sampleImages: weddingSamples.slice(0, 4),
        sampleVideoUrl: "",
      },
      {
        id: "basic-video",
        name: "Video",
        price: 2000000,
        includes: ["Video 2 menit full highlights", "Video 1 menit IG highlights"],
        sampleImages: weddingSamples.slice(1, 4),
        sampleVideoUrl: "",
      },
      {
        id: "basic-photo-video",
        name: "Photo + Video",
        price: 3800000,
        includes: ["200+ foto edited", "Album magnetic premium", "Print 12R + frame", "100 foto print 4R", "Video 2 menit full highlights", "Video 1 menit IG highlights", "Link Google Drive"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
    ],
  },
  {
    id: "premium",
    categoryId: "wedding",
    name: "Wedding Premium",
    isMostSelected: true,
    startingPrice: 2400000,
    price: 2400000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "premium-photo",
        name: "Photo",
        price: 2400000,
        includes: ["200+ foto edited", "Photobook premium", "Print 12R + frame", "Flashdisk"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
      {
        id: "premium-video",
        name: "Video",
        price: 3000000,
        includes: ["Video 3 menit full highlights", "Video 1 menit IG highlights"],
        sampleImages: weddingSamples.slice(1, 5),
        sampleVideoUrl: "",
      },
      {
        id: "premium-photo-video",
        name: "Photo + Video",
        price: 4400000,
        includes: ["200+ foto edited", "Photobook premium", "Print 12R + frame", "Video 3 menit full highlights", "Video 1 menit IG highlights", "Link Google Drive"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
    ],
  },
  {
    id: "exclusive",
    categoryId: "wedding",
    name: "Wedding Exclusive",
    isMostSelected: false,
    startingPrice: 3300000,
    price: 3300000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "exclusive-photo",
        name: "Photo",
        price: 3300000,
        includes: ["250+ foto edited", "Photobook premium", "Print 12R + frame", "Print 16R + frame", "Flashdisk"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
      {
        id: "exclusive-video",
        name: "Video",
        price: 4000000,
        includes: ["Video 4 menit full highlights", "Video 1 menit IG highlights", "SDE"],
        sampleImages: weddingSamples.slice(1),
        sampleVideoUrl: "",
      },
      {
        id: "exclusive-photo-video",
        name: "Photo + Video",
        price: 5000000,
        includes: ["250+ foto edited", "Photobook premium", "Album foto keluarga premium", "Print 16R + frame", "Video 4 menit full highlights", "Video 1 menit IG highlights", "Flashdisk"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
    ],
  },
];

export const packageCategories: PackageCategory[] = [
  {
    id: "wedding",
    name: "Wedding",
    packages: weddingPackages,
  },
];

export const addons: Addon[] = [
  { id: "album-magnetic-100-4r", categoryIds: ["wedding"], name: "Album magnetic, 100 foto print 4R", price: 450000, displayPrice: "450k" },
  { id: "photobook-premium", categoryIds: ["wedding"], name: "Photobook premium", price: 1000000, displayPrice: "1 jt" },
  { id: "extra-day", categoryIds: ["wedding"], name: "Extra day", price: 1200000, displayPrice: "1,2 jt", unit: "hari", hasQuantity: true },
  { id: "add-session-photo", categoryIds: ["wedding"], name: "Add session photo / jam", price: 150000, displayPrice: "150k", unit: "jam", hasQuantity: true },
  { id: "add-session-video", categoryIds: ["wedding"], name: "Add session video / jam", price: 250000, displayPrice: "250k", unit: "jam", hasQuantity: true },
  { id: "print-12r-frame", categoryIds: ["wedding"], name: "Print 12R + frame", price: 150000, displayPrice: "150k" },
  { id: "print-16r-frame", categoryIds: ["wedding"], name: "Print 16R + frame", price: 250000, displayPrice: "250k" },
  { id: "drone-pilot", categoryIds: ["wedding"], name: "Drone + pilot", price: 400000, displayPrice: "400k" },
  { id: "flashdisk", categoryIds: ["wedding"], name: "Flashdisk", price: 100000, displayPrice: "100k" },
  { id: "file-mentah-video", categoryIds: ["wedding"], name: "File mentah video", price: 250000, displayPrice: "250k" },
  { id: "mini-studio", categoryIds: ["wedding"], name: "Mini studio", price: 550000, displayPrice: "550k" },
];

export const DP_AMOUNT = 500000;
export const PACKING_FEE = 35000;
export const ADMIN_WHATSAPP = "62xxxxxxxxxxx";
export const BANK_ACCOUNT_NUMBER = "645201020316531";
export const BANK_ACCOUNT_NAME = "DANI INDRA FIRMANSYAH";
export const BANK_NAME = "BRI";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatShortPrice(value: number) {
  if (value >= 1000000) {
    const millions = value / 1000000;
    const formatted = Number.isInteger(millions) ? String(millions) : millions.toFixed(1).replace(".", ",");
    return `${formatted} jt`;
  }

  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }

  return String(value);
}

export function findCategory(_categoryId?: string) {
  return packageCategories[0];
}

export function findPackage(packageId?: string) {
  const legacyMap: Record<string, string> = {
    "wedding-basic": "basic",
    "wedding-premium": "premium",
    "wedding-exclusive": "exclusive",
  };
  return weddingPackages.find((item) => item.id === (packageId ? legacyMap[packageId] || packageId : packageId));
}

export function findServiceType(serviceTypeId?: string) {
  return weddingPackages.flatMap((item) => item.serviceTypes).find((item) => item.id === serviceTypeId);
}

export function findAddon(addonId: string) {
  return addons.find((addon) => addon.id === addonId);
}

export function buildWhatsappLink(orderNumber: string, intent: string) {
  const text = `Halo Admin, saya ingin melakukan perubahan pada booking saya dengan nomor order ${orderNumber}. Saya ingin ${intent}. Mohon bantuannya.`;
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export function buildPaymentWhatsappLink() {
  const text = "Halo Admin, saya ingin konfirmasi pembayaran DP booking Danivisual.";
  return `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(text)}`;
}
