/**
 * Shared Default Portfolio Data
 *
 * This file serves as the single source of truth for portfolio/album data.
 * Used by:
 * - AdminContext for initial/default state
 * - Frontend Portfolio as fallback
 * - Supabase seed generation
 *
 * Data Structure:
 * - portfolios: Album entries with cover, gallery, story, metadata
 */

import { mediaAssets } from "./mediaAssets";
import type { Album } from "../contexts/AdminContext";

// Sample images from mediaAssets
const weddingImages = [
  mediaAssets.wedding.couplePortrait,
  mediaAssets.hero.ring,
  mediaAssets.wedding.ceremony,
  mediaAssets.wedding.table,
  mediaAssets.editorial.outdoorCouple,
  mediaAssets.wedding.family,
];

// ============================================================================
// Portfolio Categories Mapping
// ============================================================================

export const PORTFOLIO_CATEGORIES = [
  { id: "wedding", name: "Wedding", slug: "wedding" },
  { id: "prewed-studio", name: "Prewedding Studio", slug: "prewed-studio" },
  { id: "prewed-outdoor", name: "Prewedding Outdoor", slug: "prewed-outdoor" },
  { id: "engagement", name: "Engagement", slug: "engagement" },
  { id: "event", name: "Event", slug: "event" },
  { id: "studio", name: "Studio", slug: "studio" },
  { id: "peristiwa-lainnya", name: "Peristiwa Lainnya", slug: "peristiwa-lainnya" },
];

// ============================================================================
// Default Portfolios (in AdminContext Album format)
// ============================================================================

