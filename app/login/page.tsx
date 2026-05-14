"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { AuthLayout } from "@/components/auth/AuthLayout";

async function getOnboardedRedirect(userId: string): Promise<string> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", userId)
    .single();
  return data?.onboarded ? "/dashboard" : "/onboarding";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword(
      { email, password }
    );

    if (signInError || !data.user) {
      const msg = signInError?.message ?? "";
      if (msg.includes("Invalid login credentials")) {
        setError("Email o contraseña incorrectos.");
      } else if (msg.includes("Email not confirmed")) {
        setError("Confirma tu email antes de iniciar sesión.");
      } else {
        setError(msg || "Ha ocurrido un error. Inténtalo de nuevo.");
      }
      setLoading(false);
      return;
    }

    const destination =
      redirectTo ?? (await getOnboardedRedirect(data.user.id));
    router.push(destination);
    router.refresh();
  };

  const handleGoogleLogin = async () => {
    setOauthLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <AuthLayout
      title="Bienvenido de vuelta"
      subtitle="Inicia sesión en tu cuenta de Ansai"
      footer={
        <>
          ¿No tienes cuenta?{" "}
          <Link
            href="/signup"
            className="text-forest font-medium hover:text-terra transition-colors"
          >
            Crear cuenta
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-ink mb-2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 bg-cream border border-line rounded-xl text-ink placeholder:text-ink-soft focus:outline-none focus:border-forest transition-colors"
            placeholder="tu@restaurante.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-ink"
            >
              Contraseña
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-ink-soft hover:text-terra transition-colors"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-cream border border-line rounded-xl text-ink placeholder:text-ink-soft focus:outline-none focus:border-forest transition-colors"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-terra/10 border border-terra/20 rounded-xl text-sm text-terra">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || oauthLoading}
          className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Iniciando sesión..." : "Iniciar sesión"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-line" />
          <span className="text-xs text-muted">o</span>
          <div className="flex-1 h-px bg-line" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || oauthLoading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-paper border border-line rounded-xl text-sm font-medium text-ink hover:bg-cream transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
          </svg>
          {oauthLoading ? "Redirigiendo..." : "Continuar con Google"}
        </button>
      </form>
    </AuthLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream" />}>
      <LoginForm />
    </Suspense>
  );
}
