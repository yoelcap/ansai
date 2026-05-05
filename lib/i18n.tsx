"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import esTranslations from "@/locales/es.json";
import enTranslations from "@/locales/en.json";
import nlTranslations from "@/locales/nl.json";
import frTranslations from "@/locales/fr.json";
import deTranslations from "@/locales/de.json";

export type Locale = "es" | "en" | "nl" | "fr" | "de";

const translations = {
  es: esTranslations,
  en: enTranslations,
  nl: nlTranslations,
  fr: frTranslations,
  de: deTranslations,
} as const;

export const localeLabels: Record<Locale, string> = {
  es: "🇪🇸 ES",
  en: "🇬🇧 EN",
  nl: "🇳🇱 NL",
  fr: "🇫🇷 FR",
  de: "🇩🇪 DE",
};

export const localeFullLabels: Record<Locale, string> = {
  es: "🇪🇸 Español",
  en: "🇬🇧 English",
  nl: "🇳🇱 Nederlands",
  fr: "🇫🇷 Français",
  de: "🇩🇪 Deutsch",
};

type TranslationContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const STORAGE_KEY = "replyo-locale";

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("es");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let initial: Locale = "es";
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (saved && saved in translations) {
        initial = saved;
      } else {
        const browserLang = navigator.language.slice(0, 2) as Locale;
        if (browserLang in translations) {
          initial = browserLang;
        }
      }
    } catch {
      // localStorage might be unavailable
    }
    setLocaleState(initial);
    setIsHydrated(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // ignore
    }
  };

  const t = (key: string): string => {
    const dict = translations[locale];
    const keys = key.split(".");
    let result: unknown = dict;
    for (const k of keys) {
      if (result && typeof result === "object" && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }
    return typeof result === "string" ? result : key;
  };

  // Avoid hydration mismatch by rendering with default until client is ready
  if (!isHydrated) {
    return (
      <TranslationContext.Provider value={{ locale: "es", setLocale, t: (key) => {
        const dict = translations.es;
        const keys = key.split(".");
        let result: unknown = dict;
        for (const k of keys) {
          if (result && typeof result === "object" && k in result) {
            result = (result as Record<string, unknown>)[k];
          } else {
            return key;
          }
        }
        return typeof result === "string" ? result : key;
      }}}>
        {children}
      </TranslationContext.Provider>
    );
  }

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
}
