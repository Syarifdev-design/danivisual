import { ExternalLink, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminFormSection from "../components/AdminFormSection";
import AdminImageUploader from "../components/AdminImageUploader";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPreviewCard from "../components/AdminPreviewCard";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useContent } from "../../contexts/ContentContext";
import { mediaAssets } from "../../data/mediaAssets";

const services = [
  {
    id: "wedding",
    label: "Wedding",
    image1: mediaAssets.wedding.couplePortrait,
    image2: mediaAssets.wedding.ceremony,
  },
  {
    id: "prewedding",
    label: "Prewedding",
    image1: mediaAssets.editorial.outdoorCouple,
    image2: mediaAssets.hero.moment,
  },
  {
    id: "event",
    label: "Event",
    image1: mediaAssets.wedding.group,
    image2: mediaAssets.wedding.table,
  },
  {
    id: "studio",
    label: "Studio",
    image1: mediaAssets.wedding.ringPortrait,
    image2: mediaAssets.wedding.detailPortrait,
  },
  {
    id: "lainnya",
    label: "Lainnya",
    image1: mediaAssets.wedding.family,
    image2: mediaAssets.editorial.outdoorCouple,
  },
] as const;

type ServiceId = typeof services[number]["id"];
type FieldDraft = Record<string, string>;
type ImageDraft = Record<string, string>;

const inputClass = "min-h-11 w-full border border-border-line bg-white px-3 text-sm outline-none transition focus:border-premium-beige";
const textareaClass = "min-h-32 w-full resize-y border border-border-line bg-white px-3 py-3 text-sm leading-relaxed outline-none transition focus:border-premium-beige";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary";

