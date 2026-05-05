"use client";

import { useTranslation } from "@/lib/i18n";

export function Hero() {
  const { t } = useTranslation();

  return (
    <section className="pt-44 pb-28 md:pt-48 md:pb-32 relative overflow-hidden">
      <div className="absolute top-24 -right-48 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(196,102,61,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="container-x">
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-16 md:gap-20 items-center">

          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-paper border border-line rounded-full text-[13px] font-medium text-forest mb-8 animate-slide-up">
              <span className="w-1.5 h-1.5 rounded-full bg-terra" />
              <span>{t("hero.eyebrow")}</span>
            </div>

            <h1 className="display-serif text-[48px] sm:text-[60px] md:text-[76px] leading-[0.97] font-normal text-ink mb-8 animate-slide-up [animation-delay:0.1s]">
              {t("hero.title_part1")}
              <br />
              <em className="italic font-light text-terra">{t("hero.title_em")}</em>
            </h1>

            <p className="text-lg md:text-xl text-muted leading-relaxed max-w-[520px] mb-10 animate-slide-up [animation-delay:0.2s]">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 animate-slide-up [animation-delay:0.3s]">
              <a href="/#cta" className="btn-primary justify-center">
                <span>{t("hero.cta_primary")}</span>
                <span>→</span>
              </a>
              <a
                href="/demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border border-ink/25 text-ink font-semibold text-sm transition-all hover:border-forest hover:text-forest"
              >
                {t("hero.cta_secondary")}
              </a>
            </div>

            <div className="mt-6 text-[13px] text-muted flex flex-wrap items-center gap-3 sm:gap-4 animate-slide-up [animation-delay:0.4s]">
              <span>{t("hero.trust1")}</span>
              <span className="hidden sm:inline w-px h-3 bg-line" />
              <span>{t("hero.trust2")}</span>
              <span className="hidden sm:inline w-px h-3 bg-line" />
              <span>{t("hero.trust3")}</span>
            </div>
          </div>

          {/* Right: demo card */}
          <div className="relative animate-slide-up [animation-delay:0.3s]">
            <div className="relative bg-paper border border-line rounded-3xl p-7 shadow-[0_30px_80px_rgba(20,40,33,0.12)]">
              <div className="absolute -top-3 -left-3 right-[30%] bottom-[30%] bg-terra rounded-3xl -z-10 opacity-15" />

              <div className="flex items-center gap-3 pb-5 mb-5 border-b border-line">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-gold to-terra flex items-center justify-center text-paper font-semibold text-base font-serif">
                  M
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-ink">María G.</div>
                  <div className="flex gap-0.5 mt-1 text-[13px]">
                    <span className="text-gold">★</span>
                    <span className="text-gold">★</span>
                    <span className="text-gold">★</span>
                    <span className="text-gold">★</span>
                    <span className="text-line">★</span>
                  </div>
                </div>
                <div className="text-xs text-muted">{t("demo.time")}</div>
              </div>

              <div className="bg-cream rounded-xl px-4 py-3.5 text-sm leading-relaxed text-ink-soft mb-5 border-l-[3px] border-gold">
                &ldquo;{t("demo.review")}&rdquo;
              </div>

              <div className="flex items-center gap-3 my-5 text-forest text-[11px] font-semibold uppercase tracking-[0.1em]">
                <span className="flex-1 h-px bg-line" />
                {t("demo.divider")}
                <span className="flex-1 h-px bg-line" />
              </div>

              <div className="relative bg-gradient-to-br from-forest/[0.03] to-terra/[0.03] rounded-xl px-4 py-3.5 text-sm leading-relaxed text-ink-soft border-l-[3px] border-forest">
                {t("demo.response")}
                <span className="absolute top-3 right-3.5 text-terra text-sm animate-spin-slow">✦</span>
              </div>

              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-4 py-2.5 bg-cream text-ink rounded-lg text-xs font-semibold hover:bg-cream-dark transition-colors">
                  {t("demo.edit")}
                </button>
                <button className="flex-1 px-4 py-2.5 bg-forest text-paper rounded-lg text-xs font-semibold hover:bg-forest-dark transition-colors">
                  {t("demo.approve")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
