import { mediaAssets } from "./mediaAssets";
import type { Album } from "../contexts/AdminContext";
import { DEFAULT_PORTFOLIOS } from "./defaultPortfolio";

export type PortfolioAlbum = {
  id: string;
  category: string;
  title: string;
  couple: string;
  location: string;
  date: string;
  image: string;
  story: string;
  gallery: string[];
};

const weddingGallery = [
  mediaAssets.wedding.couplePortrait,
  mediaAssets.hero.ring,
  mediaAssets.wedding.ceremony,
  mediaAssets.wedding.table,
  mediaAssets.editorial.outdoorCouple,
  mediaAssets.wedding.family,
];

// Legacy hardcoded albums - kept for reference only
const legacyPortfolioAlbums: PortfolioAlbum[] = [
  {
    id: "1",
    category: "wedding",
    title: "Dani & Sinta",
    couple: "Dani & Sinta",
    location: "Four Seasons Jakarta",
    date: "20 Januari 2026",
    image: mediaAssets.wedding.couplePortrait,
    story:
      "Pernikahan Dani dan Sinta adalah perayaan cinta yang intim dan penuh kehangatan. Dikelilingi oleh keluarga dan teman terdekat, mereka berjanji untuk saling mendukung dalam setiap langkah kehidupan.",
    gallery: weddingGallery,
  },
  {
    id: "2",
    category: "wedding",
    title: "Naufal & Kirana",
    couple: "Naufal & Kirana",
    location: "The Langham Jakarta",
    date: "28 Desember 2025",
    image: mediaAssets.hero.akad,
    story: "Rangkaian akad yang hangat, dirawat lewat detail keluarga, gesture kecil, dan ritme dokumentasi yang tenang.",
    gallery: [mediaAssets.hero.akad, ...weddingGallery.slice(0, 5)],
  },
  {
    id: "3",
    category: "wedding",
    title: "Arga & Meira",
    couple: "Arga & Meira",
    location: "Plataran Menteng",
    date: "18 Desember 2025",
    image: mediaAssets.wedding.detailPortrait,
    story: "Cerita wedding yang klasik dan lembut, dengan fokus pada prosesi, detail cincin, dan potret pasangan.",
    gallery: [mediaAssets.wedding.detailPortrait, ...weddingGallery.slice(0, 5)],
  },
  {
    id: "4",
    category: "wedding",
    title: "Rizky & Anindya",
    couple: "Rizky & Anindya",
    location: "Ayana Midplaza",
    date: "30 November 2025",
    image: mediaAssets.wedding.table,
    story: "Perayaan formal yang tetap personal, diabadikan melalui portrait keluarga, dekorasi pelaminan, dan detail seremoni.",
    gallery: [mediaAssets.wedding.table, ...weddingGallery.slice(0, 5)],
  },
  {
    id: "5",
    category: "prewed-studio",
    title: "Rama & Dita",
    couple: "Rama & Dita",
    location: "Studio Danivisual",
    date: "15 Januari 2026",
    image: mediaAssets.wedding.ringPortrait,
    story: "Sesi prewedding studio dengan arahan pose yang tenang, fokus pada chemistry pasangan dan detail editorial.",
    gallery: [mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait, mediaAssets.hero.ring, mediaAssets.wedding.couplePortrait],
  },
  {
    id: "6",
    category: "prewed-outdoor",
    title: "Andi & Maya",
    couple: "Andi & Maya",
    location: "Bromo, Jawa Timur",
    date: "10 Januari 2026",
    image: mediaAssets.editorial.outdoorCouple,
    story: "Prewedding outdoor dengan cahaya natural dan lanskap terbuka, dibuat untuk terasa cinematic namun tetap personal.",
    gallery: [mediaAssets.editorial.outdoorCouple, mediaAssets.hero.ring, mediaAssets.hero.moment, mediaAssets.wedding.ringPortrait],
  },
  { id: "7", category: "prewed-studio", title: "Bagas & Livia", couple: "Bagas & Livia", location: "Studio Editorial Danivisual", date: "9 November 2025", image: mediaAssets.hero.ring, story: "Sesi editorial studio yang bersih, modern, dan diarahkan untuk menghasilkan potret pasangan yang timeless.", gallery: [mediaAssets.hero.ring, mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait] },
  { id: "8", category: "prewed-outdoor", title: "Fajar & Sari", couple: "Fajar & Sari", location: "Taman Suropati", date: "22 Desember 2025", image: mediaAssets.wedding.family, story: "Sesi outdoor ringan dengan pendekatan natural dan dokumenter.", gallery: [mediaAssets.wedding.family, mediaAssets.editorial.outdoorCouple, mediaAssets.hero.moment] },
  { id: "9", category: "event", title: "Corporate Gala Night", couple: "Corporate Gala", location: "Grand Hyatt Jakarta", date: "5 Januari 2026", image: mediaAssets.wedding.group, story: "Dokumentasi event yang menangkap ambience, interaksi tamu, dan momen utama acara.", gallery: [mediaAssets.wedding.group, mediaAssets.wedding.family, mediaAssets.wedding.table] },
  { id: "10", category: "event", title: "Private Engagement Dinner", couple: "Engagement Dinner", location: "Park Hyatt Jakarta", date: "24 Desember 2025", image: mediaAssets.wedding.table, story: "Engagement dinner dengan visual hangat, intim, dan detail dekorasi yang rapi.", gallery: [mediaAssets.wedding.table, mediaAssets.wedding.ceremony, mediaAssets.wedding.family] },
  { id: "11", category: "event", title: "Luxury Product Dinner", couple: "Product Dinner", location: "The Dharmawangsa", date: "16 Desember 2025", image: mediaAssets.wedding.ceremony, story: "Event dinner elegan dengan dokumentasi detail program dan atmosfer ruang.", gallery: [mediaAssets.wedding.ceremony, mediaAssets.wedding.table, mediaAssets.wedding.group] },
  { id: "12", category: "event", title: "Family Celebration", couple: "Family Celebration", location: "InterContinental Jakarta", date: "12 Desember 2025", image: mediaAssets.wedding.family, story: "Perayaan keluarga yang dirangkai dengan momen candid dan portrait hangat.", gallery: [mediaAssets.wedding.family, mediaAssets.wedding.group, mediaAssets.wedding.couplePortrait] },
  { id: "13", category: "studio", title: "Alya Portrait Session", couple: "Alya Portrait", location: "Studio Danivisual", date: "3 Desember 2025", image: mediaAssets.wedding.ringPortrait, story: "Portrait studio dengan lighting rapi dan arahan visual yang elegan.", gallery: [mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait, mediaAssets.hero.ring] },
  { id: "14", category: "studio", title: "Rendra Family Portrait", couple: "Rendra Family", location: "Studio Danivisual", date: "29 November 2025", image: mediaAssets.wedding.family, story: "Sesi keluarga dengan komposisi bersih dan ekspresi natural.", gallery: [mediaAssets.wedding.family, mediaAssets.wedding.group, mediaAssets.wedding.couplePortrait] },
  { id: "15", category: "studio", title: "Editorial Couple Portrait", couple: "Editorial Couple", location: "Studio Danivisual", date: "19 November 2025", image: mediaAssets.wedding.couplePortrait, story: "Portrait pasangan dengan gaya editorial yang sederhana dan timeless.", gallery: [mediaAssets.wedding.couplePortrait, mediaAssets.wedding.ringPortrait, mediaAssets.wedding.detailPortrait] },
  { id: "16", category: "studio", title: "Personal Branding Set", couple: "Personal Branding", location: "Studio Danivisual", date: "11 November 2025", image: mediaAssets.hero.moment, story: "Set personal branding dengan visual profesional dan tetap personal.", gallery: [mediaAssets.hero.moment, mediaAssets.hero.ring, mediaAssets.wedding.ringPortrait] },
  { id: "17", category: "peristiwa-lainnya", title: "Siraman Intimate", couple: "Siraman Intimate", location: "Private Residence", date: "7 November 2025", image: mediaAssets.wedding.ceremony, story: "Prosesi siraman intimate dengan dokumentasi detail budaya dan keluarga.", gallery: [mediaAssets.wedding.ceremony, mediaAssets.wedding.family, mediaAssets.wedding.table] },
  { id: "18", category: "peristiwa-lainnya", title: "Pengajian Keluarga", couple: "Pengajian Keluarga", location: "South Jakarta", date: "2 November 2025", image: mediaAssets.wedding.group, story: "Pengajian keluarga yang hangat, tenang, dan penuh momen personal.", gallery: [mediaAssets.wedding.group, mediaAssets.wedding.family, mediaAssets.wedding.ceremony] },
  { id: "19", category: "peristiwa-lainnya", title: "Lamaran Elegant", couple: "Lamaran Elegant", location: "Private Garden", date: "24 Oktober 2025", image: mediaAssets.hero.ring, story: "Lamaran elegan dengan detail dekorasi dan gesture keluarga yang dekat.", gallery: [mediaAssets.hero.ring, mediaAssets.wedding.table, mediaAssets.wedding.couplePortrait] },
  { id: "20", category: "peristiwa-lainnya", title: "Family Milestone", couple: "Family Milestone", location: "Jakarta Selatan", date: "18 Oktober 2025", image: mediaAssets.wedding.family, story: "Milestone keluarga yang didokumentasikan dengan pendekatan hangat dan timeless.", gallery: [mediaAssets.wedding.family, mediaAssets.wedding.group, mediaAssets.wedding.couplePortrait] },
];

