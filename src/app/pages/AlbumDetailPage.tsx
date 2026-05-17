import { useParams, Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { mediaAssets } from "../data/mediaAssets";

export default function AlbumDetailPage() {
  const { albumId } = useParams();

  const album = {
    category: "WEDDING",
    title: "Dani & Sinta",
    couple: "Dani & Sinta",
    location: "Four Seasons Jakarta",
    date: "20 Januari 2026",
    coverImage: mediaAssets.hero.akad,
    story:
      "Pernikahan Dani dan Sinta adalah perayaan cinta yang intim dan penuh kehangatan. Dikelilingi oleh keluarga dan teman terdekat, mereka berjanji untuk saling mendukung dalam setiap langkah kehidupan.",
  };

  const galleryImages = [
    mediaAssets.wedding.couplePortrait,
    mediaAssets.hero.ring,
    mediaAssets.wedding.ceremony,
    mediaAssets.wedding.table,
    mediaAssets.editorial.outdoorCouple,
    mediaAssets.wedding.family,
  ];

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="py-5 px-5 lg:px-8 bg-background border-b border-border-line">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/portfolio"
            className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground transition"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Portfolio
          </Link>
        </div>
      </div>

      {/* Hero Album */}
      <section className="relative h-[78svh] lg:h-[70vh] overflow-hidden">
        <img
          src={album.coverImage}
          alt={album.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 pb-14 px-5 lg:px-8 text-white">
          <div className="max-w-7xl mx-auto">
            <span className="text-xs tracking-widest uppercase mb-4 block">
              {album.category}
            </span>
            <h1
              className="text-[44px] leading-none lg:text-6xl mb-4"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {album.couple}
            </h1>
            <div className="flex flex-wrap gap-6 text-sm">
              <span>{album.location}</span>
              <span>•</span>
              <span>{album.date}</span>
            </div>
            <div className="w-16 h-[1px] bg-soft-gold mt-6" />
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-14 px-5 lg:py-16 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            The Story
          </h2>
          <p className="text-foreground-secondary leading-relaxed text-lg">
            {album.story}
          </p>
        </div>
      </section>

      {/* Gallery */}
      <section className="py-12 px-5 lg:py-16 lg:px-8 bg-background-soft">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {galleryImages.map((image, index) => (
              <div key={index} className="overflow-hidden rounded-sm">
                <img
                  src={image}
                  alt={`Gallery ${index + 1}`}
                  loading="lazy"
                  className="w-full h-auto hover:scale-105 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Related Albums */}
      <section className="py-16 px-5 lg:py-20 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl mb-8 text-center"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Related Albums
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              mediaAssets.wedding.ringPortrait,
              mediaAssets.editorial.outdoorCouple,
              mediaAssets.wedding.group,
            ].map((image, i) => (
              <Link
                key={i}
                to={`/portfolio/${i}`}
                className="group bg-white border border-border-line rounded-sm overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={image}
                    alt={`Album ${i}`}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs tracking-widest text-foreground-secondary uppercase">
                    Wedding
                  </span>
                  <h3 className="text-lg mt-1" style={{ fontFamily: "var(--font-heading)" }}>
                    Album Title
                  </h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