export default function ServicesContentPage() {
  const { getField, getImage, updateField, updateImage, publishMenu } = useContent();
  const [activeService, setActiveService] = useState<ServiceId>("wedding");
  const [saved, setSaved] = useState(false);

  const initialFields = useMemo(() => {
    const values: FieldDraft = {};
    services.forEach((service) => {
      values[`services_${service.id}_eyebrow`] = getField("services_page", service.id, `services_${service.id}_eyebrow`, "");
      values[`services_${service.id}_title`] = getField("services_page", service.id, `services_${service.id}_title`, service.label);
      values[`services_${service.id}_desc`] = getField("services_page", service.id, `services_${service.id}_desc`, "");
      values[`services_${service.id}_narrative`] = getField("services_page", service.id, `services_${service.id}_narrative`, "");
      values[`services_${service.id}_duration`] = getField("services_page", service.id, `services_${service.id}_duration`, "");
      values[`services_${service.id}_highlight`] = getField("services_page", service.id, `services_${service.id}_highlight`, "");
      values[`services_${service.id}_access`] = getField("services_page", service.id, `services_${service.id}_access`, "");
      values[`services_${service.id}_isActive`] = getField("services_page", service.id, `services_${service.id}_isActive`, "true");

      for (let index = 1; index <= 5; index += 1) {
        values[`services_${service.id}_include_${index}`] = getField("services_page", service.id, `services_${service.id}_include_${index}`, "");
      }
    });
    return values;
  }, [getField]);

  const initialImages = useMemo(() => {
    const values: ImageDraft = {};
    services.forEach((service) => {
      values[`services_${service.id}_image_1`] = getImage(`services_${service.id}_image_1`, service.image1);
      values[`services_${service.id}_image_2`] = getImage(`services_${service.id}_image_2`, service.image2);
    });
    return values;
  }, [getImage]);

  const [fields, setFields] = useState<FieldDraft>(initialFields);
  const [images, setImages] = useState<ImageDraft>(initialImages);

  useEffect(() => {
    setFields(initialFields);
  }, [initialFields]);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  const currentService = services.find((service) => service.id === activeService) || services[0];

  const setFieldDraft = (key: string, value: string) => {
    setSaved(false);
    setFields((current) => ({ ...current, [key]: value }));
  };

  const setImageDraft = (key: string, value: string) => {
    setSaved(false);
    setImages((current) => ({ ...current, [key]: value }));
  };

  const serviceKey = (field: string) => `services_${currentService.id}_${field}`;

  const saveChanges = () => {
    services.forEach((service) => {
      const baseFields = ["eyebrow", "title", "desc", "narrative", "duration", "highlight", "access", "isActive"];
      baseFields.forEach((field) => {
        const key = `services_${service.id}_${field}`;
        updateField("services_page", service.id, key, fields[key] || "");
      });

      for (let index = 1; index <= 5; index += 1) {
        const key = `services_${service.id}_include_${index}`;
        updateField("services_page", service.id, key, fields[key] || "");
      }

      updateImage(`services_${service.id}_image_1`, images[`services_${service.id}_image_1`] || "");
      updateImage(`services_${service.id}_image_2`, images[`services_${service.id}_image_2`] || "");
    });

    publishMenu("services_page");
    setSaved(true);
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website Content"
        title="Services Page"
        description="Edit every service shown on the public Services page while keeping the editorial frontend design intact."
        actions={
          <>
            {saved && <AdminStatusBadge tone="success">Saved to localStorage</AdminStatusBadge>}
            <a href="/services" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
              <ExternalLink size={15} /> Preview Website
            </a>
            <button onClick={saveChanges} className="inline-flex min-h-11 items-center gap-2 bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90">
              <Save size={15} /> Save Changes
            </button>
          </>
        }
      />

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-border-line pb-3">
        {services.map((service) => {
          const active = service.id === activeService;
          const isActive = fields[`services_${service.id}_isActive`] !== "false";
          return (
            <button
              key={service.id}
              onClick={() => setActiveService(service.id)}
              className={`min-h-11 shrink-0 border px-5 text-sm transition ${
                active
                  ? "border-premium-beige bg-premium-beige/10 text-foreground"
                  : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige hover:text-foreground"
              }`}
            >
              {service.label}
              <span className={`ml-3 text-[10px] uppercase tracking-[0.14em] ${isActive ? "text-[#2f6b43]" : "text-foreground-secondary"}`}>
                {isActive ? "Active" : "Hidden"}
              </span>
            </button>
          );
        })}
      </div>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid min-w-0 gap-8">
          <AdminFormSection
            eyebrow={`${currentService.label} Service`}
            title="Service Details"
            description="Edit headline, narrative, metadata, images, and included experience."
          >
            <label className="flex min-h-11 items-center gap-3 border border-border-line bg-background-soft px-4 text-sm text-foreground">
              <input
                type="checkbox"
                checked={fields[serviceKey("isActive")] !== "false"}
                onChange={(event) => setFieldDraft(serviceKey("isActive"), event.target.checked ? "true" : "false")}
                className="accent-black"
              />
              Show this service on public Services page
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Eyebrow" value={fields[serviceKey("eyebrow")]} onChange={(value) => setFieldDraft(serviceKey("eyebrow"), value)} />
              <Field label="Title" value={fields[serviceKey("title")]} onChange={(value) => setFieldDraft(serviceKey("title"), value)} />
            </div>

            <TextArea label="Description" value={fields[serviceKey("desc")]} onChange={(value) => setFieldDraft(serviceKey("desc"), value)} />
            <TextArea label="Narrative" value={fields[serviceKey("narrative")]} onChange={(value) => setFieldDraft(serviceKey("narrative"), value)} />

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Duration" value={fields[serviceKey("duration")]} onChange={(value) => setFieldDraft(serviceKey("duration"), value)} />
              <Field label="Highlight" value={fields[serviceKey("highlight")]} onChange={(value) => setFieldDraft(serviceKey("highlight"), value)} />
              <Field label="Access" value={fields[serviceKey("access")]} onChange={(value) => setFieldDraft(serviceKey("access"), value)} />
            </div>
          </AdminFormSection>

          <AdminFormSection
            eyebrow="Included Experience"
            title="Pengalaman yang Termasuk"
            description="Add up to five included experience items for this service."
          >
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 5 }, (_, index) => {
                const key = serviceKey(`include_${index + 1}`);
                return (
                  <Field
                    key={key}
                    label={`Include ${index + 1}`}
                    value={fields[key]}
                    onChange={(value) => setFieldDraft(key, value)}
                  />
                );
              })}
            </div>
          </AdminFormSection>

          <AdminFormSection
            eyebrow="Service Images"
            title="Image Preview"
            description="These images feed the rotating service visual on the public page."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <AdminImageUploader
                label="Image 1"
                imageUrl={images[serviceKey("image_1")]}
                onChange={(value) => setImageDraft(serviceKey("image_1"), value)}
              />
              <AdminImageUploader
                label="Image 2"
                imageUrl={images[serviceKey("image_2")]}
                onChange={(value) => setImageDraft(serviceKey("image_2"), value)}
              />
            </div>
          </AdminFormSection>
        </div>

        <aside className="grid min-w-0 gap-5 content-start">
          <AdminPreviewCard
            eyebrow={fields[serviceKey("eyebrow")]}
            title={fields[serviceKey("title")] || currentService.label}
            imageUrl={images[serviceKey("image_1")]}
          >
            <p>{fields[serviceKey("description")] || fields[serviceKey("desc")]}</p>
          </AdminPreviewCard>

          <AdminPreviewCard eyebrow="Metadata" title="Service Summary">
            <div className="space-y-3">
              <Summary label="Duration" value={fields[serviceKey("duration")]} />
              <Summary label="Highlight" value={fields[serviceKey("highlight")]} />
              <Summary label="Access" value={fields[serviceKey("access")]} />
              <Summary label="Status" value={fields[serviceKey("isActive")] !== "false" ? "Active" : "Hidden"} />
            </div>
          </AdminPreviewCard>
        </aside>
      </section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input value={value || ""} onChange={(event) => onChange(event.target.value)} className={inputClass} />
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <textarea value={value || ""} onChange={(event) => onChange(event.target.value)} className={textareaClass} />
    </div>
  );
}

function Summary({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border-line pb-3 text-sm last:border-b-0 last:pb-0">
      <span className="text-foreground-secondary">{label}</span>
      <span className="max-w-[58%] text-right font-medium text-foreground">{value || "-"}</span>
    </div>
  );
}
