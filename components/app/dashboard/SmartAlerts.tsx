"use client";

import { TrendingUp, AlertTriangle, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import type { SmartAlert } from "@/lib/mock/dashboardData";

const alertStyles = {
  info: {
    Icon: Info,
    bg: "bg-forest/5",
    border: "border-forest/15",
    iconColor: "text-forest",
  },
  success: {
    Icon: TrendingUp,
    bg: "bg-forest/5",
    border: "border-forest/15",
    iconColor: "text-forest",
  },
  warning: {
    Icon: AlertTriangle,
    bg: "bg-terra/5",
    border: "border-terra/20",
    iconColor: "text-terra",
  },
} as const;

export function SmartAlerts({ alerts }: { alerts: SmartAlert[] }) {
  const { t } = useTranslation();

  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <h2 className="font-serif font-semibold text-ink text-base mb-4">
        {t("app.dashboard.alerts_title")}
      </h2>

      <ul className="space-y-2.5">
        {alerts.map((alert) => {
          const { Icon, bg, border, iconColor } = alertStyles[alert.type];
          return (
            <li
              key={alert.id}
              className={`flex items-start gap-3 p-3 rounded-xl border ${bg} ${border}`}
            >
              <Icon size={15} className={`shrink-0 mt-0.5 ${iconColor}`} />
              <p className="text-sm text-ink leading-snug">{alert.message}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
