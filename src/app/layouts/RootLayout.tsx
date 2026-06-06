import { Outlet, useLocation } from "react-router";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FloatingWhatsApp from "../components/FloatingWhatsApp";
import { useContent } from "../contexts/ContentContext";

const seoPageMap: Array<[RegExp, string]> = [
  [/^\/$/, "home"],
  [/^\/portfolio/, "portfolio"],
  [/^\/services/, "services_page"],
  [/^\/packages|^\/checkout/, "packages"],
  [/^\/faq/, "faq"],
  [/^\/about/, "about"],
  [/^\/contact/, "contact"],
  [/^\/login|^\/register/, "auth"],
];

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, name);
    document.head.appendChild(element);
  }
  element.content = content;
}

export default function RootLayout() {
  const location = useLocation();
  const { content, getImage } = useContent();
  const isLoginPage = location.pathname === "/login";
  const pageId = seoPageMap.find(([pattern]) => pattern.test(location.pathname))?.[1] || "home";
  const seo = content.find(menu => menu.id === pageId && menu.status !== "draft")?.seo;

  useEffect(() => {
    if (!seo) return;
    document.title = seo.title;
    setMeta("description", seo.description);
    if (seo.keywords) setMeta("keywords", seo.keywords);
    setMeta("og:title", seo.title, true);
    setMeta("og:description", seo.description, true);
    const ogImage = seo.ogImage ? getImage(seo.ogImage, seo.ogImage) : "";
    if (ogImage) setMeta("og:image", ogImage, true);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = `${window.location.origin}${seo.canonicalPath || location.pathname}`;
  }, [getImage, location.pathname, seo]);

  return (
    <div className="min-h-screen flex flex-col">
      {!isLoginPage && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isLoginPage && <Footer />}
      {!isLoginPage && <FloatingWhatsApp />}
    </div>
  );
}
