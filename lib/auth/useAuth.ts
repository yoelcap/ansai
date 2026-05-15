"use client";

import { useState, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
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
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

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

    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      setUser(u ?? null);
      if (u) {
        await fetchProfileAndBusiness(u.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchProfileAndBusiness(u.id);
      } else {
        setProfile(null);
        setBusiness(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(
    email: string,
    password: string
  ): Promise<{ error?: string }> {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return {};
  }

  async function signup(
    email: string,
    password: string,
    fullName: string
  ): Promise<{ error?: string }> {
    const supabase = createClient();
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
  const supabase = createClient();
  await supabase.auth.signOut();
  setUser(null);
  setProfile(null);
  setBusiness(null);
  // Fuerza recarga completa para limpiar cookies del servidor
  window.location.href = "/login";
}

  async function resetPassword(email: string): Promise<{ error?: string }> {
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) return { error: error.message };
    return {};
  }

  async function updatePassword(newPassword: string): Promise<{ error?: string }> {
    const supabase = createClient();
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
