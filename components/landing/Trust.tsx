"use client";

import { useTranslation } from "@/lib/i18n";

const ICONS = ["◉", "◈", "✕"];

export function Trust() {
  const { t } = useTranslation();

  const cards = [
    { icon: ICONS[0], title: t("trust.card1_title"), desc: t("trust.card1_desc") },
    { icon: ICONS[1], title: t("trust.card2_title"), desc: t("trust.card2_desc") },
    { icon: ICONS[2], title: t("trust.card3_title"), desc: t("trust.card3_desc") },
  ];

  return (
    <section className="py-14 md:py-20">
      <div className="container-x">
        <div className="bg-cream-dark rounded-[32px] px-6 sm:px-12 md:px-16 py-14 md:py-20">
          <div className="section-eyebrow">{t("trust.eyebrow")}</div>

          <div className="md:flex md:items-end md:justify-between gap-12 mb-12">
            <h2 className="display-serif text-3xl md:text-4xl lg:text-[48px] leading-[1.1] font-normal text-ink max-w-lg">
              {t("trust.title")}
            </h2>
            <p className="text-base text-muted max-w-sm mt-4 md:mt-0 text-right hidden md:block">
              {t("trust.subtitle")}
            </p>
          </div>
          <p className="text-base text-muted mb-10 md:hidden">{t("trust.subtitle")}</p>

          <div className="grid md:grid-cols-3 gap-5">
            {cards.map((card, i) => (
              <div key={i} className="bg-paper rounded-2xl p-7 border border-line">
                <div className="w-10 h-10 bg-forest rounded-xl flex items-center justify-center text-paper text-lg mb-5">
                  {card.icon}
                </div>
                <h3 className="display-serif text-[20px] font-medium text-ink mb-2">
                  {card.title}
                </h3>
                <p className="text-[14px] text-muted leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
