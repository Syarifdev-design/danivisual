import { MapPin, MessageCircle, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router";
import PageIntro from "../components/PageIntro";

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <PageIntro
        eyebrow="Start the Conversation"
        title="Get in Touch"
        description="Mari ceritakan rencana wedding, prewedding, atau event Anda. Tim kami akan membantu merapikan kebutuhan visual sejak awal."
      />

      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16">
          <div>
            <h2 className="text-3xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              Contact Information
            </h2>
            <div className="space-y-6">
              <a
                href="https://wa.me/6282337279636"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 bg-white border border-border-line rounded-sm hover:shadow-lg transition"
              >
                <MessageCircle className="text-premium-beige mt-1 shrink-0" size={24} />
                <div>
                  <h3 className="font-medium mb-1">WhatsApp</h3>
                  <p className="text-sm text-foreground-secondary">082337279636</p>
                </div>
              </a>
              <a
                href="https://www.instagram.com/danivisual.photo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 bg-white border border-border-line rounded-sm hover:shadow-lg transition"
              >
                <Instagram className="text-premium-beige mt-1 shrink-0" size={24} />
                <div>
                  <h3 className="font-medium mb-1">Instagram</h3>
                  <p className="text-sm text-foreground-secondary">@danivisual.photo</p>
                </div>
              </a>
              <a
                href="https://www.youtube.com/@danivisualofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-6 bg-white border border-border-line rounded-sm hover:shadow-lg transition"
              >
                <Youtube className="text-premium-beige mt-1 shrink-0" size={24} />
                <div>
                  <h3 className="font-medium mb-1">YouTube</h3>
                  <p className="text-sm text-foreground-secondary">DANIVISUAL OFFICIAL</p>
                </div>
              </a>
              <div className="flex items-start gap-4 p-6 bg-white border border-border-line rounded-sm">
                <MapPin className="text-premium-beige mt-1 shrink-0" size={24} />
                <div className="flex-1">
                  <h3 className="font-medium mb-1">Alamat</h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    Utara lapangan, Mudah, Ngadirejan, Kec. Pringkuku, Kabupaten Pacitan, Jawa Timur 63552
                  </p>
                  <a
                    href="https://maps.app.goo.gl/iUyGZ5zmFTDUFQ5z5"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-premium-beige/10 text-premium-beige hover:bg-premium-beige hover:text-white transition-all rounded-sm text-sm font-medium"
                  >
                    <MapPin size={16} />
                    Lihat di Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-3xl mb-6" style={{ fontFamily: "var(--font-heading)" }}>
              Send an Inquiry
            </h2>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Nama"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
              <input
                type="text"
                placeholder="WhatsApp"
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              />
              <select className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige">
                <option>Jenis Layanan</option>
                <option>Wedding</option>
                <option>Prewed Studio</option>
                <option>Prewed Outdoor</option>
                <option>Event</option>
              </select>
              <textarea
                placeholder="Pesan"
                rows={4}
                className="w-full px-4 py-3 border border-border-line rounded-sm focus:outline-none focus:ring-1 focus:ring-premium-beige"
              ></textarea>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-dark-premium text-white hover:bg-dark-premium/90 transition-all rounded-sm text-sm"
              >
                Submit Inquiry
              </button>
            </form>
            <div className="mt-6">
              <p className="text-sm text-foreground-secondary text-center mb-4">atau</p>
              <Link
                to="/packages"
                className="w-full px-6 py-3 border border-border-line text-foreground hover:bg-background-soft transition-all rounded-sm text-sm"
              >
                View All Packages
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
