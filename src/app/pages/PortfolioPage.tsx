import { Link } from "react-router";
import { useState } from "react";
import { mediaAssets } from "../data/mediaAssets";

export default function PortfolioPage() {
  const [activeFilter, setActiveFilter] = useState("all");

  const filters = ["All", "Wedding", "Prewedding", "Event", "Studio", "Peristiwa Lainnya"];

  const albums = [
    {
      id: 1,
      category: "wedding",
      title: "Dani & Sinta",
      couple: "Dani & Sinta",
      location: "Four Seasons Jakarta",
      date: "20 Januari 2026",
      image: mediaAssets.wedding.couplePortrait,
    },
    {
      id: 2,
      category: "wedding",
      title: "Naufal & Kirana",
      couple: "Naufal & Kirana",
      location: "The Langham Jakarta",
      date: "28 Desember 2025",
      image: mediaAssets.hero.akad,
    },
    {
      id: 3,
      category: "wedding",
      title: "Arga & Meira",
      couple: "Arga & Meira",
      location: "Plataran Menteng",
      date: "18 Desember 2025",
      image: mediaAssets.wedding.detailPortrait,
    },
    {
      id: 4,
      category: "wedding",
      title: "Rizky & Anindya",
      couple: "Rizky & Anindya",
      location: "Ayana Midplaza",
      date: "30 November 2025",
      image: mediaAssets.wedding.table,
    },
    {
      id: 5,
      category: "prewed-studio",
      title: "Rama & Dita",
      couple: "Rama & Dita",
      location: "Studio Danivisual",
      date: "15 Januari 2026",
      image: mediaAssets.wedding.ringPortrait,
    },
    {
      id: 6,
      category: "prewed-outdoor",
      title: "Andi & Maya",
      couple: "Andi & Maya",
      location: "Bromo, Jawa Timur",
      date: "10 Januari 2026",
      image: mediaAssets.editorial.outdoorCouple,
    },
    {
      id: 7,
      category: "prewed-studio",
      title: "Bagas & Livia",
      couple: "Bagas & Livia",
      location: "Studio Editorial Danivisual",
      date: "9 November 2025",
      image: mediaAssets.hero.ring,
    },
    {
      id: 8,
      category: "prewed-outdoor",
      title: "Fajar & Sari",
      couple: "Fajar & Sari",
      location: "Taman Suropati",
      date: "22 Desember 2025",
      image: mediaAssets.wedding.family,
    },
    {
      id: 9,
      category: "event",
      title: "Corporate Gala Night",
      couple: "Corporate Gala",
      location: "Grand Hyatt Jakarta",
      date: "5 Januari 2026",
      image: mediaAssets.wedding.group,
    },
    {
      id: 10,
      category: "event",
      title: "Private Engagement Dinner",
      couple: "Engagement Dinner",
      location: "Park Hyatt Jakarta",
      date: "24 Desember 2025",
      image: mediaAssets.wedding.table,
    },
    {
      id: 11,
      category: "event",
      title: "Luxury Product Dinner",
      couple: "Product Dinner",
      location: "The Dharmawangsa",
      date: "16 Desember 2025",
      image: mediaAssets.wedding.ceremony,
    },
    {
      id: 12,
      category: "event",
      title: "Family Celebration",
      couple: "Family Celebration",
      location: "InterContinental Jakarta",
      date: "12 Desember 2025",
      image: mediaAssets.wedding.family,
    },
    {
      id: 13,
      category: "studio",
      title: "Alya Portrait Session",
      couple: "Alya Portrait",
      location: "Studio Danivisual",
      date: "3 Desember 2025",
      image: mediaAssets.wedding.ringPortrait,
    },
    {
      id: 14,
      category: "studio",
      title: "Rendra Family Portrait",
      couple: "Rendra Family",
      location: "Studio Danivisual",
      date: "29 November 2025",
      image: mediaAssets.wedding.family,
    },
    {
      id: 15,
      category: "studio",
      title: "Editorial Couple Portrait",
      couple: "Editorial Couple",
      location: "Studio Danivisual",
      date: "19 November 2025",
      image: mediaAssets.wedding.couplePortrait,
    },
    {
      id: 16,
      category: "studio",
      title: "Personal Branding Set",
      couple: "Personal Branding",
      location: "Studio Danivisual",
      date: "11 November 2025",
      image: mediaAssets.hero.moment,
    },
    {
      id: 17,
      category: "peristiwa-lainnya",
      title: "Siraman Intimate",
      couple: "Siraman Intimate",
      location: "Private Residence",
      date: "7 November 2025",
      image: mediaAssets.wedding.ceremony,
    },
    {
      id: 18,
      category: "peristiwa-lainnya",
      title: "Pengajian Keluarga",
      couple: "Pengajian Keluarga",
      location: "South Jakarta",
      date: "2 November 2025",
      image: mediaAssets.wedding.group,
    },
    {
      id: 19,
      category: "peristiwa-lainnya",
      title: "Lamaran Elegant",
      couple: "Lamaran Elegant",
      location: "Private Garden",
      date: "24 Oktober 2025",
      image: mediaAssets.hero.ring,
    },
    {
      id: 20,
      category: "peristiwa-lainnya",
      title: "Family Milestone",
      couple: "Family Milestone",
      location: "Jakarta Selatan",
      date: "18 Oktober 2025",
      image: mediaAssets.wedding.family,
    },
  ];

  const filteredAlbums = albums.filter((album) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "prewedding") return album.category.startsWith("prewed");
    return album.category === activeFilter.toLowerCase().replaceAll(" ", "-");
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="py-16 px-5 lg:py-20 lg:px-8 bg-background-soft border-b border-border-line">
        <div className="max-w-7xl mx-auto text-center">
          <div className="w-16 h-[1px] bg-premium-beige mx-auto mb-8" />
          <h1
            className="text-4xl lg:text-6xl mb-4"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Portfolio
          </h1>
          <p className="text-foreground-secondary max-w-2xl mx-auto">
            Cerita visual dari wedding, prewedding, dan event yang kami abadikan.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-5 px-5 lg:px-8 bg-background sticky top-16 lg:top-20 z-30 border-b border-border-line">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-3 overflow-x-auto pb-1 lg:flex-wrap lg:justify-center">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter.toLowerCase())}
                className={`min-h-11 min-w-max px-5 py-2 text-sm tracking-wide transition-all rounded-sm ${
                  activeFilter === filter.toLowerCase()
                    ? "bg-dark-premium text-white"
                    : "border border-border-line text-foreground-secondary hover:border-premium-beige hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Albums Grid */}
      <section className="py-12 px-5 lg:py-16 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
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
                    View Story
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Floating CTA */}
      <div className="fixed bottom-8 right-8 z-40">
        <Link
          to="/packages"
          className="px-6 py-4 bg-dark-premium text-white hover:bg-dark-premium/90 shadow-xl hover:shadow-2xl transition-all rounded-sm text-sm font-medium"
        >
          View Packages
        </Link>
      </div>
    </div>
  );
}
