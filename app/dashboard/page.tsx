import { createClient } from "@/lib/supabase-server";
import { LogoutButton } from "@/components/auth/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-line bg-paper">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-serif text-[24px] font-semibold text-forest">
            Ansai
            <span className="w-2 h-2 rounded-full bg-terra animate-pulse-slow" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-ink-soft hidden sm:inline">
              {user?.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="font-serif text-[40px] font-semibold text-forest tracking-tight">
          Bienvenido a Ansai
        </h1>
        <p className="mt-3 text-ink-soft text-[17px]">
          Tu dashboard estará aquí. De momento, esto es un placeholder para verificar que el auth funciona.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="bg-paper border border-line rounded-2xl p-6">
            <div className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Reseñas pendientes
            </div>
            <div className="mt-2 font-serif text-[36px] font-semibold text-forest">
              0
            </div>
          </div>
          <div className="bg-paper border border-line rounded-2xl p-6">
            <div className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Rating promedio
            </div>
            <div className="mt-2 font-serif text-[36px] font-semibold text-forest">
              —
            </div>
          </div>
          <div className="bg-paper border border-line rounded-2xl p-6">
            <div className="text-xs font-medium text-ink-soft uppercase tracking-wider">
              Locales activos
            </div>
            <div className="mt-2 font-serif text-[36px] font-semibold text-forest">
              0
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
