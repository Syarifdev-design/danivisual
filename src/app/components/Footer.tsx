import { Link } from "react-router";
import { Instagram, MapPin, Youtube, MessageCircle } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function Footer() {
  return (
    <footer className="bg-background-soft border-t border-border-line">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <BrandLogo className="mb-4" imageClassName="h-8" />
            <p className="text-sm text-foreground-secondary leading-relaxed">
              Mengabadikan momen penuh rasa melalui visual yang elegan, jujur, dan abadi.
            </p>
          </div>

          {/* Menu */}
          <div>
            <h4 className="text-sm uppercase tracking-widest mb-4 font-medium">Menu</h4>
            <div className="space-y-3">
              <Link to="/" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                Home
              </Link>
              <Link to="/portfolio" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                Portfolio
              </Link>
              <Link to="/services" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                Services
              </Link>
              <Link to="/about" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                About
              </Link>
              <Link to="/packages" className="block text-sm text-foreground-secondary hover:text-foreground transition">
                Book Now
              </Link>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-sm uppercase tracking-widest mb-4 font-medium">Services</h4>
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
                Peristiwa Lainnya
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm uppercase tracking-widest mb-4 font-medium">Contact</h4>
            <div className="space-y-3">
              <a
                href="https://wa.me/6282337279636"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition"
              >
                <MessageCircle size={16} />
                <span>082337279636</span>
              </a>
              <a
                href="https://www.instagram.com/danivisual.photo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition"
              >
                <Instagram size={16} />
                <span>@danivisual.photo</span>
              </a>
              <a
                href="https://www.youtube.com/@danivisualofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition"
              >
                <Youtube size={16} />
                <span>DANIVISUAL OFFICIAL</span>
              </a>
              <a
                href="https://maps.app.goo.gl/iUyGZ5zmFTDUFQ5z5"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-foreground-secondary hover:text-foreground transition"
              >
                <MapPin size={16} className="mt-0.5 shrink-0" />
                <span>Pacitan, Jawa Timur</span>
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border-line">
          <p className="text-sm text-foreground-secondary text-center">
            © {new Date().getFullYear()} Danivisual. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
