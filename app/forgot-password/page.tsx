"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings/account`,
    });

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <AuthLayout
        title="Revisa tu email"
        subtitle={`Si existe una cuenta con ${email}, recibirás un enlace para restablecer tu contraseña.`}
      >
        <Link
          href="/login"
          className="block text-center text-sm text-forest font-medium hover:text-terra transition-colors"
        >
          Volver a iniciar sesión
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te enviaremos un enlace para crear una nueva."
      footer={
        <Link href="/login" className="text-forest font-medium hover:text-terra transition-colors">
          ← Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-ink mb-2">
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

        {error && (
          <div className="px-4 py-3 bg-terra/10 border border-terra/20 rounded-xl text-sm text-terra">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Enviando..." : "Enviar enlace"}
        </button>
      </form>
    </AuthLayout>
  );
}
