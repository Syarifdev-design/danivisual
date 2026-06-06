/**
 * Supabase Status Hook
 *
 * Provides real-time Supabase connection status for the Admin Panel.
 * Shows a banner when:
 * - Supabase is not configured (DEV fallback mode)
 * - Supabase connection fails (PRODUCTION warning)
 * - Using localStorage fallback
 *
 * Only visible to super_admin and admin roles.
 */

import { useState, useEffect, useCallback } from "react";
import {
  isSupabaseConfigured,
  checkSupabaseConnection,
  type ConnectionDiagnostic,
} from "./supabaseClient";

export type SupabaseStatus = "loading" | "connected" | "not_configured" | "error";

export interface SupabaseStatusInfo {
  status: SupabaseStatus;
  isConfigured: boolean;
  isDev: boolean;
  isProduction: boolean;
  isFallbackMode: boolean;
  shouldShowBanner: boolean;
  bannerType: "info" | "warning" | "error" | null;
  bannerMessage: string | null;
  lastChecked: string | null;
  errorMessage: string | null;
 checkConnection: () => Promise<void>;
}

/**
 * Hook to get Supabase status for admin banner
 */
export function useSupabaseStatus(): SupabaseStatusInfo {
  const isDev = import.meta.env.DEV;
  const isProduction = !isDev;

  const [status, setStatus] = useState<SupabaseStatus>("loading");
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isConfigured = isSupabaseConfigured();

  // Determine if we're in fallback mode
  const isFallbackMode = !isConfigured || status === "error";

  // Determine banner visibility and type
  const getBannerInfo = useCallback((): {
    shouldShow: boolean;
    type: "info" | "warning" | "error" | null;
    message: string | null;
  } => {
    if (status === "loading") {
      return { shouldShow: false, type: null, message: null };
    }

    // Not configured - show info in DEV, warning in PRODUCTION
    if (!isConfigured) {
      if (isProduction) {
        return {
          shouldShow: true,
          type: "error",
          message: "Peringatan: Supabase belum dikonfigurasi. Data production tidak aman.",
        };
      } else {
        return {
          shouldShow: true,
          type: "info",
          message: "Mode fallback aktif: data menggunakan localStorage. Sinkronisasi ke server tidak tersedia.",
        };
      }
    }

    // Configured but connection error
    if (status === "error") {
      if (isProduction) {
        return {
          shouldShow: true,
          type: "error",
          message: "Peringatan: Koneksi Supabase gagal. Data mungkin tidak tersinkron.",
        };
      } else {
        return {
          shouldShow: true,
          type: "warning",
          message: "Koneksi Supabase gagal. Menggunakan localStorage fallback.",
        };
      }
    }

    // Connected - no banner needed
    return { shouldShow: false, type: null, message: null };
  }, [status, isConfigured, isProduction]);

  // Check connection
  const checkConnection = useCallback(async () => {
    setStatus("loading");
    setErrorMessage(null);

    try {
      const result: ConnectionDiagnostic = await checkSupabaseConnection();
      setLastChecked(result.checkedAt);

      if (result.status === "connected") {
        setStatus("connected");
      } else if (result.status === "not_configured") {
        setStatus("not_configured");
      } else {
        setStatus("error");
        setErrorMessage(result.message);
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    // Quick synchronous check first
    if (!isConfigured) {
      setStatus("not_configured");
      return;
    }

    // Then async connection check
    checkConnection();

    // Refresh connection status every 60 seconds
    const interval = setInterval(checkConnection, 60000);

    return () => clearInterval(interval);
  }, [isConfigured, checkConnection]);

  const bannerInfo = getBannerInfo();

  return {
    status,
    isConfigured,
    isDev,
    isProduction,
    isFallbackMode,
    shouldShowBanner: bannerInfo.shouldShow,
    bannerType: bannerInfo.type,
    bannerMessage: bannerInfo.message,
    lastChecked,
    errorMessage,
    checkConnection,
  };
}
