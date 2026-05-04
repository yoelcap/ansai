"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-client";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
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
        subtitle={`Hemos enviado un enlace de confirmación a ${email}.`}
      >
        <div className="space-y-4">
          <div className="px-4 py-4 bg-forest/5 border border-forest/15 rounded-xl">
            <p className="text-sm text-ink">
              Haz click en el enlace del email para activar tu cuenta. Si no lo
              ves, revisa tu carpeta de spam.
            </p>
          </div>
          <Link
            href="/login"
            className="block text-center text-sm text-forest font-medium hover:text-terra transition-colors"
          >
            Volver a iniciar sesión
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Crea tu cuenta"
      subtitle="Empieza gratis. Sin tarjeta de crédito."
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-forest font-medium hover:text-terra transition-colors">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-ink mb-2">
            Nombre
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full px-4 py-3 bg-cream border border-line rounded-xl text-ink placeholder:text-ink-soft focus:outline-none focus:border-forest transition-colors"
            placeholder="María García"
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-ink mb-2">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={8}
            className="w-full px-4 py-3 bg-cream border border-line rounded-xl text-ink placeholder:text-ink-soft focus:outline-none focus:border-forest transition-colors"
            placeholder="Mínimo 8 caracteres"
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
          {loading ? "Creando cuenta..." : "Crear cuenta gratis"}
        </button>

        <p className="text-xs text-ink-soft text-center leading-relaxed">
          Al crear tu cuenta aceptas los{" "}
          <Link href="/terms" className="text-forest hover:text-terra transition-colors">
            Términos
          </Link>{" "}
          y la{" "}
          <Link href="/privacy" className="text-forest hover:text-terra transition-colors">
            Política de Privacidad
          </Link>
          .
        </p>
      </form>
    </AuthLayout>
  );
}
