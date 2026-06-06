/**
 * Shared Default Packages Data
 *
 * This file serves as the single source of truth for package data.
 * Used by:
 * - AdminContext for initial/default state
 * - Frontend PackageSelectionPage as fallback
 * - Supabase seed generation
 *
 * Data Structure:
 * - packageCategories: Top-level categories (Wedding, Prewedding, etc.)
 * - packages: Flat list of packages with categoryId reference
 * - serviceTypes: Nested within packages (Photo, Video, Photo+Video)
 * - addons: Additional services that can be added to packages
 */

// Sample images for preview
const SAMPLE_IMAGES = {
  wedding: [
    "https://images.unsplash.com/photo-1519741497674-611481863552?w=800",
    "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800",
    "https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=800",
    "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800",
  ],
  couple: [
    "https://images.unsplash.com/photo-1529634806980-85c3dd9d6184?w=800",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800",
  ],
  ring: [
    "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=800",
  ],
};

// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================

export const DEFAULT_CATEGORIES = [
  {
    id: "wedding",
    name: "Wedding",
    eyebrow: "Wedding",
    note: "All time packages are limited to a max. of 9 working hours (Akad - Reception)",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "ngunduh-mantu",
    name: "Ngunduh Mantu",
    eyebrow: "Reception",
    note: "All time packages are limited to a max. of 9 working hours",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "prewedding-outdoor",
    name: "Prewedding Outdoor",
    eyebrow: "Prewedding",
    note: "All time packages are limited to a max. of 4 working hours",
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "prewedding-studio",
    name: "Prewedding Studio",
    eyebrow: "Studio Session",
    note: "All time packages are limited to a max. of 1 working hour",
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "engagement",
    name: "Engagement",
    eyebrow: "Engagement",
    note: "All time packages are limited to a max. of 6 working hours",
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "photo-studio",
    name: "Photo Studio",
    eyebrow: "Studio",
    note: "",
    isActive: true,
    sortOrder: 6,
  },
];

// ============================================================================
// PACKAGE DEFINITIONS
// ============================================================================

