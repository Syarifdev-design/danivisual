import { Link, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useAdmin } from "../contexts/AdminContext";
import { useContent } from "../contexts/ContentContext";
import { useLanguage } from "../contexts/LanguageContext";
import { findPortfolioAlbum, getPortfolioAlbums } from "../data/portfolioAlbums";

export default function AlbumDetailPage() {
  const { albumId } = useParams();
  const { albums } = useAdmin();
  const { getField } = useContent();
  const { t } = useLanguage();
  const portfolioAlbums = getPortfolioAlbums(albums);
  const album = findPortfolioAlbum(albumId, albums);
  const relatedAlbums = portfolioAlbums
    .filter((item) => item.category === album.category && item.id !== album.id)
    .slice(0, 3);
  const backLabel = getField("portfolio", "labels", "portfolio_back", t({ ID: "Kembali ke Portofolio", EN: "Back to Portfolio" }));
  const storyTitle = getField("portfolio", "labels", "portfolio_story_title", t({ ID: "Cerita Mereka", EN: "The Story" }));
  const relatedTitle = getField("portfolio", "labels", "portfolio_related_title", t({ ID: "Album Serupa", EN: "Related Albums" }));

  return (
    <div className="min-h-screen">
      <div className="py-5 px-5 lg:px-8 bg-background border-b border-border-line">
        <div className="max-w-7xl mx-auto">
          <Link
            to="/portfolio"
            className="inline-flex items-center text-sm text-foreground-secondary hover:text-foreground transition"
          >
            <ArrowLeft size={16} className="mr-2" />
            {backLabel}
          </Link>
        </div>
      </div>

      <section className="relative h-[78svh] lg:h-[70vh] overflow-hidden">
        <img
          src={album.image}
          alt={album.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 pb-14 px-5 lg:px-8 text-white">
          <div className="max-w-7xl mx-auto">
            <span className="text-xs tracking-widest uppercase mb-4 block">
              {album.category.replaceAll("-", " ")}
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

      <section className="py-14 px-5 lg:py-16 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto">
          <h2
            className="text-3xl mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {storyTitle}
          </h2>
          <p className="text-foreground-secondary leading-relaxed text-lg">
            {album.story}
          </p>
        </div>
      </section>

      <section className="py-12 px-5 lg:py-16 lg:px-8 bg-background-soft">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {album.gallery.map((image, index) => (
              <div key={`${album.id}-${index}`} className="overflow-hidden rounded-sm">
                <img
                  src={image}
                  alt={`${album.title} gallery ${index + 1}`}
                  loading="lazy"
                  className="w-full h-auto hover:scale-105 transition-transform duration-700"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-5 lg:py-20 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2
            className="text-3xl mb-8 text-center"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {relatedTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedAlbums.map((related) => (
              <Link
                key={related.id}
                to={`/portfolio/${related.id}`}
                className="group bg-white border border-border-line rounded-sm overflow-hidden hover:shadow-lg transition-all"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={related.image}
                    alt={related.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs tracking-widest text-foreground-secondary uppercase">
                    {related.category.replaceAll("-", " ")}
                  </span>
                  <h3 className="text-lg mt-1" style={{ fontFamily: "var(--font-heading)" }}>
                    {related.couple}
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