export const DEFAULT_PORTFOLIOS: Album[] = [
  // Wedding Albums
  {
    id: "portfolio-1",
    name: "Dani & Sinta",
    coupleName: "Dani & Sinta",
    category: "wedding",
    title: "Dani & Sinta",
    slug: "dani-sinta",
    location: "Four Seasons Jakarta",
    eventDate: "2026-01-20",
    date: "2026-01-20",
    coverImage: mediaAssets.wedding.couplePortrait,
    galleryImages: weddingImages,
    images: weddingImages,
    story: "Pernikahan Dani dan Sinta adalah perayaan cinta yang intim dan penuh kehangatan. Dikelilingi oleh keluarga dan teman terdekat, mereka berjanji untuk saling mendukung dalam setiap langkah kehidupan.",
    isFeatured: true,
    isPublished: true,
    sortOrder: 1,
  },
  {
    id: "portfolio-2",
    name: "Naufal & Kirana",
    coupleName: "Naufal & Kirana",
    category: "wedding",
    title: "Naufal & Kirana",
    slug: "naufal-kirana",
    location: "The Langham Jakarta",
    eventDate: "2025-12-28",
    date: "2025-12-28",
    coverImage: mediaAssets.hero.akad,
    galleryImages: [mediaAssets.hero.akad, ...weddingImages.slice(0, 5)],
    images: [mediaAssets.hero.akad, ...weddingImages.slice(0, 5)],
    story: "Rangkaian akad yang hangat, dirawat lewat detail keluarga, gesture kecil, dan ritme dokumentasi yang tenang.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 2,
  },
  {
    id: "portfolio-3",
    name: "Arga & Meira",
    coupleName: "Arga & Meira",
    category: "wedding",
    title: "Arga & Meira",
    slug: "arga-meira",
    location: "Plataran Menteng",
    eventDate: "2025-12-18",
    date: "2025-12-18",
    coverImage: mediaAssets.wedding.detailPortrait,
    galleryImages: [mediaAssets.wedding.detailPortrait, ...weddingImages.slice(0, 5)],
    images: [mediaAssets.wedding.detailPortrait, ...weddingImages.slice(0, 5)],
    story: "Cerita wedding yang klasik dan lembut, dengan fokus pada prosesi, detail cincin, dan potret pasangan.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 3,
  },
  {
    id: "portfolio-4",
    name: "Rizky & Anindya",
    coupleName: "Rizky & Anindya",
    category: "wedding",
    title: "Rizky & Anindya",
    slug: "rizky-anindya",
    location: "Ayana Midplaza",
    eventDate: "2025-11-30",
    date: "2025-11-30",
    coverImage: mediaAssets.wedding.table,
    galleryImages: [mediaAssets.wedding.table, ...weddingImages.slice(0, 5)],
    images: [mediaAssets.wedding.table, ...weddingImages.slice(0, 5)],
    story: "Perayaan formal yang tetap personal, diabadikan melalui portrait keluarga, dekorasi pelaminan, dan detail seremoni.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 4,
  },

  // Prewedding Studio Albums
  {
    id: "portfolio-5",
    name: "Rama & Dita",
    coupleName: "Rama & Dita",
    category: "prewed-studio",
    title: "Rama & Dita",
    slug: "rama-dita",
    location: "Studio Danivisual",
    eventDate: "2026-01-15",
    date: "2026-01-15",
    coverImage: mediaAssets.wedding.ringPortrait,
    galleryImages: [mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait, mediaAssets.hero.ring, mediaAssets.wedding.couplePortrait],
    images: [mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait, mediaAssets.hero.ring, mediaAssets.wedding.couplePortrait],
    story: "Sesi prewedding studio dengan arahan pose yang tenang, fokus pada chemistry pasangan dan detail editorial.",
    isFeatured: true,
    isPublished: true,
    sortOrder: 5,
  },
  {
    id: "portfolio-7",
    name: "Bagas & Livia",
    coupleName: "Bagas & Livia",
    category: "prewed-studio",
    title: "Bagas & Livia",
    slug: "bagas-livia",
    location: "Studio Editorial Danivisual",
    eventDate: "2025-11-09",
    date: "2025-11-09",
    coverImage: mediaAssets.hero.ring,
    galleryImages: [mediaAssets.hero.ring, mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait],
    images: [mediaAssets.hero.ring, mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait],
    story: "Sesi editorial studio yang bersih, modern, dan diarahkan untuk menghasilkan potret pasangan yang timeless.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 6,
  },

  // Prewedding Outdoor Albums
  {
    id: "portfolio-6",
    name: "Andi & Maya",
    coupleName: "Andi & Maya",
    category: "prewed-outdoor",
    title: "Andi & Maya",
    slug: "andi-maya",
    location: "Bromo, Jawa Timur",
    eventDate: "2026-01-10",
    date: "2026-01-10",
    coverImage: mediaAssets.editorial.outdoorCouple,
    galleryImages: [mediaAssets.editorial.outdoorCouple, mediaAssets.hero.ring, mediaAssets.hero.moment, mediaAssets.wedding.ringPortrait],
    images: [mediaAssets.editorial.outdoorCouple, mediaAssets.hero.ring, mediaAssets.hero.moment, mediaAssets.wedding.ringPortrait],
    story: "Prewedding outdoor dengan cahaya natural dan lanskap terbuka, dibuat untuk terasa cinematic namun tetap personal.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 7,
  },
  {
    id: "portfolio-8",
    name: "Fajar & Sari",
    coupleName: "Fajar & Sari",
    category: "prewed-outdoor",
    title: "Fajar & Sari",
    slug: "fajar-sari",
    location: "Taman Suropati",
    eventDate: "2025-12-22",
    date: "2025-12-22",
    coverImage: mediaAssets.wedding.family,
    galleryImages: [mediaAssets.wedding.family, mediaAssets.editorial.outdoorCouple, mediaAssets.hero.moment],
    images: [mediaAssets.wedding.family, mediaAssets.editorial.outdoorCouple, mediaAssets.hero.moment],
    story: "Sesi outdoor ringan dengan pendekatan natural dan dokumenter.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 8,
  },

  // Event Albums
  {
    id: "portfolio-9",
    name: "Corporate Gala Night",
    coupleName: "Corporate Gala",
    category: "event",
    title: "Corporate Gala Night",
    slug: "corporate-gala-night",
    location: "Grand Hyatt Jakarta",
    eventDate: "2026-01-05",
    date: "2026-01-05",
    coverImage: mediaAssets.wedding.group,
    galleryImages: [mediaAssets.wedding.group, mediaAssets.wedding.family, mediaAssets.wedding.table],
    images: [mediaAssets.wedding.group, mediaAssets.wedding.family, mediaAssets.wedding.table],
    story: "Dokumentasi event yang menangkap ambience, interaksi tamu, dan momen utama acara.",
    isFeatured: true,
    isPublished: true,
    sortOrder: 9,
  },
  {
    id: "portfolio-10",
    name: "Private Engagement Dinner",
    coupleName: "Engagement Dinner",
    category: "event",
    title: "Private Engagement Dinner",
    slug: "private-engagement-dinner",
    location: "Park Hyatt Jakarta",
    eventDate: "2025-12-24",
    date: "2025-12-24",
    coverImage: mediaAssets.wedding.table,
    galleryImages: [mediaAssets.wedding.table, mediaAssets.wedding.ceremony, mediaAssets.wedding.family],
    images: [mediaAssets.wedding.table, mediaAssets.wedding.ceremony, mediaAssets.wedding.family],
    story: "Engagement dinner dengan visual hangat, intim, dan detail dekorasi yang rapi.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 10,
  },
  {
    id: "portfolio-11",
    name: "Luxury Product Dinner",
    coupleName: "Product Dinner",
    category: "event",
    title: "Luxury Product Dinner",
    slug: "luxury-product-dinner",
    location: "The Dharmawangsa",
    eventDate: "2025-12-16",
    date: "2025-12-16",
    coverImage: mediaAssets.wedding.ceremony,
    galleryImages: [mediaAssets.wedding.ceremony, mediaAssets.wedding.table, mediaAssets.wedding.group],
    images: [mediaAssets.wedding.ceremony, mediaAssets.wedding.table, mediaAssets.wedding.group],
    story: "Event dinner elegan dengan dokumentasi detail program dan atmosfer ruang.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 11,
  },
  {
    id: "portfolio-12",
    name: "Family Celebration",
    coupleName: "Family Celebration",
    category: "event",
    title: "Family Celebration",
    slug: "family-celebration",
    location: "InterContinental Jakarta",
    eventDate: "2025-12-12",
    date: "2025-12-12",
    coverImage: mediaAssets.wedding.family,
    galleryImages: [mediaAssets.wedding.family, mediaAssets.wedding.group, mediaAssets.wedding.couplePortrait],
    images: [mediaAssets.wedding.family, mediaAssets.wedding.group, mediaAssets.wedding.couplePortrait],
    story: "Perayaan keluarga yang dirangkai dengan momen candid dan portrait hangat.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 12,
  },

  // Studio Albums
  {
    id: "portfolio-13",
    name: "Alya Portrait Session",
    coupleName: "Alya Portrait",
    category: "studio",
    title: "Alya Portrait Session",
    slug: "alya-portrait",
    location: "Studio Danivisual",
    eventDate: "2025-12-03",
    date: "2025-12-03",
    coverImage: mediaAssets.wedding.ringPortrait,
    galleryImages: [mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait, mediaAssets.hero.ring],
    images: [mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait, mediaAssets.hero.ring],
    story: "Portrait studio dengan lighting rapi dan arahan visual yang elegan.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 13,
  },
  {
    id: "portfolio-14",
    name: "Rendra Family Portrait",
    coupleName: "Rendra Family",
    category: "studio",
    title: "Rendra Family Portrait",
    slug: "rendra-family",
    location: "Studio Danivisual",
    eventDate: "2025-11-29",
    date: "2025-11-29",
    coverImage: mediaAssets.wedding.family,
    galleryImages: [mediaAssets.wedding.family, mediaAssets.wedding.group, mediaAssets.wedding.couplePortrait],
    images: [mediaAssets.wedding.family, mediaAssets.wedding.group, mediaAssets.wedding.couplePortrait],
    story: "Sesi keluarga dengan komposisi bersih dan ekspresi natural.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 14,
  },
  {
    id: "portfolio-15",
    name: "Editorial Couple Portrait",
    coupleName: "Editorial Couple",
    category: "studio",
    title: "Editorial Couple Portrait",
    slug: "editorial-couple",
    location: "Studio Danivisual",
    eventDate: "2025-11-19",
    date: "2025-11-19",
    coverImage: mediaAssets.wedding.couplePortrait,
    galleryImages: [mediaAssets.wedding.couplePortrait, mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait],
    images: [mediaAssets.wedding.couplePortrait, mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait],
    story: "Portrait pasangan dengan gaya editorial yang sederhana dan timeless.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 15,
  },
  {
    id: "portfolio-16",
    name: "Personal Branding Set",
    coupleName: "Personal Branding",
    category: "studio",
    title: "Personal Branding Set",
    slug: "personal-branding",
    location: "Studio Danivisual",
    eventDate: "2025-11-11",
    date: "2025-11-11",
    coverImage: mediaAssets.hero.moment,
    galleryImages: [mediaAssets.hero.moment, mediaAssets.hero.ring, mediaAssets.wedding.ringPortrait],
    images: [mediaAssets.hero.moment, mediaAssets.hero.ring, mediaAssets.wedding.ringPortrait],
    story: "Set personal branding dengan visual profesional dan tetap personal.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 16,
  },

  // Other Events Albums
  {
    id: "portfolio-17",
    name: "Siraman Intimate",
    coupleName: "Siraman Intimate",
    category: "peristiwa-lainnya",
    title: "Siraman Intimate",
    slug: "siraman-intimate",
    location: "Private Residence",
    eventDate: "2025-11-07",
    date: "2025-11-07",
    coverImage: mediaAssets.wedding.ceremony,
    galleryImages: [mediaAssets.wedding.ceremony, mediaAssets.wedding.family, mediaAssets.wedding.table],
    images: [mediaAssets.wedding.ceremony, mediaAssets.wedding.family, mediaAssets.wedding.table],
    story: "Prosesi siraman intimate dengan dokumentasi detail budaya dan keluarga.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 17,
  },
  {
    id: "portfolio-18",
    name: "Pengajian Keluarga",
    coupleName: "Pengajian Keluarga",
    category: "peristiwa-lainnya",
    title: "Pengajian Keluarga",
    slug: "pengajian-keluarga",
    location: "South Jakarta",
    eventDate: "2025-11-02",
    date: "2025-11-02",
    coverImage: mediaAssets.wedding.group,
    galleryImages: [mediaAssets.wedding.group, mediaAssets.wedding.family, mediaAssets.wedding.ceremony],
    images: [mediaAssets.wedding.group, mediaAssets.wedding.family, mediaAssets.wedding.ceremony],
    story: "Pengajian keluarga yang hangat, tenang, dan penuh momen personal.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 18,
  },
  {
    id: "portfolio-19",
    name: "Lamaran Elegant",
    coupleName: "Lamaran Elegant",
    category: "peristiwa-lainnya",
    title: "Lamaran Elegant",
    slug: "lamaran-elegant",
    location: "Private Garden",
    eventDate: "2025-10-24",
    date: "2025-10-24",
    coverImage: mediaAssets.hero.ring,
    galleryImages: [mediaAssets.hero.ring, mediaAssets.wedding.table, mediaAssets.wedding.couplePortrait],
    images: [mediaAssets.hero.ring, mediaAssets.wedding.table, mediaAssets.wedding.couplePortrait],
    story: "Lamaran elegan dengan detail dekorasi dan gesture keluarga yang dekat.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 19,
  },
  {
    id: "portfolio-20",
    name: "Family Milestone",
    coupleName: "Family Milestone",
    category: "peristiwa-lainnya",
    title: "Family Milestone",
    slug: "family-milestone",
    location: "Jakarta Selatan",
    eventDate: "2025-10-18",
    date: "2025-10-18",
    coverImage: mediaAssets.wedding.family,
    galleryImages: [mediaAssets.wedding.family, mediaAssets.wedding.group, mediaAssets.wedding.couplePortrait],
    images: [mediaAssets.wedding.family, mediaAssets.wedding.group, mediaAssets.wedding.couplePortrait],
    story: "Milestone keluarga yang didokumentasikan dengan pendekatan hangat dan timeless.",
    isFeatured: false,
    isPublished: true,
    sortOrder: 20,
  },
];

