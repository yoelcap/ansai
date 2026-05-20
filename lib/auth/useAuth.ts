"use client";

import { useState, useEffect } from "react";
import type { User, AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-client";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  interface_language: string | null;
  onboarded: boolean;
  onboarding_step: number;
  current_business_id: string | null;
}

export interface Business {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

export function useAuth() {
  // Singleton — all useAuth() calls share the same browser client instance.
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfileAndBusiness(userId: string) {
      try {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        setProfile((profileData as Profile) ?? null);

        if (profileData) {
          const { data: businessData } = await supabase
            .from("businesses")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: true })
            .limit(1)
            .maybeSingle();

          setBusiness((businessData as Business) ?? null);
        }
      } catch (error) {
        console.error("Error fetching profile/business:", error);
      }
    }

    supabase.auth.getUser().then(async ({ data: { user: u } }: { data: { user: User | null } }) => {
      setUser(u ?? null);
      if (u) {
        await fetchProfileAndBusiness(u.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      const u = session?.user ?? null;
      if (u) {
        setUser(u);
        // TOKEN_REFRESHED only rotates the JWT — profile and business are unchanged.
        // Skip the DB round-trip to avoid spurious re-renders and parallel fetches.
        if (event !== "TOKEN_REFRESHED") {
          await fetchProfileAndBusiness(u.id);
        }
      } else if (event === "SIGNED_OUT") {
        // Only clear state on an explicit sign-out. A null session from
        // TOKEN_REFRESHED or other transient events is not a real sign-out
        // and must not trigger the AppShell guard that redirects to /login.
        setUser(null);
        setProfile(null);
        setBusiness(null);
      }
      // setLoading(false) is intentionally NOT called here.
      // Only getUser() (server-validated) controls the loading flag.
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  async function login(
    email: string,
    password: string
  ): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }

  async function signup(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error?: string }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { error: error.message };
    return {};
  }

  async function logout(): Promise<void> {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setBusiness(null);
    // Full reload to clear server-side session cookies
    window.location.href = "/login";
  }

  async function resetPassword(email: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  }

  async function updatePassword(newPassword: string): Promise<{ error?: string }> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return {};
  }

  return {
    user,
    profile,
    business,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
  };
}