export const DEFAULT_PACKAGES = [
  // Wedding Packages
  {
    id: "wedding-basic",
    categoryId: "wedding",
    name: "Wedding Basic",
    serviceType: "Photo",
    isMostSelected: false,
    startingPrice: 1900000,
    price: 1900000,
    description: "",
    benefits: ["150+ photo edited", "Album magnetic (premium)", "80 foto print 4R", "Print 12R + Frame", "Link g drive"],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "wedding-basic-video",
    categoryId: "wedding",
    name: "Wedding Basic",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 1900000,
    price: 2000000,
    description: "",
    benefits: ["2 min. full highlights", "1 min. IG highlights"],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "wedding-basic-combo",
    categoryId: "wedding",
    name: "Wedding Basic",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 1900000,
    price: 3800000,
    description: "",
    benefits: ["200+ photo edited", "Album magnetic (premium)", "Print 12R + Frame", "100 foto print 4R", "Video 2 min. full highlights", "Video 1 min. IG highlights", "Link g drive"],
    isActive: true,
    sortOrder: 3,
  },
  {
    id: "wedding-premium",
    categoryId: "wedding",
    name: "Wedding Premium",
    serviceType: "Photo",
    isMostSelected: true,
    startingPrice: 2400000,
    price: 2400000,
    description: "",
    benefits: ["200+ foto edited", "Photobook (premium)", "Print 12R + Frame", "Flashdisk"],
    isActive: true,
    sortOrder: 4,
  },
  {
    id: "wedding-premium-video",
    categoryId: "wedding",
    name: "Wedding Premium",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 2400000,
    price: 3000000,
    description: "",
    benefits: ["3 min. full highlights", "1 min. IG highlights"],
    isActive: true,
    sortOrder: 5,
  },
  {
    id: "wedding-premium-combo",
    categoryId: "wedding",
    name: "Wedding Premium",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 2400000,
    price: 4400000,
    description: "",
    benefits: ["200+ photo edited", "Photobook (premium)", "Print 12R + Frame", "Video 3 min. full highlights", "Video 1 min. IG highlights", "Link g drive"],
    isActive: true,
    sortOrder: 6,
  },
  {
    id: "wedding-exclusive",
    categoryId: "wedding",
    name: "Wedding Exclusive",
    serviceType: "Photo",
    isMostSelected: false,
    startingPrice: 3300000,
    price: 3300000,
    description: "",
    benefits: ["250+ foto edited", "Photobook (premium)", "Print 12R + Frame", "Print 16R + Frame", "Flashdisk"],
    isActive: true,
    sortOrder: 7,
  },
  {
    id: "wedding-exclusive-video",
    categoryId: "wedding",
    name: "Wedding Exclusive",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 3300000,
    price: 4000000,
    description: "",
    benefits: ["4 min. full highlights", "1 min. IG highlights", "SDE"],
    isActive: true,
    sortOrder: 8,
  },
  {
    id: "wedding-exclusive-combo",
    categoryId: "wedding",
    name: "Wedding Exclusive",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 3300000,
    price: 5000000,
    description: "",
    benefits: ["250+ photo edited", "Photobook (premium)", "Album foto keluarga (premium)", "Print 16R + Frame", "Video 4 min. full highlights", "Video 1 min. IG highlights", "Flashdisk"],
    isActive: true,
    sortOrder: 9,
  },

  // Ngunduh Mantu Packages
  {
    id: "ngunduh-basic",
    categoryId: "ngunduh-mantu",
    name: "Ngunduh Mantu Basic",
    serviceType: "Photo",
    isMostSelected: false,
    startingPrice: 1300000,
    price: 1500000,
    description: "",
    benefits: ["120+ photo edited", "File only", "Link g drive"],
    isActive: true,
    sortOrder: 10,
  },
  {
    id: "ngunduh-basic-video",
    categoryId: "ngunduh-mantu",
    name: "Ngunduh Mantu Basic",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 1300000,
    price: 1300000,
    description: "",
    benefits: ["1 min. IG highlights"],
    isActive: true,
    sortOrder: 11,
  },
  {
    id: "ngunduh-basic-combo",
    categoryId: "ngunduh-mantu",
    name: "Ngunduh Mantu Basic",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 1300000,
    price: 2900000,
    description: "",
    benefits: ["120+ photo edited", "2 min. IG highlights", "Link g drive"],
    isActive: true,
    sortOrder: 12,
  },
  {
    id: "ngunduh-premium",
    categoryId: "ngunduh-mantu",
    name: "Ngunduh Mantu Premium",
    serviceType: "Photo",
    isMostSelected: true,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: ["150+ photo edited", "Photobook (premium)", "Link g drive"],
    isActive: true,
    sortOrder: 13,
  },
  {
    id: "ngunduh-premium-video",
    categoryId: "ngunduh-mantu",
    name: "Ngunduh Mantu Premium",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: ["3 min. full highlights", "1 min. IG highlights"],
    isActive: true,
    sortOrder: 14,
  },
  {
    id: "ngunduh-premium-combo",
    categoryId: "ngunduh-mantu",
    name: "Ngunduh Mantu Premium",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 2000000,
    price: 3300000,
    description: "",
    benefits: ["150+ photo edited", "Photobook (premium)", "3 min. full highlights", "Link g drive"],
    isActive: true,
    sortOrder: 15,
  },

  // Prewedding Outdoor Packages
  {
    id: "prewedding-outdoor-basic",
    categoryId: "prewedding-outdoor",
    name: "Prewedding Outdoor Basic",
    serviceType: "Photo",
    isMostSelected: false,
    startingPrice: 1300000,
    price: 1900000,
    description: "",
    benefits: ["120+ photo edited", "1 loc", "1 consept", "File only", "Link g drive"],
    isActive: true,
    sortOrder: 16,
  },
  {
    id: "prewedding-outdoor-basic-video",
    categoryId: "prewedding-outdoor",
    name: "Prewedding Outdoor Basic",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 1300000,
    price: 1300000,
    description: "",
    benefits: ["1 min. IG highlights"],
    isActive: true,
    sortOrder: 17,
  },
  {
    id: "prewedding-outdoor-basic-combo",
    categoryId: "prewedding-outdoor",
    name: "Prewedding Outdoor Basic",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 1300000,
    price: 2900000,
    description: "",
    benefits: ["120+ photo edited", "2 min. IG highlights", "1 loc", "1 consept", "Link g drive"],
    isActive: true,
    sortOrder: 18,
  },
  {
    id: "prewedding-outdoor-premium",
    categoryId: "prewedding-outdoor",
    name: "Prewedding Outdoor Premium",
    serviceType: "Photo",
    isMostSelected: true,
    startingPrice: 2000000,
    price: 2500000,
    description: "",
    benefits: ["150+ photo edited", "1 loc", "1 consept", "Photobook (premium)", "Link g drive"],
    isActive: true,
    sortOrder: 19,
  },
  {
    id: "prewedding-outdoor-premium-video",
    categoryId: "prewedding-outdoor",
    name: "Prewedding Outdoor Premium",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: ["3 min. full highlights", "1 min. IG highlights"],
    isActive: true,
    sortOrder: 20,
  },
  {
    id: "prewedding-outdoor-premium-combo",
    categoryId: "prewedding-outdoor",
    name: "Prewedding Outdoor Premium",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 2000000,
    price: 3800000,
    description: "",
    benefits: ["150+ photo edited", "Photobook (premium)", "3 min. full highlights", "1 loc", "1 consept", "Link g drive"],
    isActive: true,
    sortOrder: 21,
  },

  // Prewedding Studio Packages
  {
    id: "prewedding-studio-basic",
    categoryId: "prewedding-studio",
    name: "Prewedding Studio Basic",
    serviceType: "Photo",
    isMostSelected: false,
    startingPrice: 900000,
    price: 900000,
    description: "",
    benefits: ["120+ photo edited", "1 loc", "1 consept", "File only", "Link g drive"],
    isActive: true,
    sortOrder: 22,
  },
  {
    id: "prewedding-studio-basic-video",
    categoryId: "prewedding-studio",
    name: "Prewedding Studio Basic",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 900000,
    price: 1300000,
    description: "",
    benefits: ["1 min. IG highlights"],
    isActive: true,
    sortOrder: 23,
  },
  {
    id: "prewedding-studio-basic-combo",
    categoryId: "prewedding-studio",
    name: "Prewedding Studio Basic",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 900000,
    price: 2000000,
    description: "",
    benefits: ["120+ photo edited", "2 min. IG highlights", "1 loc", "1 consept", "Link g drive"],
    isActive: true,
    sortOrder: 24,
  },
  {
    id: "prewedding-studio-premium",
    categoryId: "prewedding-studio",
    name: "Prewedding Studio Premium",
    serviceType: "Photo",
    isMostSelected: true,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: ["150+ photo edited", "1 loc", "1 consept", "Photobook (premium)", "Link g drive"],
    isActive: true,
    sortOrder: 25,
  },
  {
    id: "prewedding-studio-premium-video",
    categoryId: "prewedding-studio",
    name: "Prewedding Studio Premium",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: ["3 min. full highlights", "1 min. IG highlights"],
    isActive: true,
    sortOrder: 26,
  },
  {
    id: "prewedding-studio-premium-combo",
    categoryId: "prewedding-studio",
    name: "Prewedding Studio Premium",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 2000000,
    price: 3000000,
    description: "",
    benefits: ["150+ photo edited", "Photobook (premium)", "3 min. full highlights", "1 loc", "1 consept", "Link g drive"],
    isActive: true,
    sortOrder: 27,
  },

  // Engagement Packages
  {
    id: "engagement-basic",
    categoryId: "engagement",
    name: "Engagement Basic",
    serviceType: "Photo",
    isMostSelected: false,
    startingPrice: 1300000,
    price: 1500000,
    description: "",
    benefits: ["120+ photo edited", "File only", "Link g drive"],
    isActive: true,
    sortOrder: 28,
  },
  {
    id: "engagement-basic-video",
    categoryId: "engagement",
    name: "Engagement Basic",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 1300000,
    price: 1300000,
    description: "",
    benefits: ["1 min. IG highlights"],
    isActive: true,
    sortOrder: 29,
  },
  {
    id: "engagement-basic-combo",
    categoryId: "engagement",
    name: "Engagement Basic",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 1300000,
    price: 2500000,
    description: "",
    benefits: ["120+ photo edited", "1 min. IG highlights", "Link g drive"],
    isActive: true,
    sortOrder: 30,
  },
  {
    id: "engagement-premium",
    categoryId: "engagement",
    name: "Engagement Premium",
    serviceType: "Photo",
    isMostSelected: true,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: ["150+ photo edited", "Photobook (premium)", "Link g drive"],
    isActive: true,
    sortOrder: 31,
  },
  {
    id: "engagement-premium-video",
    categoryId: "engagement",
    name: "Engagement Premium",
    serviceType: "Video",
    isMostSelected: false,
    startingPrice: 2000000,
    price: 2000000,
    description: "",
    benefits: ["3 min. full highlights", "1 min. IG highlights"],
    isActive: true,
    sortOrder: 32,
  },
  {
    id: "engagement-premium-combo",
    categoryId: "engagement",
    name: "Engagement Premium",
    serviceType: "Photo + Video",
    isMostSelected: false,
    startingPrice: 2000000,
    price: 3300000,
    description: "",
    benefits: ["150+ photo edited", "Photobook (premium)", "3 min. full highlights", "Link g drive"],
    isActive: true,
    sortOrder: 33,
  },

  // Photo Studio Packages
  {
    id: "photo-studio-family",
    categoryId: "photo-studio",
    name: "Foto Keluarga",
    serviceType: "Photo",
    isMostSelected: false,
    startingPrice: 480000,
    price: 480000,
    description: "",
    benefits: ["50ft edited", "1 jam sesi foto", "Link via g drive"],
    isActive: true,
    sortOrder: 34,
  },
  {
    id: "photo-studio-group",
    categoryId: "photo-studio",
    name: "Foto Group",
    serviceType: "Photo",
    isMostSelected: true,
    startingPrice: 580000,
    price: 580000,
    description: "",
    benefits: ["50ft edited", "Max. 30 orang", "1 jam sesi foto", "Link via g drive"],
    isActive: true,
    sortOrder: 35,
  },
];

