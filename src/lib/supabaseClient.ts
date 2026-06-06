/**
 * Supabase Client Configuration
 *
 * Konfigurasi untuk koneksi ke Supabase backend.
 * Jika environment variables belum diset, aplikasi tetap berjalan
 * menggunakan localStorage fallback.
 *
 * Environment variables yang dibutuhkan:
 * - VITE_SUPABASE_URL    → URL project Supabase (https://xxx.supabase.co)
 * - VITE_SUPABASE_ANON_KEY → Anonymous key dari Supabase dashboard
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

/**
 * Result type for connection diagnostics
 */
export interface ConnectionDiagnostic {
  ok: boolean;
  status: "connected" | "not_configured" | "error";
  message: string;
  checkedAt: string;
  /** Error code if any (safe to expose) */
  errorCode?: string;
  /** Database response time in ms */
  responseTimeMs?: number;
}

/**
 * Storage bucket diagnostic result
 */
export interface BucketDiagnostic {
  name: string;
  status: "available" | "unavailable" | "unknown";
  public?: boolean;
  fileSizeLimit?: number;
}

/**
 * Storage diagnostics result
 */
export interface StorageDiagnostic {
  ok: boolean;
  mode: "supabase" | "fallback";
  buckets: BucketDiagnostic[];
  checkedAt: string;
  errorMessage?: string;
}

// ============================================================================
// Configuration Detection
// ============================================================================

const isDev = import.meta.env.DEV;

/**
 * Cek apakah Supabase sudah dikonfigurasi
 * Mengabaikan placeholder values
 */
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Check for placeholder values
  const isPlaceholder = !url ||
    url === "your-project-url" ||
    url === "https://your-project.supabase.co" ||
    !key ||
    key === "your-anon-key" ||
    key === "your-anon-key-here";

  return Boolean(url && key && !isPlaceholder);
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
 * Test koneksi ke Supabase dengan safe diagnostics
 * Tidak expose secret/key/URL
 *
 * @returns ConnectionDiagnostic - safe info only
 */
export const checkSupabaseConnection = async (): Promise<ConnectionDiagnostic> => {
  const checkedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      status: "not_configured",
      message: "Supabase not configured. Using localStorage fallback.",
      checkedAt,
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      status: "error",
      message: "Supabase client unavailable.",
      checkedAt,
    };
  }

  try {
    const startTime = performance.now();

    // Safe query: count admin_users (lightweight, no sensitive data)
    const { error } = await client
      .from("admin_users")
      .select("id", { count: "exact", head: true })
      .limit(1);

    const responseTimeMs = Math.round(performance.now() - startTime);

    if (error) {
      // Table might not exist yet, but connection is OK
      if (error.code === "42P01" || error.code === "42P0") {
        // Relation does not exist
        console.info("[Supabase] Connected but tables not initialized.");
        return {
          ok: true,
          status: "connected",
          message: "Connected successfully. Tables not initialized yet.",
          checkedAt,
          responseTimeMs,
        };
      }

      // Auth or RLS error - connection is OK but permission issue
      if (error.code === "PGRST204" || error.code === "42501") {
        console.info("[Supabase] Connected. Permission check needed.");
        return {
          ok: true,
          status: "connected",
          message: "Connected. Access to data requires proper permissions.",
          checkedAt,
          responseTimeMs,
        };
      }

      // Other errors
      console.warn("[Supabase] Connection error:", error.code);
      return {
        ok: false,
        status: "error",
        message: "Connection error: " + (error.message || "Unknown error"),
        checkedAt,
        errorCode: error.code,
        responseTimeMs,
      };
    }

    return {
      ok: true,
      status: "connected",
      message: "Connected successfully. Database is reachable.",
      checkedAt,
      responseTimeMs,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Supabase] Connection failed:", errorMessage);
    return {
      ok: false,
      status: "error",
      message: "Connection failed: " + errorMessage,
      checkedAt,
    };
  }
};

/**
 * Get storage bucket diagnostics
 * Safe - does not expose URLs or keys
 *
 * @returns StorageDiagnostic
 */
export const getStorageDiagnostics = async (): Promise<StorageDiagnostic> => {
  const checkedAt = new Date().toISOString();

  // Not configured = fallback mode
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      mode: "fallback",
      buckets: [],
      checkedAt,
      errorMessage: "Using localStorage fallback. Supabase storage not available.",
    };
  }

  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      mode: "fallback",
      buckets: [],
      checkedAt,
      errorMessage: "Supabase client unavailable.",
    };
  }

  // Define buckets to check
  const bucketNames = [
    "content-images",
    "portfolio-media",
    "payment-proofs",
    "attendance-selfies",
  ];

  const buckets: BucketDiagnostic[] = [];

  for (const bucketName of bucketNames) {
    try {
      // Try to get bucket info
      const { data, error } = await client
        .storage
        .getBucket(bucketName);

      if (error) {
        // Bucket might not exist or permission denied
        if (error.message?.includes("not found") || error.status === 404) {
          buckets.push({
            name: bucketName,
            status: "unavailable",
          });
        } else {
          // Permission error or other - not fatal
          buckets.push({
            name: bucketName,
            status: "unknown",
          });
        }
      } else if (data) {
        buckets.push({
          name: bucketName,
          status: "available",
          public: data.public,
          fileSizeLimit: data.file_size_limit || undefined,
        });
      }
    } catch {
      // Any exception = unknown status (not fatal)
      buckets.push({
        name: bucketName,
        status: "unknown",
      });
    }
  }

  return {
    ok: true,
    mode: "supabase",
    buckets,
    checkedAt,
  };
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