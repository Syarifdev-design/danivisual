import { ExternalLink, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import AdminFormSection from "../components/AdminFormSection";
import AdminImageUploader from "../components/AdminImageUploader";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPreviewCard from "../components/AdminPreviewCard";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useContent } from "../../contexts/ContentContext";
import { mediaAssets } from "../../data/mediaAssets";
import AboutContentPage from "./AboutContentPage";

const homeServices = [
  { id: "wedding", label: "Wedding", fallback: mediaAssets.wedding.couplePortrait },
  { id: "prewedding", label: "Prewedding", fallback: mediaAssets.editorial.outdoorCouple },
  { id: "event", label: "Event", fallback: mediaAssets.wedding.group },
  { id: "studio", label: "Studio", fallback: mediaAssets.wedding.ringPortrait },
  { id: "lainnya", label: "Lainnya", fallback: mediaAssets.wedding.family },
] as const;

const inputClass = "min-h-11 w-full border border-border-line bg-white px-3 text-sm outline-none transition focus:border-premium-beige";
const textareaClass = "min-h-28 w-full resize-y border border-border-line bg-white px-3 py-3 text-sm leading-relaxed outline-none transition focus:border-premium-beige";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary";

type FieldDraft = Record<string, string>;
type ImageDraft = Record<string, string>;

// Website Content submenu tabs
const contentTabs = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
];

