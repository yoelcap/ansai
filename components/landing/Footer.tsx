"use client";

import { useTranslation } from "@/lib/i18n";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-forest-dark text-paper pt-20 pb-10 mt-20 rounded-t-[32px]">
      <div className="container-x">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 md:gap-16 mb-14">
          <div>
            <div className="font-serif text-3xl font-semibold text-paper mb-4">Ansai</div>
            <p className="text-white/60 text-sm max-w-[280px] leading-relaxed">{t("footer.tagline")}</p>
          </div>

          <div>
            <h5 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-gold mb-5">
              {t("footer.product")}
            </h5>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-white/70 hover:text-paper text-sm transition-colors">
                  {t("footer.features")}
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-white/70 hover:text-paper text-sm transition-colors">
                  {t("footer.pricing")}
                </a>
              </li>
              <li>
                <a href="#faq" className="text-white/70 hover:text-paper text-sm transition-colors">
                  {t("footer.faq")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-gold mb-5">
              {t("footer.company")}
            </h5>
            <ul className="space-y-3">
              <li>
                <a
                  href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
                  className="text-white/70 hover:text-paper text-sm transition-colors"
                >
                  {t("footer.contact")}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-gold mb-5">
              {t("footer.legal")}
            </h5>
            <ul className="space-y-3">
              <li>
                <a href="/terms" className="text-white/70 hover:text-paper text-sm transition-colors">
                  {t("footer.terms")}
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-white/70 hover:text-paper text-sm transition-colors">
                  {t("footer.privacy")}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4 text-[13px] text-white/50">
          <span>© 2026 Ansai. {t("footer.rights")}</span>
          <div className="flex items-center gap-5">
            <span>{t("footer.made")}</span>
            <a
              href="/login"
              className="text-white/40 hover:text-paper transition-colors border border-white/20 rounded-full px-3 py-1 hover:border-white/40"
            >
              {t("nav.login")} →
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
