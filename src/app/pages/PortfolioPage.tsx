import { Link } from "react-router";
import { useState } from "react";
import PageIntro from "../components/PageIntro";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";
import { useAdmin } from "../contexts/AdminContext";
import { getPortfolioAlbums } from "../data/portfolioAlbums";

export default function PortfolioPage() {
  const { t } = useLanguage();
  const { getField } = useContent();
  const { albums } = useAdmin();
  const [activeFilter, setActiveFilter] = useState("all");
  const portfolioAlbums = getPortfolioAlbums(albums);

  const filters = [
    { id: "all", label: getField("portfolio", "filters", "portfolio_filter_all", t({ ID: "Semua", EN: "All" })) },
    { id: "wedding", label: getField("portfolio", "filters", "portfolio_filter_wedding", "Wedding") },
    { id: "prewedding", label: getField("portfolio", "filters", "portfolio_filter_prewedding", "Prewedding") },
    { id: "event", label: getField("portfolio", "filters", "portfolio_filter_event", "Event") },
    { id: "studio", label: getField("portfolio", "filters", "portfolio_filter_studio", "Studio") },
    { id: "peristiwa-lainnya", label: getField("portfolio", "filters", "portfolio_filter_lainnya", t({ ID: "Peristiwa Lainnya", EN: "Other Occasions" })) },
  ];
  const viewStoryLabel = getField("portfolio", "labels", "portfolio_view_story", t({ ID: "Lihat Cerita", EN: "View Story" }));
  const viewPackagesLabel = getField("portfolio", "labels", "portfolio_view_packages", t({ ID: "Lihat Paket", EN: "View Packages" }));

  const filteredAlbums = portfolioAlbums.filter((album) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "prewedding") return album.category.startsWith("prewed");
    return album.category === activeFilter.toLowerCase().replaceAll(" ", "-");
  });

  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow={getField("portfolio", "intro", "portfolio_eyebrow", t({ ID: "Karya Terpilih", EN: "Selected Work" }))}
        title={getField("portfolio", "intro", "portfolio_title", t({ ID: "Portofolio", EN: "Portfolio" }))}
        description={getField("portfolio", "intro", "portfolio_desc", t({
          ID: "Rangkaian cerita visual dari wedding, prewedding, dan event yang kami abadikan dengan komposisi bersih, intim, dan timeless.",
          EN: "A curated collection of wedding, prewedding, and event stories captured with clean composition, intimate pacing, and timeless editorial detail.",
        }))}
      />

      <section className="py-5 px-5 lg:px-8 bg-background sticky top-16 lg:top-20 z-30 border-b border-border-line">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-wrap lg:justify-center">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`min-h-11 min-w-max px-5 py-2 text-sm tracking-wide transition-all rounded-sm ${
                  activeFilter === filter.id
                    ? "bg-dark-premium text-white"
                    : "border border-border-line text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-5 lg:py-16 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
            {filteredAlbums.map((album) => (
              <Link
                key={album.id}
                to={`/portfolio/${album.id}`}
                className="group block bg-white border-b border-border-line pb-8 transition-all lg:border lg:pb-0 lg:hover:shadow-lg"
              >
                <div className="aspect-[4/5] overflow-hidden">
                  <img
                    src={album.image}
                    alt={album.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6">
                  <span className="text-xs tracking-widest text-foreground-secondary uppercase">
                    {album.category.replace("-", " ")}
                  </span>
                  <h3
                    className="text-xl mt-2 mb-1"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {album.couple}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-1">{album.location}</p>
                  <p className="text-sm text-foreground-secondary">{album.date}</p>
                  <div className="mt-5 inline-flex border-b border-premium-beige pb-1 text-sm">
                    {viewStoryLabel}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-8 right-8 z-40">
        <Link
          to="/packages"
          className="px-6 py-4 bg-dark-premium text-white hover:bg-dark-premium/90 shadow-xl hover:shadow-2xl transition-all rounded-sm text-sm font-medium"
        >
          {viewPackagesLabel}
        </Link>
      </div>
    </div>
  );
}
