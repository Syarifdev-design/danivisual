import { Download, ExternalLink, Check, Clock, Loader2 } from "lucide-react";
import StatusBadge from "../../components/StatusBadge";
import { Link } from "react-router";
import { mediaAssets } from "../../data/mediaAssets";

export default function DownloadFile() {
  const album = {
    title: "Dani & Sinta Wedding",
    category: "Wedding Package",
    date: "20 Januari 2026",
    coverImage: mediaAssets.wedding.couplePortrait,
    status: "ready", // ready | processing | waiting
  };

  const driveFolder = {
    name: "Dani & Sinta - Final Files",
    url: "https://drive.google.com/drive/folders/1234567890",
  };

  const filePackages = [
    { name: "High Resolution Photos", status: "ready" },
    { name: "Edited Selection Photos", status: "ready" },
    { name: "Album Layout Preview", status: "ready" },
    { name: "H+2 Story Photos", status: "ready" },
    { name: "Printed Album Files", status: "ready" },
  ];

  const renderStatusContent = () => {
    if (album.status === "waiting") {
      return (
        <div className="bg-white border border-border-line rounded-sm p-12 text-center">
          <Clock size={48} className="text-foreground-secondary mx-auto mb-4" />
          <h2 className="text-2xl mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            File Belum Tersedia
          </h2>
          <p className="text-foreground-secondary mb-8 max-w-md mx-auto">
            File final Anda sedang dalam proses editing dan upload. Link Google Drive akan muncul di
            halaman ini setelah proses selesai.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/dashboard/progress"
              className="px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
            >
              View Progress
            </Link>
            <Link
              to="/dashboard/help"
              className="px-6 py-3 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm"
            >
              Chat Admin
            </Link>
          </div>
        </div>
      );
    }

    if (album.status === "processing") {
      return (
        <div className="bg-white border border-border-line rounded-sm p-12 text-center">
          <Loader2 size={48} className="text-premium-beige mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl mb-3" style={{ fontFamily: "var(--font-heading)" }}>
            File Sedang Diproses
          </h2>
          <p className="text-foreground-secondary mb-8 max-w-md mx-auto">
            Tim Danivisual sedang menyiapkan dan mengunggah file final ke Google Drive. Link download
            akan muncul otomatis setelah file siap.
          </p>
          <Link
            to="/dashboard/progress"
            className="inline-flex items-center px-6 py-3 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm"
          >
            View Progress
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Album Preview */}
        <div className="bg-white border border-border-line rounded-sm overflow-hidden">
          <div className="aspect-[4/3] overflow-hidden">
            <img src={album.coverImage} alt={album.title} className="w-full h-full object-cover" />
          </div>
          <div className="p-6">
            <span className="text-xs uppercase tracking-widest text-foreground-secondary">
              {album.category}
            </span>
            <h3 className="text-2xl mt-2 mb-1" style={{ fontFamily: "var(--font-heading)" }}>
              {album.title}
            </h3>
            <p className="text-sm text-foreground-secondary mb-4">{album.date}</p>
            <StatusBadge variant="success">Ready to Download</StatusBadge>
          </div>
        </div>

        {/* Download Access Card */}
        <div className="bg-white border border-border-line rounded-sm p-8">
          <h2 className="text-2xl mb-4" style={{ fontFamily: "var(--font-heading)" }}>
            Final File Access
          </h2>
          <p className="text-foreground-secondary mb-8">
            File final high resolution, edited selection photos, story photos H+2, dan album layout
            tersedia di folder ini.
          </p>

          <div className="mb-8 p-6 bg-background-soft rounded-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-premium-beige/20 rounded-sm flex items-center justify-center shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M7.5 4.5L2 9.5L7.5 14.5L13 9.5L7.5 4.5Z"
                    fill="#0066DA"
                  />
                  <path
                    d="M13 9.5L7.5 14.5L13 19.5L18.5 14.5L13 9.5Z"
                    fill="#00AC47"
                  />
                  <path
                    d="M18.5 4.5L13 9.5L18.5 14.5L24 9.5L18.5 4.5Z"
                    fill="#EA4335"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium mb-1">{driveFolder.name}</p>
                <p className="text-xs text-foreground-secondary">Google Drive Folder</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={driveFolder.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
              >
                <Download size={18} />
                Download via Google Drive
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(driveFolder.url)}
                className="px-6 py-3 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm"
              >
                Copy Share URL
              </button>
            </div>
          </div>

          <div className="p-4 bg-warning-soft border border-premium-beige/30 rounded-sm text-xs text-foreground-secondary">
            Jika link tidak bisa dibuka, silakan{" "}
            <Link to="/dashboard/help" className="text-foreground underline">
              hubungi admin
            </Link>{" "}
            untuk pengaturan akses.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Download File
        </h1>
        <p className="text-foreground-secondary">
          Akses file final Anda melalui link Google Drive yang telah disiapkan oleh tim Danivisual
        </p>
      </div>

      {renderStatusContent()}

      {/* File Package Checklist - Only show when ready */}
      {album.status === "ready" && (
        <div className="mt-8 bg-white border border-border-line rounded-sm p-8">
          <h2 className="text-xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
            File Package Checklist
          </h2>
          <div className="space-y-3">
            {filePackages.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-background-soft rounded-sm"
              >
                <div className="flex items-center gap-3">
                  <Check size={20} className="text-premium-beige" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <StatusBadge variant="success">Ready</StatusBadge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
