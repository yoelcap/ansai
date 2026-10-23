"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * "Try the demo" button: a plain form POST to /api/demo/login, so it works
 * before hydration and is never triggered by link prefetching.
 */
export function DemoButton({ className, label }: { className?: string; label?: string }) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  return (
    <form action="/api/demo/login" method="post" onSubmit={() => setSubmitting(true)}>
      <button
        type="submit"
        disabled={submitting}
        aria-busy={submitting}
        data-testid="demo-login"
        className={cn("disabled:opacity-60 disabled:cursor-wait", className)}
      >
        {submitting ? t("demo_page.loading") : label ?? t("nav.demo")}
      </button>
    </form>
  );
}
