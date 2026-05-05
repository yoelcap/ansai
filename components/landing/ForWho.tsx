"use client";

import { useTranslation } from "@/lib/i18n";

const ICONS = ["⊕", "✦", "◐"];

export function ForWho() {
  const { t } = useTranslation();

  const cards = [
    { icon: ICONS[0], title: t("for_who.card1_title"), desc: t("for_who.card1_desc") },
    { icon: ICONS[1], title: t("for_who.card2_title"), desc: t("for_who.card2_desc") },
    { icon: ICONS[2], title: t("for_who.card3_title"), desc: t("for_who.card3_desc") },
  ];

  return (
    <section className="py-14 md:py-20">
      <div className="container-x">
        <div className="text-center mb-10">
          <div className="section-eyebrow">{t("for_who.eyebrow")}</div>
          <h2 className="display-serif text-3xl md:text-4xl lg:text-[48px] leading-[1.1] font-normal text-ink">
            {t("for_who.title")}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <div
              key={i}
              className="bg-paper border border-line rounded-2xl p-7 flex items-start gap-5 hover:border-forest transition-colors"
            >
              <div className="w-11 h-11 flex-shrink-0 bg-gradient-to-br from-forest to-forest-light rounded-xl flex items-center justify-center text-paper text-xl">
                {card.icon}
              </div>
              <div>
                <h3 className="display-serif text-[18px] font-medium text-ink mb-1.5">
                  {card.title}
                </h3>
                <p className="text-[14px] text-muted leading-relaxed">{card.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
