"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  pendingCount: number;
}

interface NavItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  badge?: number;
}

function NavItem({ href, icon, label, isActive, badge }: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
        isActive
          ? "bg-forest-light text-paper"
          : "text-paper/65 hover:text-paper hover:bg-white/10"
      }`}
    >
      <span className={isActive ? "text-paper" : "text-paper/50"}>{icon}</span>
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-terra text-paper text-[11px] px-1.5 py-0.5 rounded-full font-semibold leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}

function SettingsNav({ pathname, t }: { pathname: string; t: (k: string) => string }) {
  const isActive = pathname.startsWith("/settings");
  const [open, setOpen] = useState(isActive);

  useEffect(() => {
    if (isActive) setOpen(true);
  }, [isActive]);

  const subItems = [
    { href: "/settings/business", label: t("app.sidebar.settings_business") },
    { href: "/settings/tone", label: t("app.sidebar.settings_tone") },
    { href: "/settings/integrations", label: t("app.sidebar.settings_integrations") },
    { href: "/settings/billing", label: t("app.sidebar.settings_billing") },
    { href: "/settings/account", label: t("app.sidebar.settings_account") },
  ];

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          isActive
            ? "bg-forest-light text-paper"
            : "text-paper/65 hover:text-paper hover:bg-white/10"
        }`}
      >
        <Settings
          size={18}
          className={isActive ? "text-paper" : "text-paper/50"}
        />
        <span className="flex-1 text-left">{t("app.sidebar.settings")}</span>
        {open ? (
          <ChevronDown size={14} className="text-paper/40" />
        ) : (
          <ChevronRight size={14} className="text-paper/40" />
        )}
      </button>

      {open && (
        <div className="ml-9 mt-0.5 space-y-0.5">
          {subItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-3 py-2 rounded-lg text-xs transition-colors ${
                pathname === item.href
                  ? "text-paper font-semibold bg-white/10"
                  : "text-paper/55 hover:text-paper hover:bg-white/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ isOpen, onClose, pendingCount }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-30 w-60 bg-forest flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 lg:static lg:z-auto lg:shrink-0`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-serif text-lg font-semibold text-paper">
            Ansai
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-terra animate-pulse-slow" />
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden text-paper/40 hover:text-paper transition-colors"
          aria-label="Cerrar menú"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <NavItem
          href="/dashboard"
          icon={<LayoutDashboard size={18} />}
          label={t("app.sidebar.dashboard")}
          isActive={pathname === "/dashboard"}
        />
        <NavItem
          href="/reviews"
          icon={<MessageSquare size={18} />}
          label={t("app.sidebar.reviews")}
          isActive={pathname.startsWith("/reviews")}
          badge={pendingCount}
        />
        <NavItem
          href="/insights"
          icon={<BarChart3 size={18} />}
          label={t("app.sidebar.insights")}
          isActive={pathname.startsWith("/insights")}
        />
        <SettingsNav pathname={pathname} t={t} />
      </nav>

      {/* Help at bottom */}
      <div className="px-3 py-4 border-t border-white/10">
        <NavItem
          href="/help"
          icon={<HelpCircle size={18} />}
          label={t("app.sidebar.help")}
          isActive={false}
        />
      </div>
    </aside>
  );
}
