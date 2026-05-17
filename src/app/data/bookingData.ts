import akadClose from "../../../asset/web/akad-close.jpg";
import couplePortrait from "../../../asset/web/couple-portrait.jpg";
import detailPortrait from "../../../asset/web/detail-portrait.jpg";
import heroRing from "../../../asset/web/hero-ring.jpg";
import outdoorCouple from "../../../asset/web/outdoor-couple.jpg";
import ringPortrait from "../../../asset/web/ring-portrait.jpg";

export type ServiceType = {
  id: string;
  name: "Foto" | "Foto + Video" | "Video Only";
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
  description: string;
  price: number;
  unit?: string;
  hasQuantity?: boolean;
};

const weddingSamples = [couplePortrait, akadClose, heroRing, detailPortrait, ringPortrait, outdoorCouple];

export const weddingPackages: PackageItem[] = [
  {
    id: "wedding-basic",
    categoryId: "wedding",
    name: "Wedding Basic",
    isMostSelected: false,
    price: 5000000,
    description: "Paket wedding ringkas untuk dokumentasi esensial yang tetap elegan.",
    benefits: [],
    serviceTypes: [
      {
        id: "basic-photo",
        name: "Foto",
        price: 5000000,
        includes: ["Dokumentasi foto wedding", "Edited photos", "Online preview", "Private client access"],
        sampleImages: weddingSamples.slice(0, 4),
        sampleVideoUrl: "",
      },
      {
        id: "basic-photo-video",
        name: "Foto + Video",
        price: 7500000,
        includes: ["Dokumentasi foto wedding", "Dokumentasi video", "Edited photos", "Highlight video", "Online preview"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
      {
        id: "basic-video",
        name: "Video Only",
        price: 4500000,
        includes: ["Dokumentasi video wedding", "Highlight video", "Online preview"],
        sampleImages: weddingSamples.slice(1, 4),
        sampleVideoUrl: "",
      },
    ],
  },
  {
    id: "wedding-premium",
    categoryId: "wedding",
    name: "Wedding Premium",
    isMostSelected: true,
    price: 8000000,
    description: "Pilihan paling seimbang untuk wedding full day dengan output lebih lengkap.",
    benefits: [],
    serviceTypes: [
      {
        id: "premium-photo",
        name: "Foto",
        price: 8000000,
        includes: ["Dokumentasi foto wedding", "Edited photos", "Album selection", "Online preview", "Private client access"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
      {
        id: "premium-photo-video",
        name: "Foto + Video",
        price: 11000000,
        includes: ["Dokumentasi foto wedding", "Dokumentasi video", "Edited photos", "Highlight video", "Album selection", "Online preview"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
      {
        id: "premium-video",
        name: "Video Only",
        price: 7000000,
        includes: ["Dokumentasi video wedding", "Highlight video", "Online preview"],
        sampleImages: weddingSamples.slice(1, 5),
        sampleVideoUrl: "",
      },
    ],
  },
  {
    id: "wedding-exclusive",
    categoryId: "wedding",
    name: "Wedding Exclusive",
    isMostSelected: false,
    price: 12000000,
    description: "Coverage premium untuk wedding besar dengan detail visual lebih matang.",
    benefits: [],
    serviceTypes: [
      {
        id: "exclusive-photo",
        name: "Foto",
        price: 12000000,
        includes: ["Dokumentasi foto wedding premium", "Edited photos", "Premium album selection", "Online preview", "Private client access"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
      {
        id: "exclusive-photo-video",
        name: "Foto + Video",
        price: 16000000,
        includes: ["Dokumentasi foto wedding premium", "Dokumentasi video premium", "Edited photos", "Cinematic highlight video", "Premium album selection", "Online preview"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
      {
        id: "exclusive-video",
        name: "Video Only",
        price: 10000000,
        includes: ["Dokumentasi video wedding premium", "Cinematic highlight video", "Online preview"],
        sampleImages: weddingSamples.slice(1),
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
  { id: "drone", categoryIds: ["wedding"], name: "Drone", description: "Aerial footage sesuai izin lokasi.", price: 1500000 },
  { id: "extra-hour", categoryIds: ["wedding"], name: "Tambahan jam dokumentasi", description: "Tambahan durasi dokumentasi per jam.", price: 500000, unit: "/ jam", hasQuantity: true },
  { id: "large-print", categoryIds: ["wedding"], name: "Cetak foto besar", description: "Cetak foto pilihan ukuran besar.", price: 350000 },
  { id: "extra-album", categoryIds: ["wedding"], name: "Extra album", description: "Album tambahan untuk keluarga.", price: 1200000 },
  { id: "premium-photobook", categoryIds: ["wedding"], name: "Photobook premium", description: "Photobook dengan finishing premium.", price: 1200000 },
  { id: "extra-videographer", categoryIds: ["wedding"], name: "Extra videographer", description: "Tambahan videografer untuk coverage lebih lengkap.", price: 1500000 },
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

export function findCategory(_categoryId?: string) {
  return packageCategories[0];
}

export function findPackage(packageId?: string) {
  return weddingPackages.find((item) => item.id === packageId);
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
