"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MessageSquare, BarChart3, SlidersHorizontal } from "lucide-react";
import { TranslationProvider, useTranslation } from "@/lib/i18n";
import { DemoButton } from "@/components/DemoButton";

const POINTS = [
  { icon: MessageSquare, key: "point_reviews" },
  { icon: BarChart3, key: "point_insights" },
  { icon: SlidersHorizontal, key: "point_tone" },
] as const;

function DemoContent() {
  const { t } = useTranslation();
  const unavailable = useSearchParams().get("error") === "demo_unavailable";

  return (
    <div className="min-h-screen bg-cream">
      <header className="container-x py-6 flex items-center justify-between">
        <a
          href="/"
          className="font-serif text-[26px] font-semibold tracking-tight text-forest flex items-center gap-2"
        >
          Ansai
          <span className="w-2 h-2 rounded-full bg-terra animate-pulse-slow" />
        </a>
        <a href="/" className="text-sm font-medium text-muted hover:text-terra transition-colors">
          {t("demo_page.back")}
        </a>
      </header>

      <main className="container-x pt-10 pb-20">
        <section className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-paper border border-line rounded-full text-[13px] font-medium text-forest mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-terra" />
            <span>{t("demo_page.eyebrow")}</span>
          </div>
          <h1 className="display-serif text-4xl sm:text-5xl md:text-[64px] leading-[1.0] font-normal text-ink mb-5">
            {t("demo_page.title")}
          </h1>
          <p className="text-lg md:text-xl text-muted max-w-[560px] mx-auto leading-relaxed">
            {t("demo_page.subtitle")}
          </p>
        </section>

        <section className="max-w-2xl mx-auto bg-paper rounded-3xl border border-line shadow-[0_8px_40px_rgba(20,40,33,0.08)] p-8 md:p-10">
          <ul className="space-y-5 mb-8">
            {POINTS.map(({ icon: Icon, key }) => (
              <li key={key} className="flex items-start gap-4">
                <span className="w-10 h-10 rounded-xl bg-forest/10 text-forest flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </span>
                <p className="text-sm text-ink leading-relaxed pt-2.5">{t(`demo_page.${key}`)}</p>
              </li>
            ))}
          </ul>

          {unavailable && (
            <div
              role="alert"
              className="mb-4 px-4 py-3 bg-terra/10 border border-terra/20 rounded-xl text-sm text-terra"
            >
              {t("demo_page.error_unavailable")}
            </div>
          )}

          <DemoButton
            label={t("demo_page.cta")}
            className="btn-primary w-full justify-center"
          />
          <p className="mt-4 text-xs text-muted text-center">{t("demo_page.note")}</p>
        </section>
      </main>
    </div>
  );
}

export default function DemoPage() {
  return (
    <TranslationProvider>
      <Suspense fallback={<div className="min-h-screen bg-cream" />}>
        <DemoContent />
      </Suspense>
    </TranslationProvider>
  );
}
