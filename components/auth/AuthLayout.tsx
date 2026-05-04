"use client";

import { ReactNode } from "react";
import Link from "next/link";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header simple */}
      <header className="py-6 px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-serif text-[24px] font-semibold tracking-tight text-forest"
        >
          Ansai
          <span className="w-2 h-2 rounded-full bg-terra animate-pulse-slow" />
        </Link>
      </header>

      {/* Main centrado */}
      <main className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-full max-w-[440px]">
          {/* Card */}
          <div className="bg-paper border border-line rounded-2xl p-8 sm:p-10 shadow-[0_4px_24px_rgba(20,40,33,0.04)]">
            <div className="mb-8">
              <h1 className="font-serif text-[32px] sm:text-[36px] leading-tight font-semibold text-forest tracking-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-2 text-[15px] text-ink-soft">{subtitle}</p>
              )}
            </div>

            {children}
          </div>

          {footer && (
            <div className="mt-6 text-center text-sm text-ink-soft">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
