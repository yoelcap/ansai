"use client";

import { useTranslation } from "@/lib/i18n";

export function Problem() {
  const { t } = useTranslation();

  return (
    <section className="my-16 md:my-20">
      <div className="container-x">
        <div className="bg-forest text-paper rounded-[32px] overflow-hidden relative">
          <div className="absolute -top-24 -left-24 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(196,102,61,0.15)_0%,transparent_70%)]" />

          <div className="relative px-6 sm:px-12 md:px-16 py-16 md:py-24 max-w-[1100px] mx-auto">
            <div className="text-[13px] font-semibold text-gold tracking-[0.15em] uppercase mb-5">
              {t("problem.eyebrow")}
            </div>

            <h2 className="display-serif text-4xl md:text-5xl lg:text-[56px] leading-[1.1] mb-14">
              {t("problem.title_part1")}
              <br />
              <em className="italic text-terra-light">{t("problem.title_em")}</em>
            </h2>

            <div className="grid md:grid-cols-3 gap-10">
              <div className="pt-6 border-t border-white/15">
                <div className="display-serif italic text-5xl text-terra-light leading-none mb-4">
                  {t("problem.stat1_num")}
                </div>
                <p className="text-[15px] leading-relaxed text-white/85">{t("problem.stat1")}</p>
              </div>
              <div className="pt-6 border-t border-white/15">
                <div className="display-serif italic text-5xl text-terra-light leading-none mb-4">
                  {t("problem.stat2_num")}
                </div>
                <p className="text-[15px] leading-relaxed text-white/85">{t("problem.stat2")}</p>
              </div>
              <div className="pt-6 border-t border-white/15">
                <div className="display-serif italic text-5xl text-terra-light leading-none mb-4">
                  {t("problem.stat3_num")}
                </div>
                <p className="text-[15px] leading-relaxed text-white/85">{t("problem.stat3")}</p>
              </div>
            </div>

            <p className="mt-12 text-[15px] text-white/70 max-w-xl leading-relaxed border-t border-white/10 pt-8">
              {t("problem.bottom")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
