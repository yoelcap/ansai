"use client";

import { Lock } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

/** Shown above settings the shared demo account may look at but not change. */
export function DemoReadOnlyNote() {
  const { t } = useTranslation();
  return (
    <p
      data-testid="demo-readonly"
      className="mb-5 flex items-start gap-2 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-ink-soft"
    >
      <Lock size={13} className="mt-0.5 shrink-0 text-gold" />
      <span>{t("app.demo.settings_locked")}</span>
    </p>
  );
}
