/**
 * Supabase Client Configuration (DEPRECATED)
 *
 * ⚠️ DEPRECATED: Backend sudah menggunakan PHP/MySQL.
 * File ini dipertahankan sebagai fallback jika sewaktu-waktu
 * ingin migrasi kembali ke Supabase.
 *
 * Untuk saat ini, gunakan apiClient.ts untuk semua API calls.
 *
 * Environment variables (tidak diperlukan lagi):
 * - VITE_SUPABASE_URL    → URL project Supabase (https://xxx.supabase.co)
 * - VITE_SUPABASE_ANON_KEY → Anonymous key dari Supabase dashboard
 *
 * @deprecated Gunakan src/lib/apiClient.ts sebagai gantinya
 */

import { createClient } from "@supabase/supabase-js";

// ============================================================================
// Types
// ============================================================================

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export type ConnectionStatus = "connected" | "not_configured" | "error";

// ============================================================================
// DEPRECATED: Configuration Detection
// ============================================================================

const isDev = import.meta.env.DEV;

/**
 * @deprecated Backend sudah menggunakan PHP/MySQL
 * Cek apakah Supabase sudah dikonfigurasi
 * Mengabaikan placeholder values
 */
export const isSupabaseConfigured = (): boolean => {
  // Selalu return false karena kita sudah pakai PHP/MySQL
  return false;

  // Kode lama (dipertahankan untuk referensi):
  // const url = import.meta.env.VITE_SUPABASE_URL;
  // const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  // const isPlaceholder = !url || url === "your-project-url" || ...
  // return Boolean(url && key && !isPlaceholder);
};

/**
 * Get configuration status for display
 */
export const getConfigStatus = (): {
  isConfigured: boolean;
  url: string | null;
  hasKey: boolean;
} => {
  const url = import.meta.env.VITE_SUPABASE_URL || null;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const isConfigured = isSupabaseConfigured();

  return {
    isConfigured,
    url,
    hasKey: Boolean(key),
  };
};

// ============================================================================
// Warning Messages (Development Only)
// ============================================================================

const showConfigWarning = () => {
  if (!isDev) return;

  const { url, hasKey } = getConfigStatus();

  if (!url && !hasKey) {
    console.warn(
      "%c⚠️ Supabase Not Configured",
      "color: orange; font-weight: bold;",
      "\n\nEnvironment variables belum diset:\n",
      "  VITE_SUPABASE_URL\n",
      "  VITE_SUPABASE_ANON_KEY\n",
      "\nAplikasi akan menggunakan localStorage sebagai fallback.\n",
      "Untuk mengaktifkan Supabase:\n",
      "  1. Buat file .env di root project\n",
      "  2. Tambahkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY\n",
      "  3. Restart development server\n"
    );
  } else if (url && !hasKey) {
    console.warn(
      "%c⚠️ Supabase URL configured but ANON_KEY missing",
      "color: orange; font-weight: bold;"
    );
  } else if (!url && hasKey) {
    console.warn(
      "%c⚠️ Supabase ANON_KEY configured but URL missing",
      "color: orange; font-weight: bold;"
    );
  } else if (!isSupabaseConfigured()) {
    console.warn(
      "%c⚠️ Supabase using placeholder values",
      "color: orange; font-weight: bold;"
    );
  }
};

// Show warning on first load
showConfigWarning();

// ============================================================================
// Client Singleton
// ============================================================================

let supabaseInstance: ReturnType<typeof createClient> | null = null;
let configCheckDone = false;

export const getSupabaseClient = () => {
  // Only warn once per session
  if (!configCheckDone) {
    if (!isSupabaseConfigured() && isDev) {
      console.info(
        "[Supabase] Running in localStorage fallback mode."
      );
    } else if (isSupabaseConfigured()) {
      console.info(
        "[Supabase] Connected to backend."
      );
    }
    configCheckDone = true;
  }

  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        global: {
          headers: {
            "x-client-info": "danivisual-web",
          },
        },
      }
    );
  }

  return supabaseInstance;
};

// ============================================================================
// Connection Check
// ============================================================================

/**
 * Test koneksi ke Supabase
 */
export const checkSupabaseConnection = async (): Promise<ConnectionStatus> => {
  if (!isSupabaseConfigured()) {
    return "not_configured";
  }

  const client = getSupabaseClient();
  if (!client) return "not_configured";

  try {
    // Test dengan query sederhana
    const { error } = await client
      .from("package_categories")
      .select("id")
      .limit(1);

    if (error) {
      // Tabel mungkin belum ada, tapi koneksi berhasil
      if (error.code === "42P01" || error.code === "404") {
        console.info("[Supabase] Connected but tables not initialized yet.");
        return "connected";
      }
      console.warn("[Supabase] Connection error:", error.message);
      return "error";
    }

    return "connected";
  } catch (err) {
    console.error("[Supabase] Connection failed:", err);
    return "error";
  }
};

/**
 * Get connection info
 */
export const getConnectionInfo = () => {
  const configured = isSupabaseConfigured();
  const url = import.meta.env.VITE_SUPABASE_URL || null;

  return {
    configured,
    url: configured ? url : null,
    mode: configured ? "supabase" : "localStorage",
  };
};

// ============================================================================
// Type-safe Table Names (for better DX)
// ============================================================================

export const Tables = {
  // CMS
  contentMenus: "content_menus",
  contentFields: "content_fields",
  contentImages: "content_images",

  // Admin
  bookings: "bookings",
  customers: "customers",
  payments: "payments",
  calendarEvents: "calendar_events",
  adminUsers: "admin_users",
  analytics: "analytics",

  // Content
  categories: "package_categories",
  packages: "packages",
  addons: "addons",
  faqs: "faqs",
  albums: "portfolio_albums",
  mediaFiles: "media_files",
} as const;

// ============================================================================
// Storage Buckets (for file uploads)
// ============================================================================

export const StorageBuckets = {
  contentImages: "content-images",
  portfolioMedia: "portfolio-media",
  paymentProofs: "payment-proofs",
} as const;