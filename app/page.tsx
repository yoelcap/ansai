"use client";

import { TranslationProvider } from "@/lib/i18n";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { ForWho } from "@/components/landing/ForWho";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { Trust } from "@/components/landing/Trust";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <TranslationProvider>
      <Navbar />
      <main>
        <Hero />
        <ForWho />
        <Problem />
        <HowItWorks />
        <Features />
        <Trust />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </TranslationProvider>
  );
}
