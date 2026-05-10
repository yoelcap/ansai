"use client";

import { Clock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function BillingPage() {
  const { t } = useTranslation();
  return (
    <div className="bg-paper border border-line rounded-2xl p-12 text-center">
      <Clock size={28} className="text-muted mx-auto mb-3" />
      <h2 className="font-serif text-lg font-semibold text-ink mb-1.5">
        {t("app.settings.coming_soon_title")}
      </h2>
      <p className="text-sm text-muted">{t("app.settings.coming_soon_desc")}</p>
    </div>
  );
}
