"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation, localeLabels, localeFullLabels, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { locale, setLocale, t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = desktopDropdownRef.current?.contains(target);
      const insideMobile = mobileDropdownRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const LangDropdown = () => (
    <div className="absolute top-full right-0 mt-2 bg-paper border border-line rounded-xl p-1.5 min-w-[150px] shadow-[0_10px_40px_rgba(20,40,33,0.12)] z-50">
      {(Object.keys(localeFullLabels) as Locale[]).map((l) => (
        <button
          key={l}
          onClick={() => {
            setLocale(l);
            setLangOpen(false);
          }}
          className={cn(
            "block w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            locale === l ? "bg-forest text-paper" : "text-ink hover:bg-cream"
          )}
        >
          {localeFullLabels[l]}
        </button>
      ))}
    </div>
  );

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 py-5 backdrop-blur-xl bg-cream/85 transition-colors",
        scrolled ? "border-b border-line" : "border-b border-transparent"
      )}
    >
      <div className="container-x flex items-center justify-between gap-6">
        <a href="/" className="flex flex-col leading-none">
          <div className="flex items-center gap-2 font-serif text-[28px] font-semibold tracking-tight text-forest">
            Ansai
            <span className="w-2 h-2 rounded-full bg-terra animate-pulse-slow" />
          </div>
          <span className="hidden md:block text-[11px] text-muted tracking-wide mt-0.5 font-sans font-normal">
            {t("nav.tagline")}
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#how" className="text-sm font-medium text-ink-soft hover:text-terra transition-colors">
            {t("nav.how")}
          </a>
          <a href="#features" className="text-sm font-medium text-ink-soft hover:text-terra transition-colors">
            {t("nav.features")}
          </a>
          <a href="#pricing" className="text-sm font-medium text-ink-soft hover:text-terra transition-colors">
            {t("nav.pricing")}
          </a>
          <a href="#faq" className="text-sm font-medium text-ink-soft hover:text-terra transition-colors">
            {t("nav.faq")}
          </a>

          <div className="relative" ref={desktopDropdownRef}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-paper border border-line rounded-full text-[13px] font-medium text-ink hover:border-forest transition-colors"
            >
              <span>{localeLabels[locale]}</span>
              <span className="text-[10px]">▼</span>
            </button>
            {langOpen && <LangDropdown />}
          </div>

          <a
            href="/login"
            className="text-sm font-medium text-ink-soft hover:text-terra transition-colors"
          >
            {t("nav.login")}
          </a>

          <a
            href="/demo"
            className="px-4 py-2 rounded-full border border-line text-sm font-medium text-ink hover:border-forest hover:text-forest transition-colors"
          >
            {t("nav.demo")}
          </a>

          <a href="/#cta" className="btn-primary">
            {t("nav.cta")}
          </a>
        </div>

        {/* Mobile: language + login + CTA */}
        <div className="flex md:hidden items-center gap-2">
          <div className="relative" ref={mobileDropdownRef}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 px-3 py-1.5 bg-paper border border-line rounded-full text-xs font-medium"
            >
              {localeLabels[locale]}
            </button>
            {langOpen && <LangDropdown />}
          </div>

          <a
            href="/login"
            className="text-xs font-medium text-ink-soft hover:text-terra transition-colors px-1"
          >
            {t("nav.login")}
          </a>

          <a href="/#cta" className="btn-primary !px-4 !py-2 text-xs">
            {t("nav.cta")}
          </a>
        </div>
      </div>
    </nav>
  );
}