function normalizeCategory(category: string) {
  const normalized = category.trim().toLowerCase();

  if (normalized.includes("prewed") || normalized.includes("engagement")) return "prewed-studio";
  if (normalized.includes("event")) return "event";
  if (normalized.includes("studio") || normalized.includes("portrait")) return "studio";
  if (normalized.includes("lain") || normalized.includes("other")) return "peristiwa-lainnya";
  if (normalized.includes("wedding")) return "wedding";

  return normalized.replace(/\s+/g, "-");
}

function formatAlbumDate(date: string) {
  if (!date) return "";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return date;

  return parsed.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function toPortfolioAlbum(album: Album, index: number): PortfolioAlbum {
  const fallback = legacyPortfolioAlbums[index % legacyPortfolioAlbums.length];
  const galleryImages = album.galleryImages?.length ? album.galleryImages : album.images;
  const image = album.coverImage || galleryImages?.[0] || fallback?.image;
  const gallery = galleryImages?.length ? galleryImages : fallback?.gallery;

  return {
    id: album.slug || album.id,
    category: normalizeCategory(album.category),
    title: album.title || album.name || fallback?.title || "",
    couple: album.coupleName || album.name || fallback?.couple || "",
    location: album.location || fallback?.location || "",
    date: formatAlbumDate(album.eventDate || album.date) || fallback?.date || "",
    image,
    story: album.story || fallback?.story || "",
    gallery: gallery?.length ? gallery : [image],
  };
}

export function getPortfolioAlbums(adminAlbums: Album[] = []) {
  const usableAdminAlbums = adminAlbums
    .filter(album => !/^album-[12]$/.test(album.id))
    .filter(album => album.isPublished)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (usableAdminAlbums.length === 0) return legacyPortfolioAlbums;

  return usableAdminAlbums.map(toPortfolioAlbum);
}

// Also export shared default portfolios for external use
export { DEFAULT_PORTFOLIOS } from "./defaultPortfolio";

export function findPortfolioAlbum(id: string | undefined, adminAlbums: Album[] = []) {
  const albums = getPortfolioAlbums(adminAlbums);
  return albums.find((album) => album.id === id) || albums[0] || legacyPortfolioAlbums[0];
}
