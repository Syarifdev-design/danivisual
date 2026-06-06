import { useState } from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

export default function FloatingWhatsApp() {
  const { language, setLanguage, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);

  const chooseLanguage = (lang: "ID" | "EN") => {
    setLanguage(lang);
    setShowLangMenu(false);
  };

  return (
    <div className="fixed bottom-5 right-4 z-50 flex flex-col gap-2 items-end lg:bottom-6 lg:right-6 lg:gap-3">
      <div className="relative notranslate" translate="no">
        <button
          onClick={() => setShowLangMenu(!showLangMenu)}
          className="notranslate bg-white hover:bg-background-soft border border-border-line rounded-full px-3 py-2 shadow-lg hover:shadow-xl transition-all flex items-center gap-2 text-xs font-medium tracking-[0.16em] lg:px-4 lg:py-2.5 lg:text-sm"
          aria-label={t({ ID: "Ubah bahasa website", EN: "Change website language" })}
          translate="no"
        >
          <Globe size={16} className="text-premium-beige" />
          <span className="notranslate text-foreground" translate="no">
            {language}
          </span>
        </button>

        {showLangMenu && (
          <div className="notranslate absolute bottom-full right-0 mb-2 min-w-[180px] overflow-hidden rounded-sm border border-border-line bg-white shadow-xl" translate="no">
            <button
              onClick={() => chooseLanguage("ID")}
              className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                language === "ID"
                  ? "bg-premium-beige/10 font-medium text-premium-beige"
                  : "text-foreground hover:bg-background-soft"
              }`}
            >
              Bahasa Indonesia
              <span className="mt-0.5 block text-[11px] text-foreground-secondary">Hangat, personal, dan premium.</span>
            </button>
            <button
              onClick={() => chooseLanguage("EN")}
              className={`w-full border-t border-border-line px-4 py-3 text-left text-sm transition-colors ${
                language === "EN"
                  ? "bg-premium-beige/10 font-medium text-premium-beige"
                  : "text-foreground hover:bg-background-soft"
              }`}
            >
              English
              <span className="mt-0.5 block text-[11px] text-foreground-secondary">Editorial, refined, and client-ready.</span>
            </button>
          </div>
        )}
      </div>

      <a
        href="https://wa.me/6282337279636"
        target="_blank"
        rel="noopener noreferrer"
        className="group relative bg-white hover:bg-background-soft border border-border-line rounded-full p-2.5 shadow-lg hover:shadow-xl transition-all hover:scale-105 lg:p-3"
        aria-label={t({ ID: "Chat melalui WhatsApp", EN: "Chat on WhatsApp" })}
      >
        <div className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center transition-transform group-hover:rotate-12">
          <svg
            viewBox="0 0 375 375"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            <path
              d="M318.3 56.5C283.1 21.2 237.5 2.1 189.5 2C88.3 2 6.6 83.7 6.6 184.9c0 32.2 8.4 63.6 24.4 91.4L5.2 367.8l94.7-24.9c26.7 14.5 56.7 22.2 87.3 22.2h.1c101.2 0 182.9-81.7 182.9-182.9 0-48.9-19.1-94.8-53.9-129.7zM189.5 335.8h-.1c-27.2 0-53.9-7.3-77.1-21.1l-5.5-3.3-57.3 15 15.3-55.9-3.6-5.7c-15.2-24.2-23.2-52.2-23.2-80.9 0-83.9 68.3-152.2 152.4-152.2 40.7 0 78.9 15.9 107.7 44.8 28.8 28.8 44.6 67.2 44.6 107.9-.1 84-68.4 152.4-152.2 152.4zm83.5-114c-4.6-2.3-27.1-13.4-31.3-14.9-4.2-1.5-7.3-2.3-10.3 2.3-3.1 4.6-11.9 14.9-14.6 18-2.7 3.1-5.4 3.5-10 1.1-4.6-2.3-19.3-7.1-36.7-22.6-13.6-12.1-22.7-27-25.4-31.6-2.7-4.6-.3-7.1 2-9.4 2.1-2.1 4.6-5.4 6.9-8.1 2.3-2.7 3.1-4.6 4.6-7.7 1.5-3.1.8-5.8-.4-8.1-1.1-2.3-10.3-24.8-14.1-34-3.7-8.9-7.5-7.7-10.3-7.8-2.7-.1-5.8-.1-8.8-.1-3.1 0-8 1.1-12.2 5.8-4.2 4.6-16 15.6-16 38.1s16.4 44.2 18.7 47.2c2.3 3.1 32.2 49.2 78 69 10.7 4.6 19.1 7.4 25.6 9.5 10.8 3.4 20.6 2.9 28.4 1.8 8.7-1.3 27.1-11.1 30.9-21.8 3.8-10.7 3.8-19.9 2.7-21.8-1.2-1.9-4.2-3.1-8.9-5.4z"
              fill="#25D366"
            />
          </svg>
        </div>

        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-dark-premium text-white px-3 py-2 rounded-sm text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          {t({ ID: "Konsultasi via WhatsApp", EN: "Concierge on WhatsApp" })}
          <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-dark-premium"></div>
        </div>
      </a>
    </div>
  );
}
