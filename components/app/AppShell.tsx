"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";
import { getMockPendingCount } from "@/lib/mock/dashboardData";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Client-side auth guard as fallback to middleware
  // TODO: reemplazar por Supabase Auth
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/dev-login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="flex items-center gap-2">
          <span className="font-serif text-base text-forest">Ansai</span>
          <span className="w-1.5 h-1.5 rounded-full bg-terra animate-pulse-slow" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = () => {
    // TODO: reemplazar por Supabase Auth (signOut)
    logout();
    router.replace("/dev-login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-ink/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        pendingCount={getMockPendingCount()}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AppHeader
          businessName={user.businessName}
          onMenuClick={() => setSidebarOpen(true)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
