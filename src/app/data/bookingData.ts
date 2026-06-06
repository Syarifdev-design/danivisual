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

export type PackageCategoryId = string;

export type PackageItem = {
  id: string;
  categoryId: PackageCategoryId;
  name: string;
  isMostSelected?: boolean;
  startingPrice: number;
  price: number;
  description: string;
  benefits: string[];
  serviceTypes: ServiceType[];
};

export type PackageCategory = {
  id: PackageCategoryId;
  name: string;
  eyebrow: string;
  note?: string;
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

const nineHourNote = "All time packages are limited to a max. of 9 working hours";
const weddingNote = "All time packages are limited to a max. of 9 working hours (Akad - Reception)";
const fourHourNote = "All time packages are limited to a max. of 4 working hours";
const oneHourNote = "All time packages are limited to a max. of 1 working hour";
const sixHourNote = "All time packages are limited to a max. of 6 working hours";

const weddingPackages: PackageItem[] = [
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
        includes: ["150+ photo edited", "Album magnetic (premium)", "80 foto print 4R", "Print 12R + Frame", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 4),
        sampleVideoUrl: "",
      },
      {
        id: "basic-video",
        name: "Video",
        price: 2000000,
        includes: ["2 min. full highlights", "1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 4),
        sampleVideoUrl: "",
      },
      {
        id: "basic-photo-video",
        name: "Photo + Video",
        price: 3800000,
        includes: ["200+ photo edited", "Album magnetic (premium)", "Print 12R + Frame", "100 foto print 4R", "Video 2 min. full highlights", "Video 1 min. IG highlights", "Link g drive"],
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
        includes: ["200+ foto edited", "Photobook (premium)", "Print 12R + Frame", "Flashdisk"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
      {
        id: "premium-video",
        name: "Video",
        price: 3000000,
        includes: ["3 min. full highlights", "1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 5),
        sampleVideoUrl: "",
      },
      {
        id: "premium-photo-video",
        name: "Photo + Video",
        price: 4400000,
        includes: ["200+ photo edited", "Photobook (premium)", "Print 12R + Frame", "Video 3 min. full highlights", "Video 1 min. IG highlights", "Link g drive"],
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
        includes: ["250+ foto edited", "Photobook (premium)", "Print 12R + Frame", "Print 16R + Frame", "Flashdisk"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
      {
        id: "exclusive-video",
        name: "Video",
        price: 4000000,
        includes: ["4 min. full highlights", "1 min. IG highlights", "SDE"],
        sampleImages: weddingSamples.slice(1),
        sampleVideoUrl: "",
      },
      {
        id: "exclusive-photo-video",
        name: "Photo + Video",
        price: 5000000,
        includes: ["250+ photo edited", "Photobook (premium)", "Album foto keluarga (premium)", "Print 16R + Frame", "Video 4 min. full highlights", "Video 1 min. IG highlights", "Flashdisk"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
    ],
  },
];

const ngunduhMantuPackages: PackageItem[] = [
  {
    id: "ngunduh-basic",
    categoryId: "ngunduh-mantu",
    name: "Ngunduh Mantu Basic",
    startingPrice: 1300000,
    price: 1500000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "ngunduh-basic-photo",
        name: "Photo",
        price: 1500000,
        includes: ["120+ photo edited", "File only", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 4),
        sampleVideoUrl: "",
      },
      {
        id: "ngunduh-basic-video",
        name: "Video",
        price: 1300000,
        includes: ["1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 4),
        sampleVideoUrl: "",
      },
      {
        id: "ngunduh-basic-photo-video",
        name: "Photo + Video",
        price: 2900000,
        includes: ["120+ photo edited", "2 min. IG highlights", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
    ],
  },
  {
    id: "ngunduh-premium",
    categoryId: "ngunduh-mantu",
    name: "Ngunduh Mantu Premium",
    isMostSelected: true,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "ngunduh-premium-photo",
        name: "Photo",
        price: 2000000,
        includes: ["150+ photo edited", "Photobook (premium)", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
      {
        id: "ngunduh-premium-video",
        name: "Video",
        price: 2000000,
        includes: ["3 min. full highlights", "1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 5),
        sampleVideoUrl: "",
      },
      {
        id: "ngunduh-premium-photo-video",
        name: "Photo + Video",
        price: 3300000,
        includes: ["150+ photo edited", "Photobook (premium)", "3 min. full highlights", "Link g drive"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
    ],
  },
];

const preweddingOutdoorPackages: PackageItem[] = [
  {
    id: "prewedding-outdoor-basic",
    categoryId: "prewedding-outdoor",
    name: "Prewedding Outdoor Basic",
    startingPrice: 1300000,
    price: 1900000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "prewedding-outdoor-basic-photo",
        name: "Photo",
        price: 1900000,
        includes: ["120+ photo edited", "1 loc", "1 consept", "File only", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 4),
        sampleVideoUrl: "",
      },
      {
        id: "prewedding-outdoor-basic-video",
        name: "Video",
        price: 1300000,
        includes: ["1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 4),
        sampleVideoUrl: "",
      },
      {
        id: "prewedding-outdoor-basic-photo-video",
        name: "Photo + Video",
        price: 2900000,
        includes: ["120+ photo edited", "2 min. IG highlights", "1 loc", "1 consept", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
    ],
  },
  {
    id: "prewedding-outdoor-premium",
    categoryId: "prewedding-outdoor",
    name: "Prewedding Outdoor Premium",
    isMostSelected: true,
    startingPrice: 2000000,
    price: 2500000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "prewedding-outdoor-premium-photo",
        name: "Photo",
        price: 2500000,
        includes: ["150+ photo edited", "1 loc", "1 consept", "Photobook (premium)", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
      {
        id: "prewedding-outdoor-premium-video",
        name: "Video",
        price: 2000000,
        includes: ["3 min. full highlights", "1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 5),
        sampleVideoUrl: "",
      },
      {
        id: "prewedding-outdoor-premium-photo-video",
        name: "Photo + Video",
        price: 3800000,
        includes: ["150+ photo edited", "Photobook (premium)", "3 min. full highlights", "1 loc", "1 consept", "Link g drive"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
    ],
  },
];

const preweddingStudioPackages: PackageItem[] = [
  {
    id: "prewedding-studio-basic",
    categoryId: "prewedding-studio",
    name: "Prewedding Studio Basic",
    startingPrice: 900000,
    price: 900000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "prewedding-studio-basic-photo",
        name: "Photo",
        price: 900000,
        includes: ["120+ photo edited", "1 loc", "1 consept", "File only", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 4),
        sampleVideoUrl: "",
      },
      {
        id: "prewedding-studio-basic-video",
        name: "Video",
        price: 1300000,
        includes: ["1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 4),
        sampleVideoUrl: "",
      },
      {
        id: "prewedding-studio-basic-photo-video",
        name: "Photo + Video",
        price: 2000000,
        includes: ["120+ photo edited", "2 min. IG highlights", "1 loc", "1 consept", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
    ],
  },
  {
    id: "prewedding-studio-premium",
    categoryId: "prewedding-studio",
    name: "Prewedding Studio Premium",
    isMostSelected: true,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "prewedding-studio-premium-photo",
        name: "Photo",
        price: 2000000,
        includes: ["150+ photo edited", "1 loc", "1 consept", "Photobook (premium)", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
      {
        id: "prewedding-studio-premium-video",
        name: "Video",
        price: 2000000,
        includes: ["3 min. full highlights", "1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 5),
        sampleVideoUrl: "",
      },
      {
        id: "prewedding-studio-premium-photo-video",
        name: "Photo + Video",
        price: 3000000,
        includes: ["150+ photo edited", "Photobook (premium)", "3 min. full highlights", "1 loc", "1 consept", "Link g drive"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
    ],
  },
];

const engagementPackages: PackageItem[] = [
  {
    id: "engagement-basic",
    categoryId: "engagement",
    name: "Engagement Basic",
    startingPrice: 1300000,
    price: 1500000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "engagement-basic-photo",
        name: "Photo",
        price: 1500000,
        includes: ["120+ photo edited", "File only", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 4),
        sampleVideoUrl: "",
      },
      {
        id: "engagement-basic-video",
        name: "Video",
        price: 1300000,
        includes: ["1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 4),
        sampleVideoUrl: "",
      },
      {
        id: "engagement-basic-photo-video",
        name: "Photo + Video",
        price: 2500000,
        includes: ["120+ photo edited", "1 min. IG highlights", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
    ],
  },
  {
    id: "engagement-premium",
    categoryId: "engagement",
    name: "Engagement Premium",
    isMostSelected: true,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "engagement-premium-photo",
        name: "Photo",
        price: 2000000,
        includes: ["150+ photo edited", "Photobook (premium)", "Link g drive"],
        sampleImages: weddingSamples.slice(0, 5),
        sampleVideoUrl: "",
      },
      {
        id: "engagement-premium-video",
        name: "Video",
        price: 2000000,
        includes: ["3 min. full highlights", "1 min. IG highlights"],
        sampleImages: weddingSamples.slice(1, 5),
        sampleVideoUrl: "",
      },
      {
        id: "engagement-premium-photo-video",
        name: "Photo + Video",
        price: 3300000,
        includes: ["150+ photo edited", "Photobook (premium)", "3 min. full highlights", "Link g drive"],
        sampleImages: weddingSamples,
        sampleVideoUrl: "",
      },
    ],
  },
];

const photoStudioPackages: PackageItem[] = [
  {
    id: "photo-studio-family",
    categoryId: "photo-studio",
    name: "Foto Keluarga",
    startingPrice: 480000,
    price: 480000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "photo-studio-family-photo",
        name: "Photo",
        price: 480000,
        includes: ["50ft edited", "1 jam sesi foto", "Link via g drive"],
        sampleImages: weddingSamples.slice(0, 4),
        sampleVideoUrl: "",
      },
    ],
  },
  {
    id: "photo-studio-group",
    categoryId: "photo-studio",
    name: "Foto Group",
    isMostSelected: true,
    startingPrice: 580000,
    price: 580000,
    description: "",
    benefits: [],
    serviceTypes: [
      {
        id: "photo-studio-group-photo",
        name: "Photo",
        price: 580000,
        includes: ["50ft edited", "Max. 30 orang", "1 jam sesi foto", "Link via g drive"],
        sampleImages: weddingSamples.slice(1, 5),
        sampleVideoUrl: "",
      },
    ],
  },
];

export const packageCategories: PackageCategory[] = [
  {
    id: "wedding",
    name: "Wedding",
    eyebrow: "Wedding",
    note: weddingNote,
    packages: weddingPackages,
  },
  {
    id: "ngunduh-mantu",
    name: "Ngunduh Mantu",
    eyebrow: "Reception",
    note: nineHourNote,
    packages: ngunduhMantuPackages,
  },
  {
    id: "prewedding-outdoor",
    name: "Prewedding Outdoor",
    eyebrow: "Prewedding",
    note: fourHourNote,
    packages: preweddingOutdoorPackages,
  },
  {
    id: "prewedding-studio",
    name: "Prewedding Studio",
    eyebrow: "Studio Session",
    note: oneHourNote,
    packages: preweddingStudioPackages,
  },
  {
    id: "engagement",
    name: "Engagement",
    eyebrow: "Engagement",
    note: sixHourNote,
    packages: engagementPackages,
  },
  {
    id: "photo-studio",
    name: "Photo Studio",
    eyebrow: "Studio",
    packages: photoStudioPackages,
  },
];

export { weddingPackages };

export const addons: Addon[] = [
  { id: "album-magnetic-100-4r", categoryIds: ["wedding"], name: "Album magnetic (100ft print 4R)", price: 450000, displayPrice: "450k" },
  { id: "photobook-premium", categoryIds: ["wedding"], name: "Photobook (premium)", price: 1000000, displayPrice: "1 jt" },
  { id: "extra-day", categoryIds: ["wedding"], name: "Extra day", price: 1200000, displayPrice: "1,2 jt", unit: "hari", hasQuantity: true },
  { id: "add-session-photo", categoryIds: ["wedding"], name: "Add session photo / jam", price: 150000, displayPrice: "150k", unit: "jam", hasQuantity: true },
  { id: "add-session-video", categoryIds: ["wedding"], name: "Add session video / jam", price: 250000, displayPrice: "250k", unit: "jam", hasQuantity: true },
  { id: "print-12r-frame", categoryIds: ["wedding"], name: "Print 12R + frame", price: 150000, displayPrice: "150k" },
  { id: "print-16r-frame", categoryIds: ["wedding"], name: "Print 16R + frame", price: 250000, displayPrice: "250k" },
  { id: "drone-pilot", categoryIds: ["wedding"], name: "Drone + pilot", price: 400000, displayPrice: "400k" },
  { id: "flashdisk", categoryIds: ["wedding"], name: "Flashdisk", price: 100000, displayPrice: "100k" },
  { id: "file-mentah-video", categoryIds: ["wedding"], name: "File mentah video", price: 250000, displayPrice: "250k" },
  { id: "mini-studio", categoryIds: ["wedding"], name: "Mini studio", price: 550000, displayPrice: "550k" },
  { id: "album-magnetic-100-4r-small", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "Album magnetic (100ft print 4R)", price: 400000, displayPrice: "400k" },
  { id: "photobook-premium-small", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "Photobook (premium)", price: 750000, displayPrice: "750k" },
  { id: "one-hour-session", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "+ 1 hour session", price: 350000, displayPrice: "350k", unit: "jam", hasQuantity: true },
  { id: "print-12r-frame-small", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "Print 12R + frame", price: 120000, displayPrice: "120k" },
  { id: "print-14r-frame-small", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "Print 14R + frame", price: 180000, displayPrice: "180k" },
  { id: "drone-pilot-small", categoryIds: ["ngunduh-mantu", "engagement"], name: "Drone + pilot", price: 500000, displayPrice: "500k" },
  { id: "flashdisk-small", categoryIds: ["ngunduh-mantu", "engagement"], name: "Flashdisk", price: 100000, displayPrice: "100k" },
  { id: "flashdisk-studio", categoryIds: ["photo-studio"], name: "Flashdisk", price: 55000, displayPrice: "55k" },
  { id: "print-12r-frame-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Print 12R + frame", price: 200000, displayPrice: "200k" },
  { id: "extra-time-hour-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Extra time / hour", price: 200000, displayPrice: "200k", unit: "jam", hasQuantity: true },
  { id: "add-location-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Add 1 location", price: 500000, displayPrice: "500k", hasQuantity: true },
  { id: "add-consept-costum-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Add 1 consept/costum", price: 250000, displayPrice: "250k", hasQuantity: true },
  { id: "print-14r-frame-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Print 14R + frame", price: 250000, displayPrice: "250k" },
  { id: "drone-pilot-prewed", categoryIds: ["prewedding-outdoor"], name: "Drone + pilot", price: 350000, displayPrice: "350k" },
  { id: "flashdisk-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Flashdisk", price: 120000, displayPrice: "120k" },
  { id: "mua-studio", categoryIds: ["prewedding-studio"], name: "MUA", price: 400000, displayPrice: "400k" },
  { id: "mua-costum-studio", categoryIds: ["prewedding-studio"], name: "MUA + costum by rekues", price: 750000, displayPrice: "750k" },
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

export function findCategory(categoryId?: string) {
  return packageCategories.find((category) => category.id === categoryId) || packageCategories[0];
}

export function findPackage(packageId?: string) {
  const legacyMap: Record<string, string> = {
    "wedding-basic": "basic",
    "wedding-premium": "premium",
    "wedding-exclusive": "exclusive",
  };
  const normalizedId = packageId ? legacyMap[packageId] || packageId : packageId;
  return packageCategories.flatMap((category) => category.packages).find((item) => item.id === normalizedId);
}

export function findServiceType(serviceTypeId?: string) {
  return packageCategories
    .flatMap((category) => category.packages)
    .flatMap((item) => item.serviceTypes)
    .find((item) => item.id === serviceTypeId);
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

// ============================================================================
// WhatsApp Helper - Comprehensive Message Templates
// ============================================================================

export type WhatsAppIntent =
  | "general"
  | "booking_change"
  | "payment_confirmation"
  | "payment_reminder"
  | "production_update"
  | "photo_selection_reminder"
  | "delivery_update"
  | "sneak_peek"
  | "google_drive_link"
  | "help"
  | "cancel_booking";

interface WhatsAppTemplateData {
  customerName: string;
  orderNumber: string;
  packageName?: string;
  eventDate?: string;
  amount?: number;
  currentStep?: string;
  message?: string;
  googleDriveLink?: string;
  remainingAmount?: number;
  instructions?: string;
}

/**
 * Format phone number to international format (62xxx)
 * @param phone - Phone number in various formats
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, "");

  // If starts with "0", replace with "62"
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  // If starts with "62", keep as is
  if (digits.startsWith("62")) {
    return digits;
  }

  // Otherwise add "62" prefix
  return `62${digits}`;
}

/**
 * Create WhatsApp link with custom message
 * @param phone - Phone number (will be formatted to 62xxx)
 * @param message - Custom message
 */
export function createWhatsAppLink(phone: string, message: string): string {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
}

/**
 * Create template-based WhatsApp message
 * @param intent - Intent type for the message
 * @param data - Data for template interpolation
 */
export function createTemplateWhatsAppLink(
  intent: WhatsAppIntent,
  data: WhatsAppTemplateData
): string {
  const message = generateWhatsAppMessage(intent, data);
  return createWhatsAppLink(ADMIN_WHATSAPP, message);
}

/**
 * Generate WhatsApp message based on intent template
 */
function generateWhatsAppMessage(
  intent: WhatsAppIntent,
  data: WhatsAppTemplateData
): string {
  const templates: Record<WhatsAppIntent, (d: WhatsAppTemplateData) => string> = {
    general: (d) => `
Halo Admin Danivisual 👋

Saya ${d.customerName}, dengan nomor order *${d.orderNumber}*.
Mohon informasi lebih lanjut mengenai booking saya.

Terima kasih.
    `.trim(),

    booking_change: (d) => `
Halo Admin Danivisual 👋

Saya ${d.customerName}, dengan nomor order *${d.orderNumber}*.

Saya ingin mengajukan perubahan pada booking saya:
${d.message || ""}

Mohon bantuannya untuk review dan konfirmasi.

Terima kasih.
    `.trim(),

    payment_confirmation: (d) => `
Halo Admin Danivisual 👋

Saya ${d.customerName}, dengan nomor order *${d.orderNumber}*.

Saya telah melakukan pembayaran ${d.amount ? formatCurrency(d.amount) : ""}.
Mohon bantuannya untuk melakukan verifikasi.

Terima kasih atas bantuannya.
    `.trim(),

    payment_reminder: (d) => `
⚠️ Reminder Pembayaran

Halo ${d.customerName} 👋

Semoga sehat selalu. Berikut reminder untuk booking Anda:

📋 *Detail Booking*
• Nomor Order: *${d.orderNumber}*
• Paket: *${d.packageName || "-"}*
• Event: *${d.eventDate || "-"}*

💰 *Sisa Pembayaran*
${d.remainingAmount ? formatCurrency(d.remainingAmount) : "Rp -"}

📌 *Instruksi Pembayaran*
1. Transfer ke rekening BRI: ${BANK_ACCOUNT_NUMBER}
2. a/n: ${BANK_ACCOUNT_NAME}
3. Simpan bukti transfer
4. Upload di portal client

Mohon segera lunasi pembayaran agar proses produksi dapat berjalan sesuai jadwal.

Terima kasih atas kepercayaan Anda. 🙏
    `.trim(),

    production_update: (d) => `
📸 Update Produksi

Halo ${d.customerName} 👋

Berikut update progress booking Anda:

📋 *Detail Booking*
• Nomor Order: *${d.orderNumber}*

📌 *Tahap Saat Ini*
*${d.currentStep || "Dalam Proses"}*

${d.instructions || "Tim kami sedang bekerja untuk menghasilkan foto/video terbaik untuk Anda."}

Kami akan memberikan update secara berkala melalui portal ini.

Terima kasih atas kesabarannya. 🙏
    `.trim(),

    photo_selection_reminder: (d) => `
📸 Waktunya Memilih Foto

Halo ${d.customerName} 👋

Booking Anda sudah masuk tahap *Photo Sorting*!

📋 *Detail*
• Nomor Order: *${d.orderNumber}*

📌 *Langkah Selanjutnya*
1. Buka link galeri preview
2. Pilih foto favorit untuk diedit
3. Pilih foto untuk dicetak
4. Submit pilihan Anda di portal

⏰ *Batas Waktu*
Mohon submit pilihan foto dalam 7 hari untuk kelancaran proses editing.

Jika ada pertanyaan, jangan ragu untuk menghubungi kami.

Terima kasih. 🙏
    `.trim(),

    delivery_update: (d) => `
📦 Update Pengiriman Hasil

Halo ${d.customerName} 👋

Hasil foto/video Anda sudah siap!

📋 *Detail*
• Nomor Order: *${d.orderNumber}*

📦 *Pengiriman*
${d.instructions || "Hasil akan dikirim sesuai metode yang Anda pilih saat booking."}

${d.googleDriveLink ? `\n🔗 *Link Download:*\n${d.googleDriveLink}` : ""}

Mohon periksa dan konfirmasi jika sudah terima.

Terima kasih atas kepercayaan Anda menggunakan Danivisual. 🙏
    `.trim(),

    sneak_peek: (d) => `
📸 Sneak Peek Foto

Halo ${d.customerName} 👋

Sneak peek foto event Anda sudah bisa dilihat!

📋 *Detail*
• Nomor Order: *${d.orderNumber}*

🎁 *Fitur Tersedia*
• Preview foto-foto terbaik
• Pilih foto favorit untuk diedit
• Pilih foto untuk dicetak album

🔗 *Akses Portal Client:*
Silakan login ke portal client untuk melihat sneak peek dan memilih foto favorit Anda.

Terima kasih. 🙏
    `.trim(),

    google_drive_link: (d) => `
🔗 Link Hasil Foto/Video

Halo ${d.customerName} 👋

Hasil foto/video event Anda sudah tersedia!

📋 *Detail*
• Nomor Order: *${d.orderNumber}*

${d.googleDriveLink ? `🔗 *Google Drive:*\n${d.googleDriveLink}` : "Mohon maaf, link belum tersedia. Silakan hubungi admin untuk informasi lebih lanjut."}

📌 *Catatan:*
• File dapat di-download sebelum batas waktu
• Jaga kerahasiaan hasil foto/video
• Jangan upload ke media sosial sebelum ada izin

Terima kasih. 🙏
    `.trim(),

    help: (d) => `
🆘 Butuh Bantuan

Halo Admin Danivisual 👋

Saya ${d.customerName}, dengan nomor order *${d.orderNumber}*.

Saya memerlukan bantuan mengenai:
${d.message || ""}

Mohon bantuannya. Terima kasih.
    `.trim(),

    cancel_booking: (d) => `
⚠️ Permintaan Pembatalan

Halo Admin Danivisual 👋

Saya ${d.customerName}, dengan nomor order *${d.orderNumber}*.

Saya ingin mengajukan pembatalan booking dengan alasan:
${d.message || ""}

Mohon bantuannya untuk proses lebih lanjut.

Terima kasih.
    `.trim(),
  };

  return templates[intent](data);
}

/**
 * Create quick WhatsApp link for customer-to-admin chat
 */
export function customerChatToAdmin(customerName: string, orderNumber: string, message: string): string {
  return createWhatsAppLink(
    ADMIN_WHATSAPP,
    `Halo Admin Danivisual 👋

Saya ${customerName}, dengan nomor order *${orderNumber}*.

${message}

Terima kasih.`
  );
}

/**
 * Create admin-to-customer WhatsApp message
 */
export function adminChatToCustomer(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  message: string
): string {
  return createWhatsAppLink(
    customerPhone,
    `Halo ${customerName} 👋

Dari: Tim Danivisual
Order: *${orderNumber}*

${message}

Terima kasih. 🙏`
  );
}

/**
 * Send production update to customer
 */
export function sendProductionUpdate(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  currentStep: string,
  instructions?: string
): string {
  return createTemplateWhatsAppLink("production_update", {
    customerName,
    orderNumber,
    currentStep,
    instructions,
  });
}

/**
 * Send payment reminder to customer
 */
export function sendPaymentReminder(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  remainingAmount: number,
  packageName: string,
  eventDate: string
): string {
  return createTemplateWhatsAppLink("payment_reminder", {
    customerName,
    orderNumber,
    packageName,
    eventDate,
    remainingAmount,
  });
}

/**
 * Send Google Drive link to customer
 */
export function sendGoogleDriveLink(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  driveLink: string
): string {
  return createTemplateWhatsAppLink("google_drive_link", {
    customerName,
    orderNumber,
    googleDriveLink: driveLink,
  });
}

/**
 * Send sneak peek notification to customer
 */
export function sendSneakPeekNotification(
  customerPhone: string,
  customerName: string,
  orderNumber: string
): string {
  return createTemplateWhatsAppLink("sneak_peek", {
    customerName,
    orderNumber,
  });
}

/**
 * Send photo selection reminder to customer
 */
export function sendPhotoSelectionReminder(
  customerPhone: string,
  customerName: string,
  orderNumber: string
): string {
  return createTemplateWhatsAppLink("photo_selection_reminder", {
    customerName,
    orderNumber,
  });
}

/**
 * Send delivery update to customer
 */
export function sendDeliveryUpdate(
  customerPhone: string,
  customerName: string,
  orderNumber: string,
  instructions: string,
  googleDriveLink?: string
): string {
  return createTemplateWhatsAppLink("delivery_update", {
    customerName,
    orderNumber,
    instructions,
    googleDriveLink,
  });
}
