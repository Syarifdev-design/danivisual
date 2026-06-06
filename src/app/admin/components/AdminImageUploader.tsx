import { ImagePlus, Upload } from "lucide-react";
import { useRef } from "react";

export default function AdminImageUploader({
  label,
  imageUrl,
  helper,
  onChange,
}: {
  label: string;
  imageUrl?: string;
  helper?: string;
  onChange?: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (file?: File) => {
    if (!file || !onChange) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const value = event.target?.result;
      if (typeof value === "string") onChange(value);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-w-0 w-full">
      <div className="mb-3 grid min-w-0 gap-2">
        <label className="min-w-0 text-sm font-medium text-foreground">{label}</label>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-9 w-fit items-center gap-2 border border-border-line bg-white px-3 text-xs text-foreground-secondary transition hover:border-premium-beige hover:text-foreground"
        >
          <Upload size={14} /> Replace
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>
      <div className="relative grid h-[280px] min-w-0 max-w-full place-items-center overflow-hidden border border-dashed border-premium-beige/55 bg-background-soft">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="px-6 text-center">
            <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-premium-beige/45 bg-white text-premium-beige">
              <ImagePlus size={22} />
            </span>
            <p className="text-sm font-medium text-foreground">Upload editorial image</p>
            <p className="mt-2 text-xs leading-relaxed text-foreground-secondary">Recommended: large JPG/PNG with clean composition.</p>
          </div>
        )}
      </div>
      {onChange && (
        <input
          value={imageUrl || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Paste image URL or upload a file"
          className="mt-3 min-h-11 w-full border border-border-line bg-white px-3 text-xs outline-none transition focus:border-premium-beige"
        />
      )}
      {helper && <p className="mt-2 text-xs leading-relaxed text-foreground-secondary">{helper}</p>}
    </div>
  );
}
