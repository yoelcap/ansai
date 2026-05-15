"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, ExternalLink } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";
import { createClient } from "@/lib/supabase-client";
import { useToast } from "@/lib/hooks/useToast";
import { CONTACT_EMAIL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  business_id: string;
  provider: string;
  status: "disconnected" | "connected" | "error" | "expired";
}

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
        <div className="w-11 h-11 rounded-xl border border-line bg-cream flex items-center justify-center shrink-0">
          {logo}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-ink">{title}</h3>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">{description}</p>
            </div>

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

function CardSkeleton() {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-line shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 bg-line rounded" />
          <div className="h-3 w-48 bg-line rounded" />
        </div>
      </div>
    </div>
  );
}

// ─── Logos ────────────────────────────────────────────────────────────────────
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
  const { business, loading } = useAuth();
  const { toast } = useToast();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [dbLoading, setDbLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!business?.id) { setDbLoading(false); return; }

    const supabase = createClient();
    supabase
      .from("integrations")
      .select("*")
      .eq("business_id", business.id)
      .then(({ data }) => {
        if (data) setIntegrations(data as Integration[]);
        setDbLoading(false);
      });
  }, [loading, business?.id]);

  const getStatus = (provider: string) =>
    integrations.find((i) => i.provider === provider)?.status ?? "disconnected";

  const handleComingSoon = () => toast.info(t("app.settings.comingSoon"));

  if (loading || dbLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
    );
  }

  const googleConnected = getStatus("google") === "connected";

  return (
    <div className="space-y-4">
      <PlatformCard
        logo={<GoogleLogo />}
        title={t("app.settings.google_title")}
        description={t("app.settings.google_desc")}
        connected={googleConnected}
        connectedName={business?.name ?? ""}
        onConnect={handleComingSoon}
        onDisconnect={handleComingSoon}
        t={t}
      />

      <PlatformCard
        logo={<FacebookLogo />}
        title={t("app.settings.facebook_title")}
        description={t("app.settings.facebook_desc")}
        comingSoon
        t={t}
      />

      <PlatformCard
        logo={<TripAdvisorLogo />}
        title={t("app.settings.tripadvisor_title")}
        description={t("app.settings.tripadvisor_desc")}
        comingSoon
        t={t}
      />

      <PlatformCard
        logo={<TheForkLogo />}
        title={t("app.settings.thefork_title")}
        description={t("app.settings.thefork_desc")}
        comingSoon
        t={t}
      />

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
