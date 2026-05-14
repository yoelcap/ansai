"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoToDashboard = async () => {
    if (!user) return;
    setWorking(true);
    setError(null);

    try {
      const res = await fetch("/api/complete-onboarding", { method: "POST" });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Error during onboarding:", err);
      setError("No se pudo completar la configuración. Inténtalo de nuevo.");
      setWorking(false);
    }
  };

  // Still loading auth — don't show the button yet
  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="font-serif text-2xl font-semibold text-forest">Ansai</span>
          <span className="w-2 h-2 rounded-full bg-terra animate-pulse-slow" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-paper border border-line rounded-2xl p-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="font-serif text-2xl font-semibold text-forest">Ansai</span>
          <span className="w-2 h-2 rounded-full bg-terra animate-pulse-slow" />
        </div>
        <h1 className="font-serif text-2xl font-semibold text-ink mb-2">
          ¡Bienvenido a Ansai!
        </h1>
        <p className="text-sm text-muted mb-8">
          La configuración inicial llegará pronto. Por ahora puedes explorar el dashboard.
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-terra/10 border border-terra/20 rounded-xl text-sm text-terra">
            {error}
          </div>
        )}

        <button
          onClick={handleGoToDashboard}
          disabled={working || !user}
          className="btn-primary justify-center w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {working ? "Configurando..." : "Ir al dashboard →"}
        </button>
      </div>
    </div>
  );
}
