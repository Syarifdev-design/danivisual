import { createContext, ReactNode, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { useAdmin } from "./AdminContext";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabaseClient";

export interface ContentField {
  id: string;
  label: string;
  value: string;
  type?: "text" | "textarea" | "url" | "image" | "video" | "gallery";
  helper?: string;
}

export interface ContentSection {
  id: string;
  title: string;
  description: string;
  fields: ContentField[];
}

export type ContentStatus = "draft" | "published";

export interface SeoMeta {
  title: string;
  description: string;
  keywords?: string;
  canonicalPath?: string;
  ogImage?: string;
}

export interface ContentMenu {
  id: string;
  label: string;
  description: string;
  status?: ContentStatus;
  seo?: SeoMeta;
  updatedAt?: string;
  publishedAt?: string;
  sections: ContentSection[];
}

interface ImageStorage {
  [key: string]: string;
}

interface ContentContextType {
  content: ContentMenu[];
  images: ImageStorage;
  isLoading: boolean;
  isSupabaseConnected: boolean;
  getField: (menuId: string, sectionId: string, fieldId: string, fallback?: string) => string;
  getImage: (fieldId: string, fallback?: string) => string;
  updateField: (menuId: string, sectionId: string, fieldId: string, value: string) => void;
  updateImage: (fieldId: string, url: string) => void;
  deleteImage: (fieldId: string) => void;
  uploadImage: (fieldId: string, file: File) => Promise<string>;
  updateMenuMeta: (menuId: string, updates: Partial<Pick<ContentMenu, "status" | "seo">>) => void;
  publishMenu: (menuId: string) => void;
  reorderSections: (menuId: string, sectionIds: string[]) => void;
  exportBackup: () => string;
  importBackup: (payload: string) => void;
  resetContent: () => void;
  resetImages: () => void;
  resetAll: () => void;
  refreshContent: () => Promise<void>;
}

const CONTENT_KEY = "danivisual_admin_content_v1";
const IMAGE_KEY = "danivisual_admin_images_v1";
const MAX_SIZE = 5 * 1024 * 1024;

const defaultSeoByMenu: Record<string, SeoMeta> = {
  home: {
    title: "Danivisual Wedding & Prewedding Story",
    description: "Dokumentasi wedding, prewedding, event, dan studio dengan visual elegan dan timeless.",
    keywords: "danivisual, wedding photographer, prewedding, pacitan",
    canonicalPath: "/",
  },
  portfolio: {
    title: "Portofolio Danivisual",
    description: "Cerita visual wedding, prewedding, event, studio, dan momen istimewa dari Danivisual.",
    keywords: "portfolio wedding, portfolio prewedding, danivisual",
    canonicalPath: "/portfolio",
  },
  services_page: {
    title: "Layanan Dokumentasi Danivisual",
    description: "Pilihan layanan dokumentasi wedding, prewedding, event, studio, dan peristiwa lainnya.",
    keywords: "layanan dokumentasi, wedding, prewedding, event",
    canonicalPath: "/services",
  },
  packages: {
    title: "Paket Dokumentasi Danivisual",
    description: "Pilih paket dokumentasi foto dan video sesuai kebutuhan acara Anda.",
    keywords: "paket wedding, harga wedding, paket prewedding",
    canonicalPath: "/packages",
  },
  faq: {
    title: "FAQ Danivisual",
    description: "Jawaban pertanyaan seputar reservasi, pembayaran, paket, proses dokumentasi, dan pengiriman hasil.",
    keywords: "faq danivisual, booking wedding, pembayaran dp",
    canonicalPath: "/faq",
  },
  about: {
    title: "Tentang Danivisual",
    description: "Kenali Danivisual, studio dokumentasi visual untuk wedding, prewedding, dan momen personal.",
    keywords: "tentang danivisual, studio fotografi",
    canonicalPath: "/about",
  },
  contact: {
    title: "Kontak Danivisual",
    description: "Hubungi tim Danivisual untuk konsultasi wedding, prewedding, event, dan studio.",
    keywords: "kontak danivisual, whatsapp danivisual",
    canonicalPath: "/contact",
  },
};

// Complete Home Page Content
const defaultContent: ContentMenu[] = [
  {
    id: "home",
    label: "Home Page",
    description: "Konten halaman utama",
    sections: [
      {
        id: "hero",
        title: "Hero Slides",
        description: "Slideshow hero",
        fields: [
          { id: "home_slide_1", label: "Slide 1 Image", type: "image" },
          { id: "home_slide_2", label: "Slide 2 Image", type: "image" },
          { id: "home_slide_3", label: "Slide 3 Image", type: "image" },
          { id: "home_slide_4", label: "Slide 4 Image", type: "image" },
          { id: "home_slide_5", label: "Slide 5 Image", type: "image" },
          { id: "home_slide_6", label: "Slide 6 Image", type: "image" },
          { id: "home_slide_7", label: "Slide 7 Image", type: "image" },
          { id: "home_slide_8", label: "Slide 8 Image", type: "image" },
          { id: "home_hero_kicker", label: "Hero Kicker", value: "SIDE BY SIDE" },
          { id: "home_hero_title", label: "Hero Title", value: "DANIVISUAL WEDDING & PREWEDDING STORY", type: "textarea" },
        ],
      },
      {
        id: "featured_stories",
        title: "Featured Stories",
        description: "Cerita visual di homepage",
        fields: [
          // Header
          { id: "home_featured_eyebrow", label: "Featured Eyebrow", value: "Featured Stories" },
          { id: "home_featured_title", label: "Featured Title", value: "Cerita Terpilih" },
          { id: "home_featured_desc", label: "Featured Description", value: "Kurasi cerita wedding dan editorial", type: "textarea" },
          // Story 1
          { id: "home_story_1_category", label: "Story 1 Category", value: "WEDDING" },
          { id: "home_story_1_title", label: "Story 1 Title", value: "Dani & Sinta" },
          { id: "home_story_1_location", label: "Story 1 Location", value: "Four Seasons Jakarta" },
          { id: "home_story_1_date", label: "Story 1 Date", value: "20 Januari 2026" },
          { id: "home_story_1_image", label: "Story 1 Image", type: "image" },
          // Story 2
          { id: "home_story_2_category", label: "Story 2 Category", value: "PREWED STUDIO" },
          { id: "home_story_2_title", label: "Story 2 Title", value: "Rama & Dita" },
          { id: "home_story_2_location", label: "Story 2 Location", value: "Studio Danivisual" },
          { id: "home_story_2_date", label: "Story 2 Date", value: "15 Januari 2026" },
          { id: "home_story_2_image", label: "Story 2 Image", type: "image" },
          // Story 3
          { id: "home_story_3_category", label: "Story 3 Category", value: "PREWED OUTDOOR" },
          { id: "home_story_3_title", label: "Story 3 Title", value: "Andi & Maya" },
          { id: "home_story_3_location", label: "Story 3 Location", value: "Bromo, Jawa Timur" },
          { id: "home_story_3_date", label: "Story 3 Date", value: "10 Januari 2026" },
          { id: "home_story_3_image", label: "Story 3 Image", type: "image" },
          // Story 4
          { id: "home_story_4_category", label: "Story 4 Category", value: "EVENT" },
          { id: "home_story_4_title", label: "Story 4 Title", value: "Corporate Gala Night" },
          { id: "home_story_4_location", label: "Story 4 Location", value: "Grand Hyatt Jakarta" },
          { id: "home_story_4_date", label: "Story 4 Date", value: "5 Januari 2026" },
          { id: "home_story_4_image", label: "Story 4 Image", type: "image" },
          // Story 5
          { id: "home_story_5_category", label: "Story 5 Category", value: "AKAD CEREMONY" },
          { id: "home_story_5_title", label: "Story 5 Title", value: "Naufal & Kirana" },
          { id: "home_story_5_location", label: "Story 5 Location", value: "The Langham Jakarta" },
          { id: "home_story_5_date", label: "Story 5 Date", value: "28 Desember 2025" },
          { id: "home_story_5_image", label: "Story 5 Image", type: "image" },
          // Story 6
          { id: "home_story_6_category", label: "Story 6 Category", value: "INTIMATE WEDDING" },
          { id: "home_story_6_title", label: "Story 6 Title", value: "Arga & Meira" },
          { id: "home_story_6_location", label: "Story 6 Location", value: "Plataran Menteng" },
          { id: "home_story_6_date", label: "Story 6 Date", value: "18 Desember 2025" },
          { id: "home_story_6_image", label: "Story 6 Image", type: "image" },
        ],
      },
      {
        id: "services",
        title: "Visual Services",
        description: "Layanan dokumentasi",
        fields: [
          { id: "home_services_eyebrow", label: "Services Eyebrow", value: "Services" },
          { id: "home_services_title", label: "Services Title", value: "Our Visual Experiences" },
          { id: "home_services_desc", label: "Services Description", value: "Pilihan layanan dibuat ringkas", type: "textarea" },
          // Wedding
          { id: "home_svc_wedding_title", label: "Wedding Title", value: "Wedding" },
          { id: "home_svc_wedding_desc", label: "Wedding Description", value: "Dokumentasi wedding dengan feel editorial", type: "textarea" },
          { id: "home_svc_wedding_label", label: "Wedding Label", value: "Signature" },
          { id: "home_svc_wedding_cta", label: "Wedding CTA", value: "Booking Wedding" },
          { id: "home_svc_wedding_image", label: "Wedding Image", type: "image" },
          // Prewedding
          { id: "home_svc_prewedding_title", label: "Prewedding Title", value: "Prewedding" },
          { id: "home_svc_prewedding_desc", label: "Prewedding Description", value: "Indoor atau outdoor dengan mood yang matang.", type: "textarea" },
          { id: "home_svc_prewedding_label", label: "Prewedding Label", value: "Editorial" },
          { id: "home_svc_prewedding_cta", label: "Prewedding CTA", value: "Explore" },
          { id: "home_svc_prewedding_image", label: "Prewedding Image", type: "image" },
          // Event
          { id: "home_svc_event_title", label: "Event Title", value: "Event" },
          { id: "home_svc_event_desc", label: "Event Description", value: "Celebration, gathering, dan corporate", type: "textarea" },
          { id: "home_svc_event_label", label: "Event Label", value: "Coverage" },
          { id: "home_svc_event_cta", label: "Event CTA", value: "Explore" },
          { id: "home_svc_event_image", label: "Event Image", type: "image" },
          // Studio
          { id: "home_svc_studio_title", label: "Studio Title", value: "Studio" },
          { id: "home_svc_studio_desc", label: "Studio Description", value: "Portrait, family, personal branding", type: "textarea" },
          { id: "home_svc_studio_label", label: "Studio Label", value: "Portrait" },
          { id: "home_svc_studio_cta", label: "Studio CTA", value: "Explore" },
          { id: "home_svc_studio_image", label: "Studio Image", type: "image" },
          // Lainnya
          { id: "home_svc_lainnya_title", label: "Lainnya Title", value: "Lainnya" },
          { id: "home_svc_lainnya_desc", label: "Lainnya Description", value: "Momen personal dan keluarga", type: "textarea" },
          { id: "home_svc_lainnya_label", label: "Lainnya Label", value: "Personal" },
          { id: "home_svc_lainnya_cta", label: "Lainnya CTA", value: "Explore" },
          { id: "home_svc_lainnya_image", label: "Lainnya Image", type: "image" },
        ],
      },
      {
        id: "cta",
        title: "CTA Banner",
        description: "Call to action",
        fields: [
          { id: "home_cta_eyebrow", label: "CTA Eyebrow", value: "Mulai Cerita Anda" },
          { id: "home_cta_title", label: "CTA Title", value: "Mari Ciptakan Visual Story Anda" },
          { id: "home_cta_desc", label: "CTA Description", value: "Ceritakan rencana wedding Anda", type: "textarea" },
          { id: "home_cta_btn_primary", label: "CTA Button Primary", value: "Lihat Paket" },
          { id: "home_cta_btn_secondary", label: "CTA Button Secondary", value: "Chat via WhatsApp" },
          { id: "home_cta_image", label: "CTA Background Image", type: "image" },
          { id: "home_cta_video", label: "CTA Background Video", type: "video" },
        ],
      },
      {
        id: "stats",
        title: "Statistics",
        description: "Angka statistik",
        fields: [
          { id: "home_stats_wedding_count", label: "Wedding Count", value: "150+" },
          { id: "home_stats_wedding_label", label: "Wedding Label", value: "Wedding" },
          { id: "home_stats_client_count", label: "Client Count", value: "200+" },
          { id: "home_stats_client_label", label: "Client Label", value: "Client Happy" },
          { id: "home_stats_year_count", label: "Year Count", value: "8+" },
          { id: "home_stats_year_label", label: "Year Label", value: "Tahun Pengalaman" },
        ],
      },
    ],
  },
  {
    id: "navigation",
    label: "Navigation",
    description: "Menu navigasi",
    sections: [
      {
        id: "menu",
        title: "Menu Items",
        description: "Label menu",
        fields: [
          { id: "nav_home", label: "Menu Beranda", value: "Beranda" },
          { id: "nav_portfolio", label: "Menu Portfolio", value: "Portofolio" },
          { id: "nav_services", label: "Menu Services", value: "Layanan" },
          { id: "nav_about", label: "Menu About", value: "Tentang" },
          { id: "nav_faq", label: "Menu FAQ", value: "FAQ" },
          { id: "nav_contact", label: "Menu Contact", value: "Kontak" },
          { id: "nav_reserve", label: "Button Reservasi", value: "Reservasi" },
          { id: "nav_login", label: "Menu Login", value: "Login" },
          { id: "nav_client_lounge", label: "Menu Client Lounge", value: "Ruang Klien" },
          { id: "nav_whatsapp_admin", label: "Mobile WhatsApp Button", value: "WhatsApp Admin" },
          { id: "navigation_mobile_menu_image", label: "Mobile Menu Image", type: "image" },
        ],
      },
    ],
  },
  {
    id: "portfolio",
    label: "Portfolio Page",
    description: "Halaman portfolio",
    sections: [
      {
        id: "intro",
        title: "Portfolio Intro",
        description: "Header portfolio",
        fields: [
          { id: "portfolio_eyebrow", label: "Eyebrow", value: "Karya Terpilih" },
          { id: "portfolio_title", label: "Title", value: "Portofolio" },
          { id: "portfolio_desc", label: "Description", value: "Cerita visual dari berbagai pernikahan, prewedding, dan momen istimewa yang kami dokumentasikan dengan pendekatan elegan dan timeless.", type: "textarea" },
          { id: "portfolio_image", label: "Cover Image", type: "image" },
        ],
      },
      {
        id: "filters",
        title: "Filter Labels",
        description: "Label filter kategori portfolio",
        fields: [
          { id: "portfolio_filter_all", label: "Filter: Semua", value: "Semua" },
          { id: "portfolio_filter_wedding", label: "Filter: Wedding", value: "Wedding" },
          { id: "portfolio_filter_prewedding", label: "Filter: Prewedding", value: "Prewedding" },
          { id: "portfolio_filter_event", label: "Filter: Event", value: "Event" },
          { id: "portfolio_filter_studio", label: "Filter: Studio", value: "Studio" },
          { id: "portfolio_filter_lainnya", label: "Filter: Peristiwa Lainnya", value: "Peristiwa Lainnya" },
        ],
      },
      {
        id: "labels",
        title: "UI Labels",
        description: "Label teks untuk UI portfolio",
        fields: [
          { id: "portfolio_view_story", label: "View Story Text", value: "Lihat Cerita" },
          { id: "portfolio_view_packages", label: "View Packages Button", value: "Lihat Paket" },
          { id: "portfolio_back", label: "Back Button", value: "Kembali ke Portofolio" },
          { id: "portfolio_story_title", label: "Story Section Title", value: "Cerita Mereka" },
          { id: "portfolio_related_title", label: "Related Albums Title", value: "Album Serupa" },
        ],
      },
    ],
  },
  {
    id: "packages",
    label: "Packages Page",
    description: "Halaman paket",
    sections: [
      {
        id: "intro",
        title: "Packages Intro",
        description: "Header packages",
        fields: [
          { id: "packages_eyebrow", label: "Eyebrow", value: "Reserve Date" },
          { id: "packages_title", label: "Title", value: "Pilih Paket Dokumentasi" },
          { id: "packages_desc", label: "Description", value: "Pilih kebutuhan dokumentasi Anda", type: "textarea" },
          { id: "packages_image", label: "Cover Image", type: "image" },
        ],
      },
    ],
  },
  {
    id: "services_page",
    label: "Services Page",
    description: "Halaman layanan",
    sections: [
      {
        id: "intro",
        title: "Services Intro",
        description: "Header services",
        fields: [
          { id: "services_page_eyebrow", label: "Eyebrow", value: "Visual Experiences" },
          { id: "services_page_title", label: "Title", value: "Pilihan Dokumentasi" },
          { id: "services_page_desc", label: "Description", value: "Layanan dokumentasi untuk berbagai kebutuhan", type: "textarea" },
          { id: "services_page_image", label: "Cover Image", type: "image" },
        ],
      },
      {
        id: "wedding",
        title: "Wedding Service",
        description: "Layanan wedding",
        fields: [
          { id: "services_wedding_eyebrow", label: "Eyebrow", value: "Signature" },
          { id: "services_wedding_title", label: "Title", value: "Wedding" },
          { id: "services_wedding_isActive", label: "Active", value: "true" },
          { id: "services_wedding_desc", label: "Short Description", value: "Dokumentasi lengkap wedding dengan feel editorial", type: "textarea" },
          { id: "services_wedding_narrative", label: "Narrative", value: "Paket lengkap dokumentasi wedding dari persiapan hingga resepsi. Dengan pendekatan cinematic dan editorial, kami mengabadikan setiap momen dengan estetika yang tinggi dan kehangatan yang autentik.", type: "textarea" },
          { id: "services_wedding_duration", label: "Duration", value: "Full Day Coverage" },
          { id: "services_wedding_highlight", label: "Highlight", value: "Cinematic Edit, 2nd Shooter" },
          { id: "services_wedding_access", label: "Access", value: "Digital Gallery + Printed Album" },
          { id: "services_wedding_image_1", label: "Image 1", type: "image" },
          { id: "services_wedding_image_2", label: "Image 2", type: "image" },
          { id: "services_wedding_include_1", label: "Include 1", value: "Full day documentation" },
          { id: "services_wedding_include_2", label: "Include 2", value: "Cinematic photo editing" },
          { id: "services_wedding_include_3", label: "Include 3", value: "Online gallery" },
          { id: "services_wedding_include_4", label: "Include 4", value: "Printed album" },
          { id: "services_wedding_include_5", label: "Include 5", value: "2nd photographer" },
        ],
      },
      {
        id: "prewedding",
        title: "Prewedding Service",
        description: "Layanan prewedding",
        fields: [
          { id: "services_prewedding_eyebrow", label: "Eyebrow", value: "Editorial" },
          { id: "services_prewedding_title", label: "Title", value: "Prewedding" },
          { id: "services_prewedding_isActive", label: "Active", value: "true" },
          { id: "services_prewedding_desc", label: "Short Description", value: "Konsep prewedding indoor atau outdoor", type: "textarea" },
          { id: "services_prewedding_narrative", label: "Narrative", value: "Sesi pemotretan pra-wedding dengan konsep yang disesuaikan dengan keinginan Anda. Baik indoor di studio maupun outdoor dengan lokasi yang dipilih, kami memastikan hasilnya estetik dan bermakna.", type: "textarea" },
          { id: "services_prewedding_duration", label: "Duration", value: "4 Hours Session" },
          { id: "services_prewedding_highlight", label: "Highlight", value: "Multiple Concepts, Stylist" },
          { id: "services_prewedding_access", label: "Access", value: "Digital + Print Rights" },
          { id: "services_prewedding_image_1", label: "Image 1", type: "image" },
          { id: "services_prewedding_image_2", label: "Image 2", type: "image" },
          { id: "services_prewedding_include_1", label: "Include 1", value: "4 hours session" },
          { id: "services_prewedding_include_2", label: "Include 2", value: "Multiple locations" },
          { id: "services_prewedding_include_3", label: "Include 3", value: "Concept planning" },
          { id: "services_prewedding_include_4", label: "Include 4", value: "Stylist available" },
          { id: "services_prewedding_include_5", label: "Include 5", value: "50+ edited photos" },
        ],
      },
      {
        id: "event",
        title: "Event Service",
        description: "Layanan event",
        fields: [
          { id: "services_event_eyebrow", label: "Eyebrow", value: "Coverage" },
          { id: "services_event_title", label: "Title", value: "Event" },
          { id: "services_event_isActive", label: "Active", value: "true" },
          { id: "services_event_desc", label: "Short Description", value: "Dokumentasi event dan celebration", type: "textarea" },
          { id: "services_event_narrative", label: "Narrative", value: "Layanan dokumentasi untuk berbagai jenis event - dari celebration personal hingga corporate gathering. Dengan fleksibilitas dalam coverage, kami menangkap esensi setiap acara.", type: "textarea" },
          { id: "services_event_duration", label: "Duration", value: "Flexible Hours" },
          { id: "services_event_highlight", label: "Highlight", value: "Quick Delivery, Multi-angle" },
          { id: "services_event_access", label: "Access", value: "Digital Gallery" },
          { id: "services_event_image_1", label: "Image 1", type: "image" },
          { id: "services_event_image_2", label: "Image 2", type: "image" },
          { id: "services_event_include_1", label: "Include 1", value: "Flexible coverage hours" },
          { id: "services_event_include_2", label: "Include 2", value: "Quick turnaround" },
          { id: "services_event_include_3", label: "Include 3", value: "Multiple angles" },
          { id: "services_event_include_4", label: "Include 4", value: "Online gallery" },
          { id: "services_event_include_5", label: "Include 5", value: "Social media ready" },
        ],
      },
      {
        id: "studio",
        title: "Studio Service",
        description: "Layanan studio",
        fields: [
          { id: "services_studio_eyebrow", label: "Eyebrow", value: "Portrait" },
          { id: "services_studio_title", label: "Title", value: "Studio" },
          { id: "services_studio_isActive", label: "Active", value: "true" },
          { id: "services_studio_desc", label: "Short Description", value: "Portrait, family, personal branding", type: "textarea" },
          { id: "services_studio_narrative", label: "Narrative", value: "Sesi pemotretan di studio dengan lighting profesional untuk portrait, family, atau personal branding. Dengan peralatan studio yang lengkap, kami menghasilkan gambar berkualitas tinggi.", type: "textarea" },
          { id: "services_studio_duration", label: "Duration", value: "2 Hours Session" },
          { id: "services_studio_highlight", label: "Highlight", value: "Professional Lighting, Retouching" },
          { id: "services_studio_access", label: "Access", value: "Digital + 10 Prints" },
          { id: "services_studio_image_1", label: "Image 1", type: "image" },
          { id: "services_studio_image_2", label: "Image 2", type: "image" },
          { id: "services_studio_include_1", label: "Include 1", value: "2 hours studio session" },
          { id: "services_studio_include_2", label: "Include 2", value: "Professional lighting" },
          { id: "services_studio_include_3", label: "Include 3", value: "Basic retouching" },
          { id: "services_studio_include_4", label: "Include 4", value: "30+ edited photos" },
          { id: "services_studio_include_5", label: "Include 5", value: "10 printed photos" },
        ],
      },
      {
        id: "lainnya",
        title: "Lainnya Service",
        description: "Layanan lainnya",
        fields: [
          { id: "services_lainnya_eyebrow", label: "Eyebrow", value: "Personal" },
          { id: "services_lainnya_title", label: "Title", value: "Lainnya" },
          { id: "services_lainnya_isActive", label: "Active", value: "true" },
          { id: "services_lainnya_desc", label: "Short Description", value: "Momen personal dan keluarga", type: "textarea" },
          { id: "services_lainnya_narrative", label: "Narrative", value: "Untuk momen-momen personal seperti anniversary, family gathering, atau sekadar capturing everyday life. Fleksibel dan customizable sesuai kebutuhan Anda.", type: "textarea" },
          { id: "services_lainnya_duration", label: "Duration", value: "Custom Session" },
          { id: "services_lainnya_highlight", label: "Highlight", value: "Custom Concept, Flexible" },
          { id: "services_lainnya_access", label: "Access", value: "Digital Only" },
          { id: "services_lainnya_image_1", label: "Image 1", type: "image" },
          { id: "services_lainnya_image_2", label: "Image 2", type: "image" },
          { id: "services_lainnya_include_1", label: "Include 1", value: "Custom session duration" },
          { id: "services_lainnya_include_2", label: "Include 2", value: "Tailored concept" },
          { id: "services_lainnya_include_3", label: "Include 3", value: "Online gallery" },
          { id: "services_lainnya_include_4", label: "Include 4", value: "Flexible editing style" },
          { id: "services_lainnya_include_5", label: "Include 5", value: "Digital delivery" },
        ],
      },
    ],
  },
  {
    id: "faq",
    label: "FAQ Page",
    description: "Halaman FAQ",
    sections: [
      {
        id: "intro",
        title: "FAQ Intro",
        description: "Header FAQ",
        fields: [
          { id: "faq_eyebrow", label: "Eyebrow", value: "Panduan Klien" },
          { id: "faq_title", label: "Title", value: "Pertanyaan yang Sering Dibahas" },
          { id: "faq_desc", label: "Description", value: "Jawaban ringkas untuk reservasi dan paket", type: "textarea" },
          { id: "faq_image", label: "Cover Image", type: "image" },
        ],
      },
    ],
  },
  {
    id: "about",
    label: "About Page",
    description: "Halaman tentang",
    sections: [
      {
        id: "intro",
        title: "About Intro",
        description: "Header about",
        fields: [
          { id: "about_eyebrow", label: "Eyebrow", value: "Tentang Studio" },
          { id: "about_title", label: "Title", value: "Setiap Bingkai Menyimpan Rasa" },
          { id: "about_desc", label: "Description", value: "Danivisual hadir untuk mengabadikan cerita personal", type: "textarea" },
          { id: "about_image", label: "Cover Image", type: "image" },
        ],
      },
      {
        id: "brand_story",
        title: "Brand Story",
        description: "Cerita brand",
        fields: [
          { id: "about_brand_paragraph_1", label: "Paragraph 1", value: "Setiap foto yang kami hasilkan bukan sekadar dokumentasi visual.", type: "textarea" },
          { id: "about_brand_paragraph_2", label: "Paragraph 2", value: "Dengan pengalaman lebih dari 8 tahun, kami memahami bahwa setiap pasangan memiliki cerita unik yang layak untuk dikenang.", type: "textarea" },
          { id: "about_brand_paragraph_3", label: "Paragraph 3", value: "Kami percaya bahwa sebuah foto yang baik adalah yang mampu membangkitkan emosi dan mempertahankan kehangatan momen aslinya.", type: "textarea" },
        ],
      },
      {
        id: "philosophy",
        title: "Philosophy",
        description: "Nilai filosofi studio",
        fields: [
          { id: "about_philosophy_heart_title", label: "Heart Title", value: "Passion" },
          { id: "about_philosophy_heart_desc", label: "Heart Description", value: "Kami mengerjakan setiap proyek dengan ketulusan", type: "textarea" },
          { id: "about_philosophy_eye_title", label: "Eye Title", value: "Detail" },
          { id: "about_philosophy_eye_desc", label: "Eye Description", value: "Memperhatikan setiap detail momen", type: "textarea" },
          { id: "about_philosophy_sparkles_title", label: "Sparkles Title", value: "Quality" },
          { id: "about_philosophy_sparkles_desc", label: "Sparkles Description", value: "Standar kualitas tinggi di setiap deliverable", type: "textarea" },
          { id: "about_philosophy_users_title", label: "Users Title", value: "Connection" },
          { id: "about_philosophy_users_desc", label: "Users Description", value: "Membangun koneksi emosional dengan klien", type: "textarea" },
        ],
      },
      {
        id: "testimonials",
        title: "Testimonials",
        description: "Testimoni klien",
        fields: [
          // Testimonial 1
          { id: "about_testimonial_1_name", label: "Testimonial 1 Name", value: "Rina & Budi" },
          { id: "about_testimonial_1_wedding", label: "Testimonial 1 Wedding Type", value: "Akad Nikah" },
          { id: "about_testimonial_1_quote", label: "Testimonial 1 Quote", value: "Hasil foto sangat memuaskan! Tim sangat profesional dan hasilnya melebihi ekspektasi kami.", type: "textarea" },
          { id: "about_testimonial_1_image", label: "Testimonial 1 Image", type: "image" },
          // Testimonial 2
          { id: "about_testimonial_2_name", label: "Testimonial 2 Name", value: "Anisa & Dimas" },
          { id: "about_testimonial_2_wedding", label: "Testimonial 2 Wedding Type", value: "Prewedding" },
          { id: "about_testimonial_2_quote", label: "Testimonial 2 Quote", value: "Sangat senang dengan hasil foto prewedding. Konsep yang dihasilkan sangat sesuai dengan keinginan kami.", type: "textarea" },
          { id: "about_testimonial_2_image", label: "Testimonial 2 Image", type: "image" },
          // Testimonial 3
          { id: "about_testimonial_3_name", label: "Testimonial 3 Name", value: "Sarah & Felix" },
          { id: "about_testimonial_3_wedding", label: "Testimonial 3 Wedding Type", value: "Garden Wedding" },
          { id: "about_testimonial_3_quote", label: "Testimonial 3 Quote", value: "Dokumentasi yang sangat lengkap dan beautiful. Setiap momen tersimpan dengan sempurna.", type: "textarea" },
          { id: "about_testimonial_3_image", label: "Testimonial 3 Image", type: "image" },
        ],
      },
      {
        id: "stats",
        title: "Statistics",
        description: "Angka statistik untuk About Page",
        fields: [
          { id: "about_stats_couples_count", label: "Couples Count", value: "500+" },
          { id: "about_stats_couples_label", label: "Couples Label", value: "Couples Documented" },
          { id: "about_stats_years_count", label: "Years Count", value: "7+" },
          { id: "about_stats_years_label", label: "Years Label", value: "Years Experience" },
          { id: "about_stats_photos_count", label: "Photos Count", value: "50K+" },
          { id: "about_stats_photos_label", label: "Photos Label", value: "Photos Captured" },
          { id: "about_stats_satisfaction_count", label: "Satisfaction Count", value: "100%" },
          { id: "about_stats_satisfaction_label", label: "Satisfaction Label", value: "Client Satisfaction" },
        ],
      },
      {
        id: "why_choose_us",
        title: "Why Choose Us",
        description: "Alasan memilih kami",
        fields: [
          { id: "about_why_1", label: "Reason 1", value: "A professional photography team with 7+ years of wedding industry experience", type: "textarea" },
          { id: "about_why_2", label: "Reason 2", value: "A modern editorial style that feels elegant, warm, and timeless", type: "textarea" },
          { id: "about_why_3", label: "Reason 3", value: "Full editing control for consistent, premium-quality results", type: "textarea" },
          { id: "about_why_4", label: "Reason 4", value: "A clear client portal for booking details and progress updates", type: "textarea" },
          { id: "about_why_5", label: "Reason 5", value: "High-resolution files without watermark", type: "textarea" },
          { id: "about_why_6", label: "Reason 6", value: "Premium printed albums with refined finishing", type: "textarea" },
          { id: "about_why_7", label: "Reason 7", value: "Responsive communication through WhatsApp and dashboard", type: "textarea" },
          { id: "about_why_8", label: "Reason 8", value: "A clear, transparent timeline from reservation to delivery", type: "textarea" },
        ],
      },
    ],
  },
  {
    id: "contact",
    label: "Contact Page",
    description: "Halaman kontak",
    sections: [
      {
        id: "intro",
        title: "Contact Intro",
        description: "Header contact",
        fields: [
          { id: "contact_eyebrow", label: "Eyebrow", value: "Mulai Percakapan" },
          { id: "contact_title", label: "Title", value: "Konsultasi dengan Tim Kami" },
          { id: "contact_desc", label: "Description", value: "Ceritakan rencana wedding Anda", type: "textarea" },
        ],
      },
      {
        id: "info",
        title: "Contact Information",
        description: "WhatsApp, Instagram, YouTube, alamat studio",
        fields: [
          { id: "whatsapp_label", label: "WhatsApp Label", value: "WhatsApp" },
          { id: "whatsapp_number", label: "WhatsApp Number", value: "082337279636" },
          { id: "instagram_label", label: "Instagram Label", value: "Instagram" },
          { id: "instagram_username", label: "Instagram Username", value: "@danivisual.photo" },
          { id: "youtube_label", label: "YouTube Label", value: "YouTube" },
          { id: "youtube_channel", label: "YouTube Channel", value: "DANIVISUAL OFFICIAL" },
          { id: "address_label", label: "Address Label", value: "Alamat Studio" },
          { id: "address", label: "Address", value: "Utara lapangan, Mudah, Ngadirejan, Kec. Pringkuku, Kabupaten Pacitan, Jawa Timur 63552", type: "textarea" },
          { id: "maps_url", label: "Google Maps URL", value: "https://maps.app.goo.gl/iUyGZ5zmFTDUFQ5z5" },
        ],
      },
      {
        id: "form",
        title: "Contact Form",
        description: "Label dan placeholder form inquiry",
        fields: [
          { id: "title", label: "Form Title", value: "Kirim Inquiry" },
          { id: "name_placeholder", label: "Name Placeholder", value: "Nama" },
          { id: "email_placeholder", label: "Email Placeholder", value: "Email" },
          { id: "whatsapp_placeholder", label: "WhatsApp Placeholder", value: "WhatsApp" },
          { id: "service_type_placeholder", label: "Service Type Placeholder", value: "Jenis Layanan" },
          { id: "message_placeholder", label: "Message Placeholder", value: "Ceritakan rencana Anda" },
          { id: "submit_button", label: "Submit Button", value: "Kirim Inquiry" },
          { id: "packages_button", label: "Packages Button", value: "Lihat Semua Paket" },
          { id: "service_options", label: "Service Options", value: "Wedding,Prewedding,Event,Studio,Lainnya", helper: "Pisahkan dengan koma" },
        ],
      },
    ],
  },
  {
    id: "auth",
    label: "Auth Pages",
    description: "Halaman login dan register",
    sections: [
      {
        id: "media",
        title: "Auth Media",
        description: "Gambar halaman login dan register",
        fields: [
          { id: "login_background_image", label: "Login Background", type: "image" },
          { id: "register_background_image", label: "Register Background", type: "image" },
        ],
      },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    description: "Bagian footer",
    sections: [
      {
        id: "brand",
        title: "Footer Brand",
        description: "Brand footer",
        fields: [
          { id: "footer_brand_desc", label: "Brand Description", value: "Mengabadikan momen penuh rasa", type: "textarea" },
          { id: "footer_copyright", label: "Copyright", value: "Seluruh hak cipta dilindungi." },
        ],
      },
    ],
  },
];

const withMenuDefaults = (menu: ContentMenu): ContentMenu => ({
  ...menu,
  status: menu.status || "published",
  seo: { ...(defaultSeoByMenu[menu.id] || { title: menu.label, description: menu.description }), ...(menu.seo || {}) },
  updatedAt: menu.updatedAt || new Date().toISOString(),
  publishedAt: menu.publishedAt || new Date().toISOString(),
});

const cloneDefaults = (): ContentMenu[] => defaultContent.map(menu => withMenuDefaults({
  ...menu,
  sections: menu.sections.map(section => ({
    ...section,
    fields: section.fields.map(field => ({ ...field })),
  })),
}));

const mergeContent = (saved: ContentMenu[]): ContentMenu[] =>
  cloneDefaults().map(menu => {
    const savedMenu = saved.find(m => m.id === menu.id);
    if (!savedMenu) return menu;
    return withMenuDefaults({
      ...menu,
      status: savedMenu.status || menu.status,
      seo: { ...(menu.seo || {}), ...(savedMenu.seo || {}) },
      updatedAt: savedMenu.updatedAt || menu.updatedAt,
      publishedAt: savedMenu.publishedAt || menu.publishedAt,
      sections: menu.sections.map(section => {
        const savedSection = savedMenu.sections.find(s => s.id === section.id);
        if (!savedSection) return section;
        return {
          ...section,
          fields: section.fields.map(field => {
            const savedField = savedSection.fields.find(f => f.id === field.id);
            return savedField ? { ...field, value: savedField.value } : field;
          }),
        };
      }),
    });
  });

const ContentCtx = createContext<ContentContextType | undefined>(undefined);

const fieldAliases: Record<string, [string, string, string]> = {
  "navigation:main-menu:home": ["navigation", "menu", "nav_home"],
  "navigation:main-menu:portfolio": ["navigation", "menu", "nav_portfolio"],
  "navigation:main-menu:services": ["navigation", "menu", "nav_services"],
  "navigation:main-menu:about": ["navigation", "menu", "nav_about"],
  "navigation:main-menu:faq": ["navigation", "menu", "nav_faq"],
  "navigation:main-menu:contact": ["navigation", "menu", "nav_contact"],
  "navigation:actions:reserve": ["navigation", "menu", "nav_reserve"],
  "navigation:actions:login": ["navigation", "menu", "nav_login"],
  "navigation:actions:client-lounge": ["navigation", "menu", "nav_client_lounge"],
  "navigation:actions:whatsapp-admin": ["navigation", "menu", "nav_whatsapp_admin"],

  "portfolio:intro:eyebrow": ["portfolio", "intro", "portfolio_eyebrow"],
  "portfolio:intro:title": ["portfolio", "intro", "portfolio_title"],
  "portfolio:intro:description": ["portfolio", "intro", "portfolio_desc"],

  "packages:intro:eyebrow": ["packages", "intro", "packages_eyebrow"],
  "packages:intro:title": ["packages", "intro", "packages_title"],
  "packages:intro:description": ["packages", "intro", "packages_desc"],

  "services_page:intro:eyebrow": ["services_page", "intro", "services_page_eyebrow"],
  "services_page:intro:title": ["services_page", "intro", "services_page_title"],
  "services_page:intro:description": ["services_page", "intro", "services_page_desc"],

  "faq:intro:eyebrow": ["faq", "intro", "faq_eyebrow"],
  "faq:intro:title": ["faq", "intro", "faq_title"],
  "faq:intro:description": ["faq", "intro", "faq_desc"],

  "about:intro:eyebrow": ["about", "intro", "about_eyebrow"],
  "about:intro:title": ["about", "intro", "about_title"],
  "about:intro:description": ["about", "intro", "about_desc"],
  "about:philosophy:heart_title": ["about", "philosophy", "about_philosophy_heart_title"],
  "about:philosophy:heart_desc": ["about", "philosophy", "about_philosophy_heart_desc"],
  "about:philosophy:eye_title": ["about", "philosophy", "about_philosophy_eye_title"],
  "about:philosophy:eye_desc": ["about", "philosophy", "about_philosophy_eye_desc"],
  "about:philosophy:sparkles_title": ["about", "philosophy", "about_philosophy_sparkles_title"],
  "about:philosophy:sparkles_desc": ["about", "philosophy", "about_philosophy_sparkles_desc"],
  "about:philosophy:users_title": ["about", "philosophy", "about_philosophy_users_title"],
  "about:philosophy:users_desc": ["about", "philosophy", "about_philosophy_users_desc"],

  "contact:intro:eyebrow": ["contact", "intro", "contact_eyebrow"],
  "contact:intro:title": ["contact", "intro", "contact_title"],
  "contact:intro:description": ["contact", "intro", "contact_desc"],
  "contact:details:whatsapp-url": ["contact", "details", "whatsapp_url"],
  "contact:details:instagram-url": ["contact", "details", "instagram_url"],
  "contact:details:youtube-url": ["contact", "details", "youtube_url"],
  "contact:details:maps-url": ["contact", "details", "maps_url"],

  "footer:brand:description": ["footer", "brand", "footer_brand_desc"],
  "footer:copyright:text": ["footer", "brand", "footer_copyright"],
};

function findFieldValue(content: ContentMenu[], menuId: string, sectionId: string, fieldId: string): string | undefined {
  return content
    .find(m => m.id === menuId)
    ?.sections.find(s => s.id === sectionId)
    ?.fields.find(f => f.id === fieldId)
    ?.value;
}

function isMenuDraft(content: ContentMenu[], menuId: string) {
  return content.find(m => m.id === menuId)?.status === "draft";
}

function isPreviewMode() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("cmsPreview") === "1";
}

function isImageFieldInDraftMenu(content: ContentMenu[], fieldId: string) {
  return content.some(menu => menu.status === "draft" && menu.sections.some(section => section.fields.some(field => field.id === fieldId)));
}

function findMenuIdByField(content: ContentMenu[], fieldId: string) {
  return content.find(menu => menu.sections.some(section => section.fields.some(field => field.id === fieldId)))?.id;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const { mediaFiles } = useAdmin();
  const [content, setContent] = useState<ContentMenu[]>(() => cloneDefaults());
  const [images, setImages] = useState<ImageStorage>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // ============================================================================
  // Load Data from Supabase or localStorage
  // ============================================================================

  const loadFromSupabase = async (): Promise<{ content: ContentMenu[]; images: ImageStorage } | null> => {
    const client = getSupabaseClient();
    if (!client) return null;

    try {
      // Load content_fields
      const { data: fieldsData, error: fieldsError } = await client
        .from("content_fields")
        .select("menu_id, section_id, field_id, value");

      if (fieldsError) {
        console.warn("[ContentContext] Failed to load content_fields:", fieldsError.message);
        return null;
      }

      // Load content_images
      const { data: imagesData, error: imagesError } = await client
        .from("content_images")
        .select("field_id, url");

      if (imagesError) {
        console.warn("[ContentContext] Failed to load content_images:", imagesError.message);
        // Continue with images as empty
      }

      // Transform fields to content structure
      const fieldMap = new Map<string, Map<string, Map<string, string>>>();
      if (fieldsData) {
        for (const field of fieldsData) {
          if (!fieldMap.has(field.menu_id)) {
            fieldMap.set(field.menu_id, new Map());
          }
          const sectionMap = fieldMap.get(field.menu_id)!;
          if (!sectionMap.has(field.section_id)) {
            sectionMap.set(field.section_id, new Map());
          }
          sectionMap.get(field.section_id)!.set(field.field_id, field.value || "");
        }
      }

      // Merge with default structure
      const mergedContent = cloneDefaults().map(menu => ({
        ...menu,
        sections: menu.sections.map(section => ({
          ...section,
          fields: section.fields.map(field => ({
            ...field,
            value: fieldMap.get(menu.id)?.get(section.id)?.get(field.id) || field.value || "",
          })),
        })),
      }));

      // Transform images
      const loadedImages: ImageStorage = {};
      if (imagesData) {
        for (const img of imagesData) {
          loadedImages[img.field_id] = img.url;
        }
      }

      return { content: mergedContent, images: loadedImages };
    } catch (err) {
      console.error("[ContentContext] Supabase load error:", err);
      return null;
    }
  };

  const refreshContent = async () => {
    setIsLoading(true);

    // Try Supabase first
    if (isSupabaseConfigured()) {
      const supabaseData = await loadFromSupabase();
      if (supabaseData) {
        setContent(supabaseData.content);
        setImages(supabaseData.images);
        setIsSupabaseConnected(true);
        setIsLoading(false);
        return;
      }
    }

    // Fallback to localStorage
    setIsSupabaseConnected(false);
    const stored = localStorage.getItem(CONTENT_KEY);
    if (stored) {
      try {
        setContent(mergeContent(JSON.parse(stored)));
      } catch {
        setContent(cloneDefaults());
      }
    } else {
      setContent(cloneDefaults());
    }

    const storedImages = localStorage.getItem(IMAGE_KEY);
    if (storedImages) {
      try {
        setImages(JSON.parse(storedImages));
      } catch {
        setImages({});
      }
    }

    setIsLoading(false);
  };

  // Initial load
  useEffect(() => {
    refreshContent();
  }, []);

  // Sync to Supabase when content/images change (after initial load)
  useEffect(() => {
    if (isLoading || !isSupabaseConfigured()) return;

    const syncToSupabase = async () => {
      const client = getSupabaseClient();
      if (!client) return;

      try {
        // Sync content fields
        const fieldsToUpsert = content.flatMap(menu =>
          menu.sections.flatMap(section =>
            section.fields.map(field => ({
              menu_id: menu.id,
              section_id: section.id,
              field_id: field.id,
              value: field.value || "",
              updated_at: new Date().toISOString(),
            }))
          )
        );

        if (fieldsToUpsert.length > 0) {
          await client.from("content_fields").upsert(fieldsToUpsert, {
            onConflict: "menu_id,section_id,field_id",
          });
        }

        // Sync images
        const imagesToUpsert = Object.entries(images).map(([field_id, url]) => ({
          field_id,
          url,
          updated_at: new Date().toISOString(),
        }));

        if (imagesToUpsert.length > 0) {
          await client.from("content_images").upsert(imagesToUpsert, {
            onConflict: "field_id",
          });
        }
      } catch (err) {
        console.warn("[ContentContext] Sync to Supabase failed:", err);
      }
    };

    // Debounce sync
    const timeoutId = setTimeout(syncToSupabase, 1000);
    return () => clearTimeout(timeoutId);
  }, [content, images, isLoading]);

  // localStorage fallback (always sync)
  useEffect(() => {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
  }, [content]);

  useEffect(() => {
    localStorage.setItem(IMAGE_KEY, JSON.stringify(images));
  }, [images]);

  const getField = useCallback((menuId: string, sectionId: string, fieldId: string, fallback = ""): string => {
    if (isMenuDraft(content, menuId) && !isPreviewMode()) return fallback;

    const directValue = findFieldValue(content, menuId, sectionId, fieldId);
    if (directValue) return directValue;

    const alias = fieldAliases[`${menuId}:${sectionId}:${fieldId}`];
    if (alias) {
      const aliasValue = findFieldValue(content, alias[0], alias[1], alias[2]);
      if (aliasValue) return aliasValue;
    }

    return fallback;
  }, [content]);

  const getImage = useCallback((fieldId: string, fallback = ""): string => {
    if (isImageFieldInDraftMenu(content, fieldId) && !isPreviewMode()) return fallback;

    const assigned = images[fieldId];
    if (assigned) {
      const assignedMedia = mediaFiles.find((file) => file.id === assigned || file.url === assigned);
      return assignedMedia?.url || assigned;
    }

    const normalizedField = fieldId.toLowerCase();
    const matchedMedia = mediaFiles.find((file) => {
      const filename = file.filename.toLowerCase();
      const filenameWithoutExt = filename.replace(/\.[^.]+$/, "");
      return file.id === fieldId || filenameWithoutExt === normalizedField || filename.includes(normalizedField);
    });

    return matchedMedia?.url || fallback;
  }, [content, images, mediaFiles]);

  const updateField = useCallback((menuId: string, sectionId: string, fieldId: string, value: string) => {
    setContent(prev => prev.map(menu => menu.id !== menuId ? menu : {
      ...menu,
      status: "draft",
      updatedAt: new Date().toISOString(),
      sections: menu.sections.map(sec => sec.id !== sectionId ? sec : {
        ...sec,
        fields: sec.fields.map(f => f.id !== fieldId ? f : { ...f, value }),
      }),
    }));
  }, []);

  const updateImage = useCallback((fieldId: string, url: string) => {
    setImages(prev => ({ ...prev, [fieldId]: url }));
    const menuId = findMenuIdByField(content, fieldId);
    if (menuId) {
      setContent(prev => prev.map(menu => menu.id !== menuId ? menu : {
        ...menu,
        status: "draft",
        updatedAt: new Date().toISOString(),
      }));
    }
  }, [content]);

  const deleteImage = useCallback((fieldId: string) => {
    setImages(prev => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const updateMenuMeta = useCallback((menuId: string, updates: Partial<Pick<ContentMenu, "status" | "seo">>) => {
    setContent(prev => prev.map(menu => menu.id !== menuId ? menu : {
      ...menu,
      ...updates,
      seo: updates.seo ? { ...(menu.seo || {}), ...updates.seo } : menu.seo,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const publishMenu = useCallback((menuId: string) => {
    setContent(prev => prev.map(menu => menu.id !== menuId ? menu : {
      ...menu,
      status: "published",
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    }));
  }, []);

  const reorderSections = useCallback((menuId: string, sectionIds: string[]) => {
    setContent(prev => prev.map(menu => {
      if (menu.id !== menuId) return menu;
      const sectionMap = new Map(menu.sections.map(section => [section.id, section]));
      const ordered = sectionIds.map(id => sectionMap.get(id)).filter(Boolean) as ContentSection[];
      const remaining = menu.sections.filter(section => !sectionIds.includes(section.id));
      return { ...menu, status: "draft", updatedAt: new Date().toISOString(), sections: [...ordered, ...remaining] };
    }));
  }, []);

  const exportBackup = useCallback(() => JSON.stringify({
    schema: "danivisual.cms.backup.v1",
    exportedAt: new Date().toISOString(),
    content,
    images,
  }, null, 2), [content, images]);

  const importBackup = useCallback((payload: string) => {
    const parsed = JSON.parse(payload);
    if (parsed.schema !== "danivisual.cms.backup.v1" || !Array.isArray(parsed.content)) {
      throw new Error("Format backup CMS tidak valid.");
    }
    setContent(mergeContent(parsed.content));
    setImages(parsed.images && typeof parsed.images === "object" ? parsed.images : {});
  }, []);

  const uploadImage = useCallback((fieldId: string, file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > MAX_SIZE) { reject(new Error("Max 5MB")); return; }
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        updateImage(fieldId, result);
        resolve(result);
      };
      reader.onerror = () => reject(new Error("Read error"));
      reader.readAsDataURL(file);
    });
  }, [updateImage]);

  const resetContent = useCallback(() => setContent(cloneDefaults()), []);
  const resetImages = useCallback(() => setImages({}), []);
  const resetAll = useCallback(() => { setContent(cloneDefaults()); setImages({}); }, []);

  const value = useMemo(() => ({
    content,
    images,
    isLoading,
    isSupabaseConnected,
    getField,
    getImage,
    updateField,
    updateImage,
    deleteImage,
    uploadImage,
    updateMenuMeta,
    publishMenu,
    reorderSections,
    exportBackup,
    importBackup,
    resetContent,
    resetImages,
    resetAll,
    refreshContent,
  }), [
    content,
    images,
    isLoading,
    isSupabaseConnected,
    getField,
    getImage,
    updateField,
    updateImage,
    deleteImage,
    uploadImage,
    updateMenuMeta,
    publishMenu,
    reorderSections,
    exportBackup,
    importBackup,
    resetContent,
    resetImages,
    resetAll,
    refreshContent,
  ]);

  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>;
}

export function useContent() {
  const ctx = useContext(ContentCtx);
  if (!ctx) throw new Error("useContent must be within ContentProvider");
  return ctx;
}
