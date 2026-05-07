"use client";

import { useRouter } from "next/navigation";
import { TranslationProvider, useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";

const DEMO_USER = {
  id: "demo-001",
  email: "demo@ansai.app",
  businessName: "Restaurante La Terracita",
  plan: "pro" as const,
};

function DevLoginContent() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();

  const handleDemoLogin = () => {
    // TODO: reemplazar por Supabase Auth (signInWithEmail / signInWithOAuth)
    login(DEMO_USER);
    router.replace("/dashboard");
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2">
            <span className="font-serif text-2xl font-semibold text-forest">
              Ansai
            </span>
            <span className="w-2 h-2 rounded-full bg-terra animate-pulse-slow" />
          </div>
        </div>

        {/* Card */}
        <div className="bg-paper border border-line rounded-2xl p-6 shadow-sm">
          <div className="mb-5">
            <p className="section-eyebrow">{t("app.dev_login.subtitle")}</p>
            <h1 className="display-serif text-[22px] font-semibold text-ink mt-1">
              {t("app.dev_login.title")}
            </h1>
          </div>

          {/* Demo user preview */}
          <div className="bg-cream rounded-xl p-3.5 mb-5 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Negocio</span>
              <span className="text-xs font-semibold text-ink">
                {DEMO_USER.businessName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Email</span>
              <span className="text-xs font-medium text-ink">
                {DEMO_USER.email}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Plan</span>
              <span className="text-xs font-semibold text-forest capitalize">
                {DEMO_USER.plan}
              </span>
            </div>
          </div>

          <button onClick={handleDemoLogin} className="btn-primary w-full justify-center">
            {t("app.dev_login.button")}
          </button>

          <p className="mt-4 text-[11px] text-muted text-center leading-relaxed">
            {t("app.dev_login.warning")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DevLoginPage() {
  return (
    <TranslationProvider>
      <DevLoginContent />
    </TranslationProvider>
  );
}
