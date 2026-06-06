import { useState, useEffect } from "react";
import {
  Image,
  Link as LinkIcon,
  Send,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  FileText,
  HelpCircle,
} from "lucide-react";
import { useCustomer } from "../../contexts/CustomerContext";
import StatusBadge from "../../components/StatusBadge";

const inputClassName = "w-full rounded-lg border border-border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-premium-beige focus:ring-2 focus:ring-premium-beige/15";

export default function PhotoSelection() {
  const { currentBooking, productionProgress, photoSelection, updatePhotoSelection, submitPhotoSelection } = useCustomer();
  const [editingSelections, setEditingSelections] = useState("");
  const [printingSelections, setPrintingSelections] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // Load existing selections
  useEffect(() => {
    if (photoSelection) {
      setEditingSelections(photoSelection.editingSelections || "");
      setPrintingSelections(photoSelection.printingSelections || "");
      setAdditionalNotes(photoSelection.additionalNotes || "");
    }
  }, [photoSelection]);

  const galleryLink = productionProgress?.galleryLink || photoSelection?.galleryLink;
  const hasGalleryLink = Boolean(galleryLink);
  const isSubmitted = photoSelection?.status === "submitted";
  const isApproved = photoSelection?.status === "approved";
  const isActive = productionProgress?.photoSortingStatus === "in_progress";

  const handleSave = () => {
    const result = updatePhotoSelection({
      editingSelections,
      printingSelections,
      additionalNotes,
    });

    if (!result.success) {
      setSubmitError(result.error || "Gagal menyimpan");
    }
  };

  const handleSubmit = () => {
    // First save
    const saveResult = updatePhotoSelection({
      editingSelections,
      printingSelections,
      additionalNotes,
    });

    if (!saveResult.success) {
      setSubmitError(saveResult.error || "Gagal menyimpan");
      return;
    }

    // Validate selections
    if (!editingSelections.trim() && !printingSelections.trim()) {
      setSubmitError("Pilih minimal satu foto untuk diedit atau dicetak");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    const result = submitPhotoSelection();

    setIsSubmitting(false);

    if (result.success) {
      setSubmitSuccess(true);
      window.setTimeout(() => setSubmitSuccess(false), 3000);
    } else {
      setSubmitError(result.error || "Gagal mengirim pilihan");
    }
  };

  if (!currentBooking) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-foreground-secondary">Booking tidak ditemukan.</p>
      </div>
    );
  }

  if (!isActive) {
    return (
      <div className="rounded-xl border border-border-line bg-white p-8 text-center">
        <Image size={48} className="mx-auto text-border-line" />
        <h3 className="mt-4 text-xl font-medium" style={{ fontFamily: "var(--font-heading)" }}>
          Photo Selection
        </h3>
        <p className="mt-2 text-sm text-foreground-secondary">
          Fitur pemilihan foto belum tersedia. Mohon tunggu hingga admin mengaktifkan tahap Photo Sorting.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-xl border border-border-line bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>
              Photo Selection
            </h2>
            <p className="mt-1 text-sm text-foreground-secondary">
              Pilih foto favorit Anda untuk proses editing dan cetak album
            </p>
          </div>
          <StatusBadge
            variant={
              isApproved ? "success" :
              isSubmitted ? "finishing" :
              "waiting"
            }
          >
            {isApproved ? "Approved" : isSubmitted ? "Submitted" : "Pending"}
          </StatusBadge>
        </div>
      </div>

      {/* Gallery Link */}
      {hasGalleryLink && (
        <div className="rounded-xl border border-premium-beige/30 bg-premium-beige/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-premium-beige/20 p-2">
              <Image size={20} className="text-premium-beige" />
            </div>
            <div>
              <h3 className="font-medium">Preview Gallery</h3>
              <p className="text-xs text-foreground-secondary">Klik untuk melihat foto-foto yang tersedia</p>
            </div>
          </div>
          <a
            href={galleryLink!}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-dark-premium px-4 py-2.5 text-sm text-white hover:bg-dark-premium/90"
          >
            <ExternalLink size={16} />
            Buka Galeri Foto
          </a>
          <p className="mt-3 text-xs text-foreground-secondary">
            Catat nomor foto yang ingin Anda pilih untuk diedit dan dicetak.
          </p>
        </div>
      )}

      {/* No Gallery Link */}
      {!hasGalleryLink && (
        <div className="rounded-xl border border-border-line bg-white p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-lg bg-background-soft p-2">
              <HelpCircle size={20} className="text-foreground-secondary" />
            </div>
            <div>
              <h3 className="font-medium">Instruksi</h3>
              <p className="text-xs text-foreground-secondary">
                Admin belum menyediakan link galeri. Mohon hubungi admin untuk informasi lebih lanjut.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Selection Form */}
      <div className="rounded-xl border border-border-line bg-white p-6">
        <h3 className="mb-4 text-lg font-medium" style={{ fontFamily: "var(--font-heading)" }}>
          Pilih Foto Favorit
        </h3>

        {/* Editing Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Foto untuk Diedit
          </label>
          <textarea
            value={editingSelections}
            onChange={(e) => setEditingSelections(e.target.value)}
            placeholder="Contoh: 1, 2, 3, 5, 8, 12, 15"
            className={`${inputClassName} min-h-[100px] resize-none`}
            disabled={isSubmitted}
          />
          <p className="mt-1.5 text-xs text-foreground-secondary">
            Masukkan nomor foto yang ingin diedit, dipisahkan dengan koma.
          </p>
        </div>

        {/* Printing Selection */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Foto untuk Dicetak
          </label>
          <textarea
            value={printingSelections}
            onChange={(e) => setPrintingSelections(e.target.value)}
            placeholder="Contoh: 1, 2, 3, 4, 5"
            className={`${inputClassName} min-h-[100px] resize-none`}
            disabled={isSubmitted}
          />
          <p className="mt-1.5 text-xs text-foreground-secondary">
            Masukkan nomor foto yang ingin dicetak untuk album.
          </p>
        </div>

        {/* Additional Notes */}
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium">
            Catatan Tambahan
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Contoh: Foto #1 untuk cover album, Foto #2 untuk ukuran besar..."
            className={`${inputClassName} min-h-[80px] resize-none`}
            disabled={isSubmitted}
          />
        </div>

        {/* Status Messages */}
        {submitError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={16} />
            {submitError}
          </div>
        )}

        {submitSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            <Check size={16} />
            Pilihan foto berhasil dikirim! Mohon tunggu konfirmasi dari admin.
          </div>
        )}

        {/* Action Buttons */}
        {!isSubmitted && (
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-border-line bg-white px-6 py-3 text-sm font-medium text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
            >
              <FileText size={16} />
              Simpan Dulu
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-dark-premium px-6 py-3 text-sm font-medium text-white transition hover:bg-dark-premium/90 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Kirim Pilihan
                </>
              )}
            </button>
          </div>
        )}

        {/* Submitted Notice */}
        {isSubmitted && (
          <div className="rounded-lg border border-premium-beige/30 bg-premium-beige/5 p-4 text-center">
            <Check size={24} className="mx-auto text-premium-beige" />
            <p className="mt-2 text-sm font-medium">Pilihan foto sudah dikirim</p>
            <p className="text-xs text-foreground-secondary">
              {photoSelection.submittedAt &&
                `Dikirim pada ${new Date(photoSelection.submittedAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}`}
            </p>
            {isApproved && (
              <p className="mt-2 text-sm font-medium text-emerald-600">
                ✓ Pilihan sudah disetujui oleh admin
              </p>
            )}
          </div>
        )}
      </div>

      {/* Help Card */}
      <div className="rounded-xl border border-border-line bg-background-soft p-6">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
          <HelpCircle size={16} className="text-premium-beige" />
          Cara Memilih Foto
        </h4>
        <ul className="space-y-2 text-sm text-foreground-secondary">
          <li className="flex items-start gap-2">
            <span className="mt-1 text-premium-beige">1.</span>
            <span>Buka link galeri preview yang disediakan admin</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-premium-beige">2.</span>
            <span>Lihat foto-foto dan catat nomor yang Anda suka</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-premium-beige">3.</span>
            <span>Masukkan nomor foto di kolom yang sesuai</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-premium-beige">4.</span>
            <span>Tambahkan catatan jika ada preferensi khusus</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 text-premium-beige">5.</span>
            <span>Klik "Kirim Pilihan" untuk submit</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
