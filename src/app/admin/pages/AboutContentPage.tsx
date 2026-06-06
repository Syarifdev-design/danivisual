import { ExternalLink, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AdminFormSection from "../components/AdminFormSection";
import AdminImageUploader from "../components/AdminImageUploader";
import AdminPageHeader from "../components/AdminPageHeader";
import AdminPreviewCard from "../components/AdminPreviewCard";
import AdminStatusBadge from "../components/AdminStatusBadge";
import { useContent } from "../../contexts/ContentContext";
import { mediaAssets } from "../../data/mediaAssets";

const inputClass = "min-h-11 w-full border border-border-line bg-white px-3 text-sm outline-none transition focus:border-premium-beige";
const textareaClass = "min-h-28 w-full resize-y border border-border-line bg-white px-3 py-3 text-sm leading-relaxed outline-none transition focus:border-premium-beige";
const labelClass = "mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-foreground-secondary";

type FieldDraft = Record<string, string>;
type ImageDraft = Record<string, string>;

export default function AboutContentPage() {
  const { getField, getImage, updateField, updateImage, publishMenu } = useContent();
  const [saved, setSaved] = useState(false);

  const initialFields = useMemo(() => {
    const values: FieldDraft = {
      // Hero/Intro section
      about_eyebrow: getField("about", "intro", "about_eyebrow", "Tentang Studio"),
      about_title: getField("about", "intro", "about_title", "Setiap Bingkai Menyimpan Rasa"),
      about_desc: getField("about", "intro", "about_desc", "Danivisual mendokumentasikan momen dengan pendekatan editorial yang tenang, jujur, dan penuh perhatian."),

      // Brand Story section
      story_eyebrow: getField("about", "brand_story", "story_eyebrow", "Cerita Kami"),
      story_title: getField("about", "brand_story", "story_title", "Cerita Kami"),
      about_brand_paragraph_1: getField("about", "brand_story", "about_brand_paragraph_1", "Danivisual lahir dari keyakinan sederhana: setiap momen istimewa layak dikenang dengan cara yang indah, jujur, dan penuh rasa."),
      about_brand_paragraph_2: getField("about", "brand_story", "about_brand_paragraph_2", "Sejak 2019, kami mendokumentasikan ratusan cerita cinta, dari pernikahan intimate hingga perayaan yang megah. Bagi kami, dokumentasi terbaik bukan hanya tentang gambar yang indah, tetapi tentang rasa yang tetap hidup saat dikenang kembali."),
      about_brand_paragraph_3: getField("about", "brand_story", "about_brand_paragraph_3", "Kami hadir bukan sekadar sebagai pengamat. Kami menjadi bagian dari hari besar Anda, menangkap tawa, air mata, dan momen kecil yang sering kali menjadi cerita paling berarti."),
      quote: getField("about", "brand_story", "quote", "Kami percaya foto terbaik terjadi ketika Anda lupa pada kamera, dan benar-benar merasakan momennya."),
      meta_text: getField("about", "brand_story", "meta_text", "Since 2019 · Wedding Documentation"),

      // Philosophy section
      philosophy_heart_title: getField("about", "philosophy", "about_philosophy_heart_title", "Passion"),
      philosophy_heart_desc: getField("about", "philosophy", "about_philosophy_heart_desc", "Kami mengerjakan setiap proyek dengan ketulusan"),
      philosophy_eye_title: getField("about", "philosophy", "about_philosophy_eye_title", "Detail"),
      philosophy_eye_desc: getField("about", "philosophy", "about_philosophy_eye_desc", "Memperhatikan setiap detail momen"),
      philosophy_sparkles_title: getField("about", "philosophy", "about_philosophy_sparkles_title", "Quality"),
      philosophy_sparkles_desc: getField("about", "philosophy", "about_philosophy_sparkles_desc", "Standar kualitas tinggi di setiap deliverable"),
      philosophy_users_title: getField("about", "philosophy", "about_philosophy_users_title", "Connection"),
      philosophy_users_desc: getField("about", "philosophy", "about_philosophy_users_desc", "Membangun koneksi emosional dengan klien"),

      // Stats section
      stats_couples_count: getField("about", "stats", "about_stats_couples_count", "500+"),
      stats_couples_label: getField("about", "stats", "about_stats_couples_label", "Couples Documented"),
      stats_years_count: getField("about", "stats", "about_stats_years_count", "7+"),
      stats_years_label: getField("about", "stats", "about_stats_years_label", "Years Experience"),
      stats_photos_count: getField("about", "stats", "about_stats_photos_count", "50K+"),
      stats_photos_label: getField("about", "stats", "about_stats_photos_label", "Photos Captured"),
      stats_satisfaction_count: getField("about", "stats", "about_stats_satisfaction_count", "100%"),
      stats_satisfaction_label: getField("about", "stats", "about_stats_satisfaction_label", "Client Satisfaction"),

      // Why Choose Us section
      why_1: getField("about", "why_choose_us", "about_why_1", "Tim fotografer profesional dengan pengalaman 7+ tahun di industri wedding photography"),
      why_2: getField("about", "why_choose_us", "about_why_2", "Gaya editorial modern yang elegan dan timeless"),
      why_3: getField("about", "why_choose_us", "about_why_3", "Full control atas proses editing untuk hasil yang konsisten dan premium"),
      why_4: getField("about", "why_choose_us", "about_why_4", "Client portal sederhana untuk My Booking dan Progress"),
      why_5: getField("about", "why_choose_us", "about_why_5", "File high resolution tanpa watermark"),
      why_6: getField("about", "why_choose_us", "about_why_6", "Album cetak premium dengan finishing berkualitas tinggi"),
      why_7: getField("about", "why_choose_us", "about_why_7", "Komunikasi responsif via WhatsApp dan dashboard"),
      why_8: getField("about", "why_choose_us", "about_why_8", "Komitmen pada timeline yang jelas dan transparan"),

      // Testimonials section
      testimonial_1_name: getField("about", "testimonials", "about_testimonial_1_name", "Dani & Sinta"),
      testimonial_1_wedding: getField("about", "testimonials", "about_testimonial_1_wedding", "Wedding di Four Seasons"),
      testimonial_1_quote: getField("about", "testimonials", "about_testimonial_1_quote", "Danivisual tidak hanya memotret pernikahan kami, mereka merekam setiap rasa yang kami alami hari itu. Ketika melihat album, kami bisa merasakan kembali kebahagiaan, haru, dan kehangatan yang sama."),
      testimonial_2_name: getField("about", "testimonials", "about_testimonial_2_name", "Rama & Dita"),
      testimonial_2_wedding: getField("about", "testimonials", "about_testimonial_2_wedding", "Sesi Prewedding Studio"),
      testimonial_2_quote: getField("about", "testimonials", "about_testimonial_2_quote", "Tim Danivisual sangat profesional dan membuat kami merasa nyaman. Foto-foto yang dihasilkan natural, bersih, dan sesuai dengan visual yang kami bayangkan."),
      testimonial_3_name: getField("about", "testimonials", "about_testimonial_3_name", "Andi & Maya"),
      testimonial_3_wedding: getField("about", "testimonials", "about_testimonial_3_wedding", "Prewedding at Bromo"),
      testimonial_3_quote: getField("about", "testimonials", "about_testimonial_3_quote", "Perjalanan jauh ke Bromo terasa sangat layak. Danivisual tahu cara membaca cahaya dan lanskap dengan tepat. Hasilnya melampaui ekspektasi kami."),
    };

    return values;
  }, [getField]);

  const initialImages = useMemo(() => {
    const values: ImageDraft = {
      about_image: getImage("about_image", mediaAssets.wedding.couplePortrait),
      testimonial_1_image: getImage("about_testimonial_1_image", mediaAssets.wedding.couplePortrait),
      testimonial_2_image: getImage("about_testimonial_2_image", mediaAssets.wedding.ringPortrait),
      testimonial_3_image: getImage("about_testimonial_3_image", mediaAssets.editorial.outdoorCouple),
      why_choose_us_image: getImage("why_choose_us_image", mediaAssets.wedding.ringWide),
    };
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
    // Save Hero/Intro section
    updateField("about", "intro", "about_eyebrow", fields.about_eyebrow || "");
    updateField("about", "intro", "about_title", fields.about_title || "");
    updateField("about", "intro", "about_desc", fields.about_desc || "");
    updateImage("about_image", images.about_image || "");

    // Save Brand Story section
    updateField("about", "brand_story", "story_eyebrow", fields.story_eyebrow || "");
    updateField("about", "brand_story", "story_title", fields.story_title || "");
    updateField("about", "brand_story", "about_brand_paragraph_1", fields.about_brand_paragraph_1 || "");
    updateField("about", "brand_story", "about_brand_paragraph_2", fields.about_brand_paragraph_2 || "");
    updateField("about", "brand_story", "about_brand_paragraph_3", fields.about_brand_paragraph_3 || "");
    updateField("about", "brand_story", "quote", fields.quote || "");
    updateField("about", "brand_story", "meta_text", fields.meta_text || "");

    // Save Philosophy section
    updateField("about", "philosophy", "about_philosophy_heart_title", fields.philosophy_heart_title || "");
    updateField("about", "philosophy", "about_philosophy_heart_desc", fields.philosophy_heart_desc || "");
    updateField("about", "philosophy", "about_philosophy_eye_title", fields.philosophy_eye_title || "");
    updateField("about", "philosophy", "about_philosophy_eye_desc", fields.philosophy_eye_desc || "");
    updateField("about", "philosophy", "about_philosophy_sparkles_title", fields.philosophy_sparkles_title || "");
    updateField("about", "philosophy", "about_philosophy_sparkles_desc", fields.philosophy_sparkles_desc || "");
    updateField("about", "philosophy", "about_philosophy_users_title", fields.philosophy_users_title || "");
    updateField("about", "philosophy", "about_philosophy_users_desc", fields.philosophy_users_desc || "");

    // Save Stats section
    updateField("about", "stats", "about_stats_couples_count", fields.stats_couples_count || "");
    updateField("about", "stats", "about_stats_couples_label", fields.stats_couples_label || "");
    updateField("about", "stats", "about_stats_years_count", fields.stats_years_count || "");
    updateField("about", "stats", "about_stats_years_label", fields.stats_years_label || "");
    updateField("about", "stats", "about_stats_photos_count", fields.stats_photos_count || "");
    updateField("about", "stats", "about_stats_photos_label", fields.stats_photos_label || "");
    updateField("about", "stats", "about_stats_satisfaction_count", fields.stats_satisfaction_count || "");
    updateField("about", "stats", "about_stats_satisfaction_label", fields.stats_satisfaction_label || "");

    // Save Why Choose Us section
    updateField("about", "why_choose_us", "about_why_1", fields.why_1 || "");
    updateField("about", "why_choose_us", "about_why_2", fields.why_2 || "");
    updateField("about", "why_choose_us", "about_why_3", fields.why_3 || "");
    updateField("about", "why_choose_us", "about_why_4", fields.why_4 || "");
    updateField("about", "why_choose_us", "about_why_5", fields.why_5 || "");
    updateField("about", "why_choose_us", "about_why_6", fields.why_6 || "");
    updateField("about", "why_choose_us", "about_why_7", fields.why_7 || "");
    updateField("about", "why_choose_us", "about_why_8", fields.why_8 || "");
    updateImage("why_choose_us_image", images.why_choose_us_image || "");

    // Save Testimonials section
    updateField("about", "testimonials", "about_testimonial_1_name", fields.testimonial_1_name || "");
    updateField("about", "testimonials", "about_testimonial_1_wedding", fields.testimonial_1_wedding || "");
    updateField("about", "testimonials", "about_testimonial_1_quote", fields.testimonial_1_quote || "");
    updateImage("about_testimonial_1_image", images.testimonial_1_image || "");

    updateField("about", "testimonials", "about_testimonial_2_name", fields.testimonial_2_name || "");
    updateField("about", "testimonials", "about_testimonial_2_wedding", fields.testimonial_2_wedding || "");
    updateField("about", "testimonials", "about_testimonial_2_quote", fields.testimonial_2_quote || "");
    updateImage("about_testimonial_2_image", images.testimonial_2_image || "");

    updateField("about", "testimonials", "about_testimonial_3_name", fields.testimonial_3_name || "");
    updateField("about", "testimonials", "about_testimonial_3_wedding", fields.testimonial_3_wedding || "");
    updateField("about", "testimonials", "about_testimonial_3_quote", fields.testimonial_3_quote || "");
    updateImage("about_testimonial_3_image", images.testimonial_3_image || "");

    publishMenu("about");
    setSaved(true);
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="Website Content"
        title="About Page"
        description="Edit hero, brand story, philosophy, stats, why choose us, and testimonials content shown on the About page."
        actions={
          <>
            {saved && <AdminStatusBadge tone="success">Saved to localStorage</AdminStatusBadge>}
            <a href="/about" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 border border-border-line bg-white px-5 text-sm text-foreground-secondary transition hover:border-premium-beige hover:text-foreground">
              <ExternalLink size={15} /> Preview About Page
            </a>
            <button onClick={saveChanges} className="inline-flex min-h-11 items-center gap-2 bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90">
              <Save size={15} /> Save Changes
            </button>
          </>
        }
      />

      <div className="grid gap-8">
        {/* Hero Section */}
        <AdminFormSection eyebrow="Hero Section" title="Page Header" description="Control the eyebrow, title, and description shown at the top of the About page.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow" value={fields.about_eyebrow} onChange={(value) => setFieldDraft("about_eyebrow", value)} />
            <Field label="Title" value={fields.about_title} onChange={(value) => setFieldDraft("about_title", value)} />
          </div>
          <TextArea label="Description" value={fields.about_desc} onChange={(value) => setFieldDraft("about_desc", value)} />
        </AdminFormSection>

        {/* Brand Story Section */}
        <AdminFormSection eyebrow="Our Story" title="Brand Story Section" description="Edit the story eyebrow, title, paragraphs, quote, and main image.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Eyebrow" value={fields.story_eyebrow} onChange={(value) => setFieldDraft("story_eyebrow", value)} />
            <Field label="Title" value={fields.story_title} onChange={(value) => setFieldDraft("story_title", value)} />
          </div>
          <div className="grid gap-4">
            <TextArea label="Paragraph 1" value={fields.about_brand_paragraph_1} onChange={(value) => setFieldDraft("about_brand_paragraph_1", value)} />
            <TextArea label="Paragraph 2" value={fields.about_brand_paragraph_2} onChange={(value) => setFieldDraft("about_brand_paragraph_2", value)} />
            <TextArea label="Paragraph 3" value={fields.about_brand_paragraph_3} onChange={(value) => setFieldDraft("about_brand_paragraph_3", value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextArea label="Quote" value={fields.quote} onChange={(value) => setFieldDraft("quote", value)} />
            <div>
              <Field label="Meta Text (e.g. 'Since 2019 · Wedding Documentation')" value={fields.meta_text} onChange={(value) => setFieldDraft("meta_text", value)} />
              <div className="mt-4">
                <label className={labelClass}>Main Image</label>
                <AdminImageUploader
                  imageUrl={images.about_image}
                  onChange={(value) => setImageDraft("about_image", value)}
                />
              </div>
            </div>
          </div>
          <AdminPreviewCard
            eyebrow={fields.story_eyebrow}
            title={fields.story_title}
            imageUrl={images.about_image}
          >
            <p className="text-sm">{fields.about_brand_paragraph_1}</p>
          </AdminPreviewCard>
        </AdminFormSection>

        {/* Philosophy Section */}
        <AdminFormSection eyebrow="Our Philosophy" title="Philosophy Values" description="Edit the four philosophy cards: Passion, Detail, Quality, Connection.">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="grid gap-4 border border-border-line bg-background-soft p-4">
              <h3 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>Passion (Heart)</h3>
              <Field label="Title" value={fields.philosophy_heart_title} onChange={(value) => setFieldDraft("philosophy_heart_title", value)} />
              <TextArea label="Description" value={fields.philosophy_heart_desc} onChange={(value) => setFieldDraft("philosophy_heart_desc", value)} />
            </div>
            <div className="grid gap-4 border border-border-line bg-background-soft p-4">
              <h3 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>Detail (Eye)</h3>
              <Field label="Title" value={fields.philosophy_eye_title} onChange={(value) => setFieldDraft("philosophy_eye_title", value)} />
              <TextArea label="Description" value={fields.philosophy_eye_desc} onChange={(value) => setFieldDraft("philosophy_eye_desc", value)} />
            </div>
            <div className="grid gap-4 border border-border-line bg-background-soft p-4">
              <h3 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>Quality (Sparkles)</h3>
              <Field label="Title" value={fields.philosophy_sparkles_title} onChange={(value) => setFieldDraft("philosophy_sparkles_title", value)} />
              <TextArea label="Description" value={fields.philosophy_sparkles_desc} onChange={(value) => setFieldDraft("philosophy_sparkles_desc", value)} />
            </div>
            <div className="grid gap-4 border border-border-line bg-background-soft p-4">
              <h3 className="text-xl" style={{ fontFamily: "var(--font-heading)" }}>Connection (Users)</h3>
              <Field label="Title" value={fields.philosophy_users_title} onChange={(value) => setFieldDraft("philosophy_users_title", value)} />
              <TextArea label="Description" value={fields.philosophy_users_desc} onChange={(value) => setFieldDraft("philosophy_users_desc", value)} />
            </div>
          </div>
        </AdminFormSection>

        {/* Stats Section */}
        <AdminFormSection eyebrow="Statistics" title="Stats Numbers" description="Edit the four stats displayed in the dark section.">
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="grid gap-2">
              <Field label="Number" value={fields.stats_couples_count} onChange={(value) => setFieldDraft("stats_couples_count", value)} />
              <Field label="Label" value={fields.stats_couples_label} onChange={(value) => setFieldDraft("stats_couples_label", value)} />
            </div>
            <div className="grid gap-2">
              <Field label="Number" value={fields.stats_years_count} onChange={(value) => setFieldDraft("stats_years_count", value)} />
              <Field label="Label" value={fields.stats_years_label} onChange={(value) => setFieldDraft("stats_years_label", value)} />
            </div>
            <div className="grid gap-2">
              <Field label="Number" value={fields.stats_photos_count} onChange={(value) => setFieldDraft("stats_photos_count", value)} />
              <Field label="Label" value={fields.stats_photos_label} onChange={(value) => setFieldDraft("stats_photos_label", value)} />
            </div>
            <div className="grid gap-2">
              <Field label="Number" value={fields.stats_satisfaction_count} onChange={(value) => setFieldDraft("stats_satisfaction_count", value)} />
              <Field label="Label" value={fields.stats_satisfaction_label} onChange={(value) => setFieldDraft("stats_satisfaction_label", value)} />
            </div>
          </div>
        </AdminFormSection>

        {/* Why Choose Us Section */}
        <AdminFormSection eyebrow="Why Choose Us" title="Reasons Section" description="Edit the eight reasons why clients should choose Danivisual.">
          <div className="mb-4">
            <label className={labelClass}>Why Choose Us Image</label>
            <AdminImageUploader
              imageUrl={images.why_choose_us_image}
              onChange={(value) => setImageDraft("why_choose_us_image", value)}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <TextArea label="Reason 1" value={fields.why_1} onChange={(value) => setFieldDraft("why_1", value)} />
            <TextArea label="Reason 2" value={fields.why_2} onChange={(value) => setFieldDraft("why_2", value)} />
            <TextArea label="Reason 3" value={fields.why_3} onChange={(value) => setFieldDraft("why_3", value)} />
            <TextArea label="Reason 4" value={fields.why_4} onChange={(value) => setFieldDraft("why_4", value)} />
            <TextArea label="Reason 5" value={fields.why_5} onChange={(value) => setFieldDraft("why_5", value)} />
            <TextArea label="Reason 6" value={fields.why_6} onChange={(value) => setFieldDraft("why_6", value)} />
            <TextArea label="Reason 7" value={fields.why_7} onChange={(value) => setFieldDraft("why_7", value)} />
            <TextArea label="Reason 8" value={fields.why_8} onChange={(value) => setFieldDraft("why_8", value)} />
          </div>
        </AdminFormSection>

        {/* Testimonials Section */}
        <AdminFormSection eyebrow="Testimonials" title="Client Testimonials" description="Edit the three testimonial cards shown on the About page.">
          <div className="grid gap-8 lg:grid-cols-3">
            {[1, 2, 3].map((num) => (
              <div key={num} className="grid gap-4 border border-border-line bg-background-soft p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg" style={{ fontFamily: "var(--font-heading)" }}>Testimonial {num}</h3>
                  <AdminStatusBadge tone="gold">Card {num}</AdminStatusBadge>
                </div>
                <Field label="Name" value={fields[`testimonial_${num}_name`]} onChange={(value) => setFieldDraft(`testimonial_${num}_name`, value)} />
                <Field label="Wedding Type" value={fields[`testimonial_${num}_wedding`]} onChange={(value) => setFieldDraft(`testimonial_${num}_wedding`, value)} />
                <TextArea label="Quote" value={fields[`testimonial_${num}_quote`]} onChange={(value) => setFieldDraft(`testimonial_${num}_quote`, value)} />
                <div>
                  <label className={labelClass}>Photo</label>
                  <AdminImageUploader
                    imageUrl={images[`testimonial_${num}_image`]}
                    onChange={(value) => setImageDraft(`testimonial_${num}_image`, value)}
                  />
                </div>
                <AdminPreviewCard
                  title={fields[`testimonial_${num}_name`]}
                  eyebrow={fields[`testimonial_${num}_wedding`]}
                  imageUrl={images[`testimonial_${num}_image`]}
                >
                  <p className="text-sm italic">"{fields[`testimonial_${num}_quote`]}"</p>
                </AdminPreviewCard>
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