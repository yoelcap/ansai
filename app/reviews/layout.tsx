"use client";

import { TranslationProvider } from "@/lib/i18n";
import { AppShell } from "@/components/app/AppShell";

export default function ReviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TranslationProvider>
      <AppShell>{children}</AppShell>
    </TranslationProvider>
  );
}
