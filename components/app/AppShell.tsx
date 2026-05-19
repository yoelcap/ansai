"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { createClient } from "@/lib/supabase-client";
import { PendingCountContext } from "@/lib/hooks/usePendingCount";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";

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
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!loading && user && profile !== null && !profile.onboarded) {
      router.replace("/onboarding");
    }
  }, [loading, user, profile, router]);

  const fetchPendingCount = useCallback(async (businessId: string) => {
    const supabase = createClient();
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("business_id", businessId)
      .eq("status", "pending");
    setPendingCount(count ?? 0);
  }, []);

  useEffect(() => {
    if (business?.id) fetchPendingCount(business.id);
  }, [business?.id, fetchPendingCount]);

  const refreshPendingCount = useCallback(() => {
    if (business?.id) fetchPendingCount(business.id);
  }, [business?.id, fetchPendingCount]);

  // Show spinner while loading auth state
  if (loading) return <Spinner />;

  // Show spinner while redirect-to-login is in flight
  if (!user) return <Spinner />;

  // User exists but profile not yet loaded (or RLS issue) — wait silently
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
    <PendingCountContext.Provider value={{ refreshPendingCount }}>
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
          pendingCount={pendingCount}
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
    </PendingCountContext.Provider>
  );
}
