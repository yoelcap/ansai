"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";

export function FinalCTA() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const list = JSON.parse(localStorage.getItem("replyo-waitlist") || "[]");
      list.push({ email, ts: Date.now() });
      localStorage.setItem("replyo-waitlist", JSON.stringify(list));
    } catch {
      // ignore
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setEmail("");
    }, 5000);
  };

  return (
    <section id="cta" className="py-28 md:py-32 text-center">
      <div className="container-x">
        <h2 className="display-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal leading-[1] mb-6">
          {t("cta.title_part1")}
          <br />
          <em className="italic text-terra">{t("cta.title_em")}</em>
        </h2>

        <p className="text-lg md:text-xl text-muted max-w-[540px] mx-auto mb-10">{t("cta.subtitle")}</p>

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-[480px] mx-auto"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("hero.form_placeholder")}
              className="flex-1 px-6 py-[18px] bg-paper border border-line rounded-full text-[15px] focus:outline-none focus:border-forest transition-colors"
            />
            <button type="submit" className="btn-primary justify-center">
              <span>{t("hero.form_cta")}</span>
              <span>→</span>
            </button>
          </form>
        ) : (
          <div className="bg-forest text-paper px-6 py-4 rounded-full text-sm font-medium max-w-[480px] mx-auto">
            {t("hero.form_success")}
          </div>
        )}
      </div>
    </section>
  );
}
