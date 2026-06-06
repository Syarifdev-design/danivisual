/**
 * Admin Status Banner
 *
 * Small, non-intrusive banner that shows Supabase connection status.
 * Only visible to super_admin and admin roles.
 * Does not disturb layout - uses a subtle fixed position at top.
 */

import { RefreshCw, AlertTriangle, Info, XCircle } from "lucide-react";
import { useSupabaseStatus } from "../../../lib/useSupabaseStatus";

interface AdminStatusBannerProps {
  /** If true, shows a compact version */
  compact?: boolean;
}

export default function AdminStatusBanner({ compact = false }: AdminStatusBannerProps) {
  const {
    shouldShowBanner,
    bannerType,
    bannerMessage,
    isFallbackMode,
    status,
    checkConnection,
  } = useSupabaseStatus();

  // Don't render if no banner needed
  if (!shouldShowBanner || !bannerType || !bannerMessage) {
    return null;
  }

  // Icon based on banner type
  const getIcon = () => {
    switch (bannerType) {
      case "error":
        return <XCircle size={16} className="shrink-0" />;
      case "warning":
        return <AlertTriangle size={16} className="shrink-0" />;
      case "info":
      default:
        return <Info size={16} className="shrink-0" />;
    }
  };

  // Colors based on banner type
  const getColors = () => {
    switch (bannerType) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "info":
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  const colors = getColors();

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 border-b px-4 py-2 text-xs ${colors}`}
        role="alert"
        aria-live="polite"
      >
        {getIcon()}
        <span className="flex-1 truncate">{bannerMessage}</span>
        {status === "error" && (
          <button
            onClick={checkConnection}
            className="shrink-0 rounded p-1 hover:bg-white/50"
            title="Coba lagi"
          >
            <RefreshCw size={12} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-3 border-b px-4 py-2.5 text-sm ${colors}`}
      role="alert"
      aria-live="polite"
    >
      {getIcon()}
      <span className="flex-1">{bannerMessage}</span>
      {isFallbackMode && (
        <span className="text-xs opacity-70">
          ({status === "loading" ? "Memeriksa..." : "Fallback mode"})
        </span>
      )}
      {status === "error" && (
        <button
          onClick={checkConnection}
          className="shrink-0 rounded p-1.5 hover:bg-white/50"
          title="Coba koneksi lagi"
        >
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  );
}