export default function HomeContentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { getField, getImage, updateField, updateImage, publishMenu } = useContent();
  const [saved, setSaved] = useState(false);

  // Determine active tab from URL or default to home
  const activeTab = location.pathname.includes("/about") ? "about" : "home";

  // Redirect to AboutContentPage if about tab is selected
  if (activeTab === "about") {
    return <AboutContentPage />;
  }

  const initialFields = useMemo(() => {
    const values: FieldDraft = {
      home_hero_kicker: getField("home", "hero", "home_hero_kicker", "SIDE BY SIDE"),
      home_hero_title: getField("home", "hero", "home_hero_title", "DANIVISUAL WEDDING & PREWEDDING STORY"),
      home_featured_eyebrow: getField("home", "featured_stories", "home_featured_eyebrow", "Featured Stories"),
      home_featured_title: getField("home", "featured_stories", "home_featured_title", "Cerita Terpilih"),
      home_featured_desc: getField("home", "featured_stories", "home_featured_desc", "Kurasi cerita wedding dan editorial"),
    };

    for (let index = 1; index <= 6; index += 1) {
      values[`home_story_${index}_category`] = getField("home", "featured_stories", `home_story_${index}_category`, "");
      values[`home_story_${index}_title`] = getField("home", "featured_stories", `home_story_${index}_title`, "");
      values[`home_story_${index}_location`] = getField("home", "featured_stories", `home_story_${index}_location`, "");
      values[`home_story_${index}_date`] = getField("home", "featured_stories", `home_story_${index}_date`, "");
    }

    homeServices.forEach((service) => {
      values[`home_svc_${service.id}_title`] = getField("home", "services", `home_svc_${service.id}_title`, service.label);
      values[`home_svc_${service.id}_desc`] = getField("home", "services", `home_svc_${service.id}_desc`, "");
      values[`home_svc_${service.id}_label`] = getField("home", "services", `home_svc_${service.id}_label`, "");
      values[`home_svc_${service.id}_cta`] = getField("home", "services", `home_svc_${service.id}_cta`, "");
    });

    return values;
  }, [getField]);

  const initialImages = useMemo(() => {
    const values: ImageDraft = {};
    mediaAssets.hero.bannerHome.forEach((fallback, index) => {
      values[`home_slide_${index + 1}`] = getImage(`home_slide_${index + 1}`, fallback);
    });
    for (let index = 1; index <= 6; index += 1) {
      values[`home_story_${index}_image`] = getImage(`home_story_${index}_image`, "");
    }
    homeServices.forEach((service) => {
      values[`home_svc_${service.id}_image`] = getImage(`home_svc_${service.id}_image`, service.fallback);
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

  const setFieldDraft = (key: string, value: string) => {
    setSaved(false);
    setFields((current) => ({ ...current, [key]: value }));
  };

  const setImageDraft = (key: string, value: string) => {
    setSaved(false);
    setImages((current) => ({ ...current, [key]: value }));
  };

  const saveChanges = () => {
    updateField("home", "hero", "home_hero_kicker", fields.home_hero_kicker || "");
    updateField("home", "hero", "home_hero_title", fields.home_hero_title || "");
    updateField("home", "featured_stories", "home_featured_eyebrow", fields.home_featured_eyebrow || "");
    updateField("home", "featured_stories", "home_featured_title", fields.home_featured_title || "");
    updateField("home", "featured_stories", "home_featured_desc", fields.home_featured_desc || "");

    for (let index = 1; index <= 6; index += 1) {
      ["category", "title", "location", "date"].forEach((field) => {
        const key = `home_story_${index}_${field}`;
        updateField("home", "featured_stories", key, fields[key] || "");
      });
      updateImage(`home_story_${index}_image`, images[`home_story_${index}_image`] || "");
    }

    mediaAssets.hero.bannerHome.forEach((_, index) => {
      const key = `home_slide_${index + 1}`;
      updateImage(key, images[key] || "");
    });

    homeServices.forEach((service) => {
      ["title", "desc", "label", "cta"].forEach((field) => {
        const key = `home_svc_${service.id}_${field}`;
        updateField("home", "services", key, fields[key] || "");
      });
      updateImage(`home_svc_${service.id}_image`, images[`home_svc_${service.id}_image`] || "");
    });

    publishMenu("home");
    setSaved(true);
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website Content"
        title="Website Content"
        description="Edit homepage, about page, contact, and footer content shown on the public website."
        actions={
          <>
            {saved && <AdminStatusBadge tone="success">Saved to localStorage</AdminStatusBadge>}
            <a href="/" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
              <ExternalLink size={15} /> Preview Website
            </a>
            <button onClick={saveChanges} className="inline-flex min-h-11 items-center gap-2 bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90">
              <Save size={15} /> Save Changes
            </button>
          </>
        }
      />

      {/* Content Submenu Tabs */}
      <div className="mb-6 flex gap-2 border-b border-border-line pb-3">
        {contentTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => navigate(`/admin/content/${tab.id}`)}
            className={`min-h-11 shrink-0 border px-5 text-sm transition ${
              activeTab === tab.id
                ? "border-premium-beige bg-premium-beige/10 text-foreground"
                : "border-border-line bg-white text-foreground-secondary hover:border-premium-beige hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8">
        <AdminFormSection eyebrow="Hero Section" title="Homepage Hero" description="Control the headline text and all eight hero slideshow images.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Hero Kicker" value={fields.home_hero_kicker} onChange={(value) => setFieldDraft("home_hero_kicker", value)} />
            <Field label="Hero Title" value={fields.home_hero_title} onChange={(value) => setFieldDraft("home_hero_title", value)} />
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {mediaAssets.hero.bannerHome.map((_, index) => {
              const key = `home_slide_${index + 1}`;
              return (
                <AdminImageUploader
                  key={key}
                  label={`Hero slide image ${index + 1}`}
                  imageUrl={images[key]}
                  onChange={(value) => setImageDraft(key, value)}
                />
              );
            })}
          </div>
        </AdminFormSection>

        <AdminFormSection eyebrow="Featured Stories" title="Story Highlights" description="Edit the homepage story section and each story card.">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Eyebrow" value={fields.home_featured_eyebrow} onChange={(value) => setFieldDraft("home_featured_eyebrow", value)} />
            <Field label="Title" value={fields.home_featured_title} onChange={(value) => setFieldDraft("home_featured_title", value)} />
            <TextArea label="Description" value={fields.home_featured_desc} onChange={(value) => setFieldDraft("home_featured_desc", value)} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            {Array.from({ length: 6 }, (_, index) => {
              const storyNumber = index + 1;
              return (
                <div key={storyNumber} className="grid gap-4 border border-border-line bg-background-soft p-4">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl" style={{ fontFamily: "var(--font-heading)" }}>Story {storyNumber}</h3>
                    <AdminStatusBadge tone="gold">Homepage</AdminStatusBadge>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {["category", "title", "location", "date"].map((field) => {
                      const key = `home_story_${storyNumber}_${field}`;
                      return (
                        <Field key={key} label={field} value={fields[key]} onChange={(value) => setFieldDraft(key, value)} />
                      );
                    })}
                  </div>
                  <AdminImageUploader
                    label={`Story ${storyNumber} image`}
                    imageUrl={images[`home_story_${storyNumber}_image`]}
                    onChange={(value) => setImageDraft(`home_story_${storyNumber}_image`, value)}
                  />
                </div>
              );
            })}
          </div>
        </AdminFormSection>

        <AdminFormSection eyebrow="Service Preview" title="Homepage Service Cards" description="Edit service teaser content used on the public homepage.">
          <div className="grid gap-5 lg:grid-cols-2">
            {homeServices.map((service) => (
              <div key={service.id} className="grid gap-4 border border-border-line bg-background-soft p-4">
                <AdminPreviewCard title={fields[`home_svc_${service.id}_title`] || service.label} eyebrow={fields[`home_svc_${service.id}_label`]} imageUrl={images[`home_svc_${service.id}_image`]}>
                  <p>{fields[`home_svc_${service.id}_desc`]}</p>
                </AdminPreviewCard>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={`${service.label} title`} value={fields[`home_svc_${service.id}_title`]} onChange={(value) => setFieldDraft(`home_svc_${service.id}_title`, value)} />
                  <Field label={`${service.label} label`} value={fields[`home_svc_${service.id}_label`]} onChange={(value) => setFieldDraft(`home_svc_${service.id}_label`, value)} />
                  <Field label={`${service.label} CTA`} value={fields[`home_svc_${service.id}_cta`]} onChange={(value) => setFieldDraft(`home_svc_${service.id}_cta`, value)} />
                  <TextArea label={`${service.label} desc`} value={fields[`home_svc_${service.id}_desc`]} onChange={(value) => setFieldDraft(`home_svc_${service.id}_desc`, value)} />
                </div>
                <AdminImageUploader
                  label={`${service.label} image`}
                  imageUrl={images[`home_svc_${service.id}_image`]}
                  onChange={(value) => setImageDraft(`home_svc_${service.id}_image`, value)}
                />
              </div>
            ))}
          </div>
        </AdminFormSection>
      </div>
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
