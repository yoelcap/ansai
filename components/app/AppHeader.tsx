"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Globe, ChevronDown, User, Settings, LogOut } from "lucide-react";
import { useTranslation, Locale, localeLabels } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";

interface AppHeaderProps {
  businessName: string;
  onMenuClick: () => void;
  onLogout: () => void;
}

export function AppHeader({ businessName, onMenuClick, onLogout }: AppHeaderProps) {
  const { locale, setLocale, t } = useTranslation();
  const { user } = useAuth();
  const [langOpen, setLangOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initial = (businessName || "A").charAt(0).toUpperCase();

  return (
    <header className="h-14 bg-paper border-b border-line flex items-center px-4 gap-3 shrink-0 relative z-10">
      {/* Hamburger (mobile only) */}
      <button
        onClick={onMenuClick}
        className="lg:hidden text-ink-soft hover:text-ink transition-colors p-1"
        aria-label="Abrir menú"
      >
        <Menu size={20} />
      </button>

      {/* Business name */}
      <span className="font-serif font-semibold text-forest text-[15px] truncate flex-1">
        {businessName}
      </span>

      <div className="flex items-center gap-1">
        {/* Language selector */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => {
              setLangOpen(!langOpen);
              setUserOpen(false);
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink px-2.5 py-1.5 rounded-lg hover:bg-cream transition-colors"
          >
            <Globe size={13} />
            {localeLabels[locale]}
          </button>

          {langOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-paper border border-line rounded-xl shadow-lg py-1 min-w-[130px] z-20">
              {(Object.entries(localeLabels) as [Locale, string][]).map(
                ([loc, label]) => (
                  <button
                    key={loc}
                    onClick={() => {
                      setLocale(loc);
                      setLangOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-cream ${
                      locale === loc
                        ? "text-forest font-semibold"
                        : "text-ink"
                    }`}
                  >
                    {label}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Avatar dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setUserOpen(!userOpen);
              setLangOpen(false);
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-cream transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-forest flex items-center justify-center text-paper text-xs font-semibold">
              {initial}
            </div>
            <ChevronDown size={13} className="text-muted" />
          </button>

          {userOpen && (
            <div className="absolute right-0 top-full mt-1.5 bg-paper border border-line rounded-xl shadow-lg py-1 min-w-[170px] z-20">
              <div className="px-3 py-2.5 border-b border-line">
                <div className="text-xs font-semibold text-ink truncate">
                  {user?.businessName}
                </div>
                <div className="text-[11px] text-muted truncate mt-0.5">
                  {user?.email}
                </div>
              </div>

              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-cream transition-colors"
                onClick={() => setUserOpen(false)}
              >
                <User size={13} className="text-muted" />
                {t("app.header.profile")}
              </button>
              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink hover:bg-cream transition-colors"
                onClick={() => setUserOpen(false)}
              >
                <Settings size={13} className="text-muted" />
                {t("app.header.settings")}
              </button>

              <div className="border-t border-line my-1" />

              <button
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-terra hover:bg-cream transition-colors"
                onClick={() => {
                  setUserOpen(false);
                  onLogout();
                }}
              >
                <LogOut size={13} />
                {t("app.header.logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
