"use client";

import { useState } from "react";
import { CheckCircle, Circle, ExternalLink } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";
import { CONTACT_EMAIL } from "@/lib/constants";
import { cn } from "@/lib/utils";

// ─── Platform card ────────────────────────────────────────────────────────────
interface PlatformCardProps {
  logo: React.ReactNode;
  title: string;
  description: string;
  comingSoon?: boolean;
  connected?: boolean;
  connectedName?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  t: (k: string) => string;
}

function PlatformCard({
  logo,
  title,
  description,
  comingSoon,
  connected,
  connectedName,
  onConnect,
  onDisconnect,
  t,
}: PlatformCardProps) {
  return (
    <div
      className={cn(
        "bg-paper border border-line rounded-2xl p-5 transition-opacity",
        comingSoon && "opacity-60"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="w-11 h-11 rounded-xl border border-line bg-cream flex items-center justify-center shrink-0">
          {logo}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>
            </div>

            {/* Status badge */}
            {comingSoon ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cream border border-line text-muted shrink-0">
                {t("app.settings.coming_soon_title")}
              </span>
            ) : connected ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-forest/10 text-forest shrink-0">
                <CheckCircle size={11} />
                {t("app.settings.google_connected")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-cream border border-line text-muted shrink-0">
                <Circle size={11} />
                {t("app.settings.google_not_connected")}
              </span>
            )}
          </div>

          {/* Action row */}
          {!comingSoon && (
            <div className="mt-3 flex items-center gap-3 flex-wrap">
              {connected ? (
                <>
                  <span className="text-xs text-ink font-medium">{connectedName}</span>
                  <button
                    onClick={onDisconnect}
                    className="text-xs text-terra hover:text-terra-light font-medium transition-colors"
                  >
                    {t("app.settings.google_disconnect")}
                  </button>
                </>
              ) : (
                <button
                  onClick={onConnect}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-forest text-paper text-xs font-medium hover:bg-forest-dark transition-colors"
                >
                  {t("app.settings.google_connect")}
                  <ExternalLink size={11} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Platform logos (text-based, no external images) ─────────────────────────
const GoogleLogo = () => (
  <span className="font-bold text-base" style={{ color: "#4285F4" }}>G</span>
);
const FacebookLogo = () => (
  <span className="font-bold text-base" style={{ color: "#1877F2" }}>f</span>
);
const TripAdvisorLogo = () => (
  <span className="font-bold text-[11px] text-center leading-tight text-[#34E0A1]">TA</span>
);
const TheForkLogo = () => (
  <span className="font-bold text-base" style={{ color: "#00B680" }}>tf</span>
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function IntegrationsPage() {
  const { t } = useTranslation();
  const { business } = useAuth();
  const [googleConnected, setGoogleConnected] = useState(true);

  return (
    <div className="space-y-4">
      {/* Google */}
      <PlatformCard
        logo={<GoogleLogo />}
        title={t("app.settings.google_title")}
        description={t("app.settings.google_desc")}
        connected={googleConnected}
        connectedName={business?.name ?? "Mi negocio"}
        onConnect={() => setGoogleConnected(true)}
        onDisconnect={() => setGoogleConnected(false)}
        t={t}
      />

      {/* Facebook */}
      <PlatformCard
        logo={<FacebookLogo />}
        title={t("app.settings.facebook_title")}
        description={t("app.settings.facebook_desc")}
        comingSoon
        t={t}
      />

      {/* TripAdvisor */}
      <PlatformCard
        logo={<TripAdvisorLogo />}
        title={t("app.settings.tripadvisor_title")}
        description={t("app.settings.tripadvisor_desc")}
        comingSoon
        t={t}
      />

      {/* TheFork */}
      <PlatformCard
        logo={<TheForkLogo />}
        title={t("app.settings.thefork_title")}
        description={t("app.settings.thefork_desc")}
        comingSoon
        t={t}
      />

      {/* Contact */}
      <p className="text-sm text-muted pt-1">
        {t("app.settings.integrations_contact")}{" "}
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="text-forest hover:text-forest-dark underline underline-offset-2 transition-colors"
        >
          {CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
