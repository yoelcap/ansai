"use client";

import { useTranslation } from "@/lib/i18n";

export function HowItWorks() {
  const { t } = useTranslation();

  return (
    <section id="how" className="py-20 md:py-28">
      <div className="container-x">
        <div className="section-eyebrow">{t("how.eyebrow")}</div>

        <h2 className="display-serif text-4xl md:text-5xl lg:text-[56px] leading-[1.05] font-normal text-ink max-w-3xl mb-6">
          {t("how.title_part1")} <em className="italic text-forest">{t("how.title_em")}</em>
          {t("how.title_part2")}
        </h2>

        <p className="text-lg md:text-xl text-muted max-w-[640px] leading-relaxed">{t("how.subtitle")}</p>

        <div className="grid md:grid-cols-3 gap-10 mt-16 md:mt-20">
          <div>
            <div className="display-serif italic text-7xl md:text-8xl font-light text-terra leading-[0.9] mb-5">01</div>
            <h3 className="display-serif text-2xl font-medium text-ink mb-3">{t("how.step1_title")}</h3>
            <p className="text-[15px] text-muted leading-relaxed">{t("how.step1_desc")}</p>
          </div>
          <div>
            <div className="display-serif italic text-7xl md:text-8xl font-light text-terra leading-[0.9] mb-5">02</div>
            <h3 className="display-serif text-2xl font-medium text-ink mb-3">{t("how.step2_title")}</h3>
            <p className="text-[15px] text-muted leading-relaxed">{t("how.step2_desc")}</p>
          </div>
          <div>
            <div className="display-serif italic text-7xl md:text-8xl font-light text-terra leading-[0.9] mb-5">03</div>
            <h3 className="display-serif text-2xl font-medium text-ink mb-3">{t("how.step3_title")}</h3>
            <p className="text-[15px] text-muted leading-relaxed">{t("how.step3_desc")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
