"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { useToast } from "@/lib/hooks/useToast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    toast.success("Contraseña actualizada correctamente.");
    router.push("/login");
  };

  return (
    <AuthLayout
      title="Nueva contraseña"
      subtitle="Elige una contraseña segura para tu cuenta."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-ink mb-2"
          >
            Nueva contraseña
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

        <div>
          <label
            htmlFor="confirm"
            className="block text-sm font-medium text-ink mb-2"
          >
            Confirmar contraseña
          </label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-cream border border-line rounded-xl text-ink placeholder:text-ink-soft focus:outline-none focus:border-forest transition-colors"
            placeholder="Repite la contraseña"
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
          {loading ? "Guardando..." : "Guardar nueva contraseña"}
        </button>
      </form>
    </AuthLayout>
  );
}
