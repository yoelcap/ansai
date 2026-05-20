"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/settings/business", labelKey: "app.settings.nav_business" },
  { href: "/settings/tone",     labelKey: "app.settings.nav_tone" },
  { href: "/settings/integrations", labelKey: "app.settings.nav_integrations" },
  { href: "/settings/team",     labelKey: "app.settings.nav_team" },
  { href: "/settings/billing",  labelKey: "app.settings.nav_billing" },
  { href: "/settings/account",  labelKey: "app.settings.nav_account" },
] as const;

function SettingsInner({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Page title */}
      <div className="mb-5">
        <h1 className="display-serif text-[26px] font-semibold text-forest">
          {t("app.settings.title")}
        </h1>
      </div>

      {/* Horizontal tab bar */}
      <div className="flex items-center gap-0.5 border-b border-line mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors shrink-0",
              pathname.startsWith(tab.href)
                ? "text-forest border-forest"
                : "text-muted border-transparent hover:text-ink"
            )}
          >
            {t(tab.labelKey)}
          </Link>
        ))}
      </div>

      {children}
    </div>
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsInner>{children}</SettingsInner>;
}
