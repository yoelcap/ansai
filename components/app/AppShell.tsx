"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";
import { getMockPendingCount } from "@/lib/mock/dashboardData";

function Spinner() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="flex items-center gap-2">
        <span className="font-serif text-base text-forest">Ansai</span>
        <span className="w-1.5 h-1.5 rounded-full bg-terra animate-pulse-slow" />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, business, loading, logout } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && profile === null) {
      logout().then(() => router.replace("/login"));
    }
  }, [loading, user, profile, router, logout]);

  useEffect(() => {
    if (!loading && user && profile !== null && !profile.onboarded) {
      router.replace("/onboarding");
    }
  }, [loading, user, profile, router]);

  // Show spinner while loading auth state
  if (loading) return <Spinner />;

  // Show spinner while redirect-to-login is in flight
  if (!user) return <Spinner />;

  // User exists but has no profile — stale/invalid session, logout in progress
  if (profile === null) return <Spinner />;

  // Show spinner while redirect-to-onboarding is in flight
  if (!profile.onboarded) return <Spinner />;

  const displayName =
    business?.name ?? profile?.full_name ?? user.email ?? "Ansai";

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-cream">
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
          businessName={displayName}
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
