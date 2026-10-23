"use client";

import { useState, useEffect, useRef } from "react";
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
  /** The shared public demo business (see /api/demo/login). */
  is_demo: boolean;
}

export function useAuth() {
  // Singleton — all useAuth() calls share the same browser client instance.
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  // Protección 2: guard contra fetchProfileAndBusiness paralelos.
  const isFetchingRef = useRef(false);

  // Defined outside effects so both the auth listener and the
  // visibilitychange handler can call it without duplicating logic.
  async function fetchProfileAndBusiness(userId: string) {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
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
    } finally {
      isFetchingRef.current = false;
    }
  }

  // Protección 1: única fuente de eventos — solo onAuthStateChange.
  // Supabase fires INITIAL_SESSION immediately on subscribe with the
  // cached session, so getUser() is no longer needed here.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      switch (event) {
        case "INITIAL_SESSION":
        case "SIGNED_IN":
        case "USER_UPDATED": {
          const u = session?.user ?? null;
          setUser(u);
          if (u) {
            // Never await Supabase calls inside onAuthStateChange: the auth
            // lock is still held and the query deadlocks. Defer it instead.
            setTimeout(() => {
              fetchProfileAndBusiness(u.id).finally(() => setLoading(false));
            }, 0);
          } else {
            setLoading(false);
          }
          break;
        }

        case "TOKEN_REFRESHED":
          // JWT rotated but profile/business are unchanged — skip the DB round-trip.
          setUser(session?.user ?? null);
          setLoading(false);
          break;

        case "SIGNED_OUT":
          setUser(null);
          setProfile(null);
          setBusiness(null);
          setLoading(false);
          break;

        default:
          setUser(session?.user ?? null);
          setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]); // fetchProfileAndBusiness omitted — captures stable refs (supabase singleton, setState fns, isFetchingRef)

  // Protección 3: si al recuperar el foco la sesión existe pero los datos
  // no (race fallida), los recuperamos sin esperar al siguiente evento auth.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === "visible" && user && (!profile || !business)) {
        fetchProfileAndBusiness(user.id);
      }
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile, business]); // fetchProfileAndBusiness omitted — see above

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
    // scope "local": end only this browser's session. The default ("global")
    // revokes every session of the user, so one visitor logging out of the
    // shared demo account would sign out everyone else using it.
    await supabase.auth.signOut({ scope: "local" });
    // signOut() triggers SIGNED_OUT in the listener above, which clears
    // user/profile/business. The explicit sets below ensure immediate UI
    // update before the redirect.
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
