"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function FAQ() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<number | null>(0);

  const items = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
    { q: t("faq.q4"), a: t("faq.a4") },
    { q: t("faq.q5"), a: t("faq.a5") },
    { q: t("faq.q6"), a: t("faq.a6") },
    { q: t("faq.q7"), a: t("faq.a7") },
    { q: t("faq.q8"), a: t("faq.a8") },
    { q: t("faq.q9"), a: t("faq.a9") },
    { q: t("faq.q10"), a: t("faq.a10") },
  ];

  return (
    <section id="faq" className="py-20 md:py-28">
      <div className="container-x">
        <div className="section-eyebrow">{t("faq.eyebrow")}</div>

        <h2 className="display-serif text-4xl md:text-5xl lg:text-[56px] leading-[1.05] font-normal text-ink max-w-3xl mb-12">
          {t("faq.title_part1")} <em className="italic text-forest">{t("faq.title_em")}</em>{" "}
          {t("faq.title_part2")}
        </h2>

        <div className="max-w-[900px]">
          {items.map((item, i) => (
            <div
              key={i}
              className="border-b border-line cursor-pointer"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="flex justify-between items-center gap-6 py-7">
                <h4 className="display-serif text-xl md:text-[22px] font-medium text-ink">
                  {item.q}
                </h4>
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-lg transition-all",
                    open === i ? "bg-forest text-paper rotate-45" : "bg-cream-dark text-forest"
                  )}
                >
                  +
                </div>
              </div>
              <div
                className={cn(
                  "overflow-hidden transition-all",
                  open === i ? "max-h-96 pb-7" : "max-h-0"
                )}
              >
                <p className="text-base text-muted leading-relaxed">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
