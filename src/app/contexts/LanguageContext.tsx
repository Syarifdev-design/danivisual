import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Language = "ID" | "EN";

const LANGUAGE_STORAGE_KEY = "danivisual_language";
export const LANGUAGE_CHANGE_EVENT = "danivisual-language-change";

type LanguageContextType = {
  language: Language;
  setLanguage: (value: Language) => void;
  t: <T,>(copy: Record<Language, T>) => T;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === "undefined") return "ID";
    return (localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language) || "ID";
  });

  const setLanguage = (value: Language) => {
    setLanguageState(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
    document.documentElement.lang = value === "ID" ? "id" : "en";
    window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: value }));
  };

  useEffect(() => {
    document.documentElement.lang = language === "ID" ? "id" : "en";
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: <T,>(copy: Record<Language, T>) => copy[language],
    }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
