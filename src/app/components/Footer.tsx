import { Link } from "react-router";
import { Instagram, MapPin, Youtube, MessageCircle } from "lucide-react";
import BrandLogo from "./BrandLogo";
import { useLanguage } from "../contexts/LanguageContext";
import { useContent } from "../contexts/ContentContext";

export default function Footer() {
  const { t } = useLanguage();
  const { getField } = useContent();
  const whatsapp = getField("contact", "details", "whatsapp", "082337279636");
  const whatsappUrl = getField("contact", "details", "whatsapp_url", "https://wa.me/6282337279636");
  const instagram = getField("contact", "details", "instagram", "@danivisual.photo");
  const instagramUrl = getField("contact", "details", "instagram_url", "https://www.instagram.com/danivisual.photo");
  const youtube = getField("contact", "details", "youtube", "DANIVISUAL OFFICIAL");
  const youtubeUrl = getField("contact", "details", "youtube_url", "https://www.youtube.com/@danivisualofficial");
  const mapsUrl = getField("contact", "details", "maps_url", "https://maps.app.goo.gl/iUyGZ5zmFTDUFQ5z5");
  const address = getField("contact", "details", "address", t({ ID: "Pacitan, Jawa Timur", EN: "Pacitan, East Java" }));

  return (
    <footer className="bg-background-soft border-t border-border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <BrandLogo className="mb-4" imageClassName="h-8" />
            <p className="text-sm text-foreground-secondary leading-relaxed">
              {getField("footer", "brand", "description", t({
                ID: "Mengabadikan momen penuh rasa melalui visual yang elegan, jujur, dan abadi.",
                EN: "Preserving meaningful moments through elegant, honest, and timeless visuals.",
              }))}
            </p>
          </div>

          {/* Menu */}
          <div>
            <h4 className="text-sm uppercase tracking-widest mb-4 font-medium">Menu</h4>
            <div className="space-y-3">
              <Link to="/" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                {getField("navigation", "main-menu", "home", t({ ID: "Beranda", EN: "Home" }))}
              </Link>
              <Link to="/portfolio" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                {getField("navigation", "main-menu", "portfolio", "Portfolio")}
              </Link>
              <Link to="/services" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                {getField("navigation", "main-menu", "services", t({ ID: "Layanan", EN: "Services" }))}
              </Link>
              <Link to="/about" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                {getField("navigation", "main-menu", "about", t({ ID: "Tentang", EN: "About" }))}
              </Link>
              <Link to="/packages" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                {getField("navigation", "actions", "reserve", t({ ID: "Reservasi", EN: "Book Now" }))}
              </Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm tracking-widest mb-4 font-medium">{t({ ID: "Layanan", EN: "Services" })}</h4>
            <div className="space-y-3">
              <Link to="/services#wedding" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                Wedding
              </Link>
              <Link to="/services#prewedding" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                Prewedding
              </Link>
              <Link to="/services#studio" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                Studio
              </Link>
              <Link to="/services#event" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                Event
              </Link>
              <Link to="/services#others" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                {t({ ID: "Peristiwa Lainnya", EN: "Other Occasions" })}
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm tracking-widest mb-4 font-medium">{t({ ID: "Kontak", EN: "Contact" })}</h4>
            <div className="space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition"
              >
                <MessageCircle size={16} />
                <span>{whatsapp}</span>
              </a>
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition"
              >
                <Instagram size={16} />
                <span>{instagram}</span>
              </a>
              <a
                href={youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition"
              >
                <Youtube size={16} />
                <span>{youtube}</span>
              </a>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-foreground-secondary hover:text-foreground transition"
              >
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>{address}</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border-line">
          <p className="text-sm text-foreground-secondary text-center">
            © {new Date().getFullYear()} Danivisual. {getField("footer", "copyright", "text", t({ ID: "Seluruh hak cipta dilindungi.", EN: "All rights reserved." }))}
          </p>
        </div>
      </div>
    </footer>
  );
}