// ============================================================================
// ADDON DEFINITIONS
// ============================================================================

export const DEFAULT_ADDONS = [
  // Wedding Addons
  { id: "album-magnetic-100-4r", categoryIds: ["wedding"], name: "Album magnetic (100ft print 4R)", price: 450000, displayPrice: "450k", unit: null, hasQuantity: false, isActive: true },
  { id: "photobook-premium", categoryIds: ["wedding"], name: "Photobook (premium)", price: 1000000, displayPrice: "1 jt", unit: null, hasQuantity: false, isActive: true },
  { id: "extra-day", categoryIds: ["wedding"], name: "Extra day", price: 1200000, displayPrice: "1,2 jt", unit: "hari", hasQuantity: true, isActive: true },
  { id: "add-session-photo", categoryIds: ["wedding"], name: "Add session photo / jam", price: 150000, displayPrice: "150k", unit: "jam", hasQuantity: true, isActive: true },
  { id: "add-session-video", categoryIds: ["wedding"], name: "Add session video / jam", price: 250000, displayPrice: "250k", unit: "jam", hasQuantity: true, isActive: true },
  { id: "print-12r-frame", categoryIds: ["wedding"], name: "Print 12R + frame", price: 150000, displayPrice: "150k", unit: null, hasQuantity: false, isActive: true },
  { id: "print-16r-frame", categoryIds: ["wedding"], name: "Print 16R + frame", price: 250000, displayPrice: "250k", unit: null, hasQuantity: false, isActive: true },
  { id: "drone-pilot", categoryIds: ["wedding"], name: "Drone + pilot", price: 400000, displayPrice: "400k", unit: null, hasQuantity: false, isActive: true },
  { id: "flashdisk", categoryIds: ["wedding"], name: "Flashdisk", price: 100000, displayPrice: "100k", unit: null, hasQuantity: false, isActive: true },
  { id: "file-mentah-video", categoryIds: ["wedding"], name: "File mentah video", price: 250000, displayPrice: "250k", unit: null, hasQuantity: false, isActive: true },
  { id: "mini-studio", categoryIds: ["wedding"], name: "Mini studio", price: 550000, displayPrice: "550k", unit: null, hasQuantity: false, isActive: true },

  // Ngunduh Mantu, Engagement, Photo Studio Addons
  { id: "album-magnetic-100-4r-small", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "Album magnetic (100ft print 4R)", price: 400000, displayPrice: "400k", unit: null, hasQuantity: false, isActive: true },
  { id: "photobook-premium-small", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "Photobook (premium)", price: 750000, displayPrice: "750k", unit: null, hasQuantity: false, isActive: true },
  { id: "one-hour-session", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "+ 1 hour session", price: 350000, displayPrice: "350k", unit: "jam", hasQuantity: true, isActive: true },
  { id: "print-12r-frame-small", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "Print 12R + frame", price: 120000, displayPrice: "120k", unit: null, hasQuantity: false, isActive: true },
  { id: "print-14r-frame-small", categoryIds: ["ngunduh-mantu", "engagement", "photo-studio"], name: "Print 14R + frame", price: 180000, displayPrice: "180k", unit: null, hasQuantity: false, isActive: true },
  { id: "drone-pilot-small", categoryIds: ["ngunduh-mantu", "engagement"], name: "Drone + pilot", price: 500000, displayPrice: "500k", unit: null, hasQuantity: false, isActive: true },
  { id: "flashdisk-small", categoryIds: ["ngunduh-mantu", "engagement"], name: "Flashdisk", price: 100000, displayPrice: "100k", unit: null, hasQuantity: false, isActive: true },
  { id: "flashdisk-studio", categoryIds: ["photo-studio"], name: "Flashdisk", price: 55000, displayPrice: "55k", unit: null, hasQuantity: false, isActive: true },

  // Prewedding Addons
  { id: "print-12r-frame-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Print 12R + frame", price: 200000, displayPrice: "200k", unit: null, hasQuantity: false, isActive: true },
  { id: "extra-time-hour-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Extra time / hour", price: 200000, displayPrice: "200k", unit: "jam", hasQuantity: true, isActive: true },
  { id: "add-location-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Add 1 location", price: 500000, displayPrice: "500k", unit: null, hasQuantity: true, isActive: true },
  { id: "add-consept-costum-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Add 1 consept/costum", price: 250000, displayPrice: "250k", unit: null, hasQuantity: true, isActive: true },
  { id: "print-14r-frame-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Print 14R + frame", price: 250000, displayPrice: "250k", unit: null, hasQuantity: false, isActive: true },
  { id: "drone-pilot-prewed", categoryIds: ["prewedding-outdoor"], name: "Drone + pilot", price: 350000, displayPrice: "350k", unit: null, hasQuantity: false, isActive: true },
  { id: "flashdisk-prewed", categoryIds: ["prewedding-outdoor", "prewedding-studio"], name: "Flashdisk", price: 120000, displayPrice: "120k", unit: null, hasQuantity: false, isActive: true },
  { id: "mua-studio", categoryIds: ["prewedding-studio"], name: "MUA", price: 400000, displayPrice: "400k", unit: null, hasQuantity: false, isActive: true },
  { id: "mua-costum-studio", categoryIds: ["prewedding-studio"], name: "MUA + costum by rekues", price: 750000, displayPrice: "750k", unit: null, hasQuantity: false, isActive: true },
];

// ============================================================================
// TYPE EXPORTS (for TypeScript)
// ============================================================================

export type DefaultPackage = typeof DEFAULT_PACKAGES[number];
export type DefaultCategory = typeof DEFAULT_CATEGORIES[number];
export type DefaultAddon = typeof DEFAULT_ADDONS[number];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all packages for a specific category
 */
export function getPackagesByCategory(categoryId: string) {
  return DEFAULT_PACKAGES.filter(pkg => pkg.categoryId === categoryId && pkg.isActive);
}

/**
 * Get active categories with their packages
 */
export function getActiveCategoriesWithPackages() {
  return DEFAULT_CATEGORIES.filter(cat => cat.isActive).map(category => ({
    ...category,
    packages: getPackagesByCategory(category.id),
  }));
}

/**
 * Format price to short notation (e.g., "1,5 jt", "450k")
 */
export function formatShortPrice(value: number): string {
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