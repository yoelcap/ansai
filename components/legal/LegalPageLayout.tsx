"use client";

import { useTranslation } from "@/lib/i18n";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

interface LegalSection {
  titleKey: string;
  bodyKey: string;
}

interface LegalPageLayoutProps {
  page: "terms" | "privacy";
  sections: LegalSection[];
}

export function LegalPageLayout({ page, sections }: LegalPageLayoutProps) {
  const { t } = useTranslation();

  const oppositeHref = page === "terms" ? "/privacy" : "/terms";
  const oppositeLabelKey = page === "terms" ? "footer.privacy" : "footer.terms";

  return (
    <>
      <Navbar />

      <main className="pt-28 pb-20 min-h-screen">
        <div className="container-x">
          <div className="max-w-2xl mx-auto">

            {/* Header */}
            <div className="mb-12">
              <p className="section-eyebrow">Ansai</p>
              <h1 className="display-serif text-4xl md:text-[52px] font-semibold text-ink leading-[1.1] mb-3">
                {t(`${page}.title`)}
              </h1>
              <p className="text-muted text-sm">{t(`${page}.subtitle`)}</p>
            </div>

            {/* Divider */}
            <div className="h-px bg-line mb-12" />

            {/* Sections */}
            <div className="space-y-10">
              {sections.map(({ titleKey, bodyKey }, i) => (
                <section key={i}>
                  <h2 className="font-serif text-xl font-semibold text-ink mb-2">
                    {t(titleKey)}
                  </h2>
                  <p className="text-ink-soft leading-relaxed text-[15px]">
                    {t(bodyKey)}
                  </p>
                </section>
              ))}
            </div>

            {/* Mini legal nav */}
            <div className="mt-16 pt-8 border-t border-line flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              <a href="/" className="hover:text-terra transition-colors">
                ← Ansai
              </a>
              <a href={oppositeHref} className="hover:text-terra transition-colors">
                {t(oppositeLabelKey)}
              </a>
              <a
                href={`mailto:${process.env.NEXT_PUBLIC_CONTACT_EMAIL}`}
                className="hover:text-terra transition-colors"
              >
                {process.env.NEXT_PUBLIC_CONTACT_EMAIL}
              </a>
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