// ============================================================================
// Type Exports
// ============================================================================

export type DefaultPortfolio = typeof DEFAULT_PORTFOLIOS[number];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get published portfolios only
 */
export function getPublishedPortfolios() {
  return DEFAULT_PORTFOLIOS.filter(p => p.isPublished);
}

/**
 * Get featured portfolios only
 */
export function getFeaturedPortfolios() {
  return DEFAULT_PORTFOLIOS.filter(p => p.isFeatured && p.isPublished);
}

/**
 * Get portfolios by category
 */
export function getPortfoliosByCategory(categoryId: string) {
  return DEFAULT_PORTFOLIOS.filter(p => p.category === categoryId && p.isPublished);
}

/**
 * Normalize category name to slug
 */
export function normalizeCategory(category: string): string {
  const normalized = category.trim().toLowerCase();

  if (normalized.includes("prewed") || normalized.includes("engagement")) return "prewed-studio";
  if (normalized.includes("event")) return "event";
  if (normalized.includes("studio") || normalized.includes("portrait")) return "studio";
  if (normalized.includes("lain") || normalized.includes("other")) return "peristiwa-lainnya";
  if (normalized.includes("wedding")) return "wedding";
  if (normalized.includes("outdoor")) return "prewed-outdoor";

  return normalized.replace(/\s+/g, "-");
}

/**
 * Get category name from slug/id
 */
export function getCategoryName(categoryId: string): string {
  const category = PORTFOLIO_CATEGORIES.find(c => c.id === categoryId || c.slug === categoryId);
  return category?.name || categoryId;
}