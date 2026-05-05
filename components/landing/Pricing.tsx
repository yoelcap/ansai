"use client";

import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Plan {
  name: string;
  tagline: string;
  desc: string;
  price: string;
  daily: string;
  aiLabel: string;
  aiTones?: string;
  features: string[];
  cta: string;
  featured: boolean;
}

export function Pricing() {
  const { t } = useTranslation();

  const plans: Plan[] = [
    {
      name: t("pricing.starter_name"),
      tagline: t("pricing.starter_tagline"),
      desc: t("pricing.starter_desc"),
      price: "€25",
      daily: t("pricing.starter_daily"),
      aiLabel: t("pricing.starter_ai"),
      features: [
        t("pricing.starter_f1"),
        t("pricing.starter_f2"),
        t("pricing.starter_f3"),
        t("pricing.starter_f4"),
      ],
      cta: t("pricing.starter_cta"),
      featured: false,
    },
    {
      name: t("pricing.pro_name"),
      tagline: t("pricing.pro_tagline"),
      desc: t("pricing.pro_desc"),
      price: "€75",
      daily: t("pricing.pro_daily"),
      aiLabel: t("pricing.pro_ai"),
      aiTones: t("pricing.pro_tones"),
      features: [
        t("pricing.pro_f1"),
        t("pricing.pro_f2"),
        t("pricing.pro_f3"),
        t("pricing.pro_f4"),
        t("pricing.pro_f5"),
        t("pricing.pro_f6"),
      ],
      cta: t("pricing.pro_cta"),
      featured: true,
    },
    {
      name: t("pricing.biz_name"),
      tagline: t("pricing.biz_tagline"),
      desc: t("pricing.biz_desc"),
      price: "€150",
      daily: t("pricing.biz_daily"),
      aiLabel: t("pricing.biz_ai"),
      features: [
        t("pricing.biz_f1"),
        t("pricing.biz_f2"),
        t("pricing.biz_f3"),
        t("pricing.biz_f4"),
        t("pricing.biz_f5"),
        t("pricing.biz_f6"),
        t("pricing.biz_f7"),
      ],
      cta: t("pricing.biz_cta"),
      featured: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28">
      <div className="container-x">
        <div className="section-eyebrow">{t("pricing.eyebrow")}</div>

        <h2 className="display-serif text-4xl md:text-5xl lg:text-[56px] leading-[1.05] font-normal text-ink max-w-3xl mb-6">
          {t("pricing.title_part1")}{" "}
          <em className="italic text-forest">{t("pricing.title_em")}</em>{" "}
          {t("pricing.title_part2")}
        </h2>

        <p className="text-lg md:text-xl text-muted max-w-[640px] leading-relaxed">
          {t("pricing.subtitle")}
        </p>

        <div className="grid md:grid-cols-3 gap-6 mt-14">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "rounded-3xl p-8 md:p-10 relative transition-all",
                plan.featured
                  ? "bg-forest text-paper border border-forest md:scale-[1.03] shadow-[0_30px_60px_rgba(20,40,33,0.2)]"
                  : "bg-paper border border-line"
              )}
            >
              {plan.featured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-terra text-paper px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-wider uppercase">
                  {t("pricing.popular")}
                </div>
              )}

              <div className="display-serif text-2xl font-medium mb-0.5">{plan.name}</div>
              <p className={cn("text-[12px] font-semibold uppercase tracking-[0.1em] mb-2", plan.featured ? "text-gold" : "text-terra")}>
                {plan.tagline}
              </p>
              <p className={cn("text-sm mb-8", plan.featured ? "text-white/70" : "text-muted")}>
                {plan.desc}
              </p>

              <div className="display-serif text-[56px] font-normal leading-none mb-0.5">
                {plan.price}
                <span className={cn("text-lg font-sans", plan.featured ? "text-white/70" : "text-muted")}>
                  /mes
                </span>
              </div>
              <p className={cn("text-[12px] mb-1", plan.featured ? "text-white/50" : "text-muted/70")}>
                {plan.daily}
              </p>
              <p className={cn("text-[13px] mb-8", plan.featured ? "text-white/60" : "text-muted")}>
                {t("pricing.period")}
              </p>

              {/* AI response highlight */}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3.5 mb-8",
                  plan.featured ? "bg-white/10" : "bg-forest/[0.05] border border-forest/15"
                )}
              >
                <p className={cn("text-[10px] font-semibold uppercase tracking-[0.14em] mb-1", plan.featured ? "text-gold" : "text-terra")}>
                  ✦ Automático
                </p>
                <p className={cn("font-semibold text-[15px]", plan.featured ? "text-paper" : "text-ink")}>
                  {plan.aiLabel}
                </p>
                {plan.aiTones && (
                  <p className={cn("text-[13px] mt-1", plan.featured ? "text-white/60" : "text-muted")}>
                    {plan.aiTones}
                  </p>
                )}
              </div>

              <ul className="mb-8 space-y-2.5">
                {plan.features.map((feat, i) => (
                  <li
                    key={i}
                    className={cn(
                      "py-2.5 text-sm flex items-start gap-2.5 border-b last:border-b-0",
                      plan.featured ? "border-white/10" : "border-black/5"
                    )}
                  >
                    <span className={cn("flex-shrink-0 font-bold", plan.featured ? "text-gold" : "text-terra")}>
                      ✓
                    </span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.featured ? "/signup" : plan.name === t("pricing.biz_name") ? "mailto:yoel.capilla@gmail.com" : "/signup"}
                className={cn(
                  "block w-full py-3.5 rounded-full text-sm font-semibold border text-center transition-colors",
                  plan.featured
                    ? "bg-paper text-forest border-paper hover:bg-gold hover:text-forest-dark hover:border-gold"
                    : "bg-transparent text-ink border-ink hover:bg-ink hover:text-paper"
                )}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
