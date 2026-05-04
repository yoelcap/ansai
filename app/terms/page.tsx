"use client";

import { TranslationProvider } from "@/lib/i18n";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const SECTIONS = [
  { titleKey: "terms.s1_title", bodyKey: "terms.s1_body" },
  { titleKey: "terms.s2_title", bodyKey: "terms.s2_body" },
  { titleKey: "terms.s3_title", bodyKey: "terms.s3_body" },
  { titleKey: "terms.s4_title", bodyKey: "terms.s4_body" },
  { titleKey: "terms.s5_title", bodyKey: "terms.s5_body" },
];

export default function TermsPage() {
  return (
    <TranslationProvider>
      <LegalPageLayout page="terms" sections={SECTIONS} />
    </TranslationProvider>
  );
}
