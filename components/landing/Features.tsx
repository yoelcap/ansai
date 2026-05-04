"use client";

import { useTranslation } from "@/lib/i18n";

const ICONS = ["✦", "⚡", "◈", "⊕", "◉", "◐"];

export function Features() {
  const { t } = useTranslation();

  const features = [
    { title: t("features.f1_title"), desc: t("features.f1_desc") },
    { title: t("features.f2_title"), desc: t("features.f2_desc") },
    { title: t("features.f3_title"), desc: t("features.f3_desc") },
    { title: t("features.f4_title"), desc: t("features.f4_desc") },
    { title: t("features.f5_title"), desc: t("features.f5_desc") },
    { title: t("features.f6_title"), desc: t("features.f6_desc") },
  ];

  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container-x">
        <div className="bg-cream-dark rounded-[32px] px-6 sm:px-12 md:px-16 py-16 md:py-24">
          <div className="section-eyebrow">{t("features.eyebrow")}</div>

          <h2 className="display-serif text-4xl md:text-5xl lg:text-[56px] leading-[1.05] font-normal text-ink max-w-3xl mb-6">
            {t("features.title_part1")} <em className="italic text-forest">{t("features.title_em")}</em>{" "}
            {t("features.title_part2")}
          </h2>

          <p className="text-lg md:text-xl text-muted max-w-[640px] leading-relaxed">{t("features.subtitle")}</p>

          <div className="grid md:grid-cols-2 gap-6 mt-14">
            {features.map((f, i) => (
              <div
                key={i}
                className="bg-paper rounded-2xl p-8 border border-line transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(20,40,33,0.08)] hover:border-forest"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-forest to-forest-light rounded-xl flex items-center justify-center text-paper text-[22px] mb-5">
                  {ICONS[i]}
                </div>
                <h3 className="display-serif text-[22px] font-medium text-ink mb-2.5">{f.title}</h3>
                <p className="text-[15px] text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
