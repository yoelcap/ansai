"use client";

import { TranslationProvider } from "@/lib/i18n";
import { LegalPageLayout } from "@/components/legal/LegalPageLayout";

const SECTIONS = [
  { titleKey: "privacy.s1_title", bodyKey: "privacy.s1_body" },
  { titleKey: "privacy.s2_title", bodyKey: "privacy.s2_body" },
  { titleKey: "privacy.s3_title", bodyKey: "privacy.s3_body" },
  { titleKey: "privacy.s4_title", bodyKey: "privacy.s4_body" },
  { titleKey: "privacy.s5_title", bodyKey: "privacy.s5_body" },
];

export default function PrivacyPage() {
  return (
    <TranslationProvider>
      <LegalPageLayout page="privacy" sections={SECTIONS} />
    </TranslationProvider>
  );
}
