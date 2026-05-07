"use client";

import { useState, useEffect, useCallback } from "react";

export type Plan = "starter" | "pro" | "business";

export interface FakeUser {
  id: string;
  email: string;
  businessName: string;
  plan: Plan;
}

// TODO: reemplazar por Supabase Auth
const STORAGE_KEY = "replyo_fake_user";
const COOKIE_NAME = "replyo_fake_user";

function setCookie(value: string) {
  // TODO: reemplazar por Supabase Auth (session cookie)
  const maxAge = 60 * 60 * 24 * 7; // 7 días
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie() {
  // TODO: reemplazar por Supabase Auth (session invalidation)
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
}

export function useAuth() {
  const [user, setUser] = useState<FakeUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: reemplazar por Supabase Auth (getUser())
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as FakeUser);
    } catch {
      // ignore parse errors
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData: FakeUser) => {
    // TODO: reemplazar por Supabase Auth (signInWithEmail)
    const raw = JSON.stringify(userData);
    try {
      localStorage.setItem(STORAGE_KEY, raw);
      setCookie(raw);
    } catch {
      // ignore storage errors
    }
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    // TODO: reemplazar por Supabase Auth (signOut)
    try {
      localStorage.removeItem(STORAGE_KEY);
      deleteCookie();
    } catch {
      // ignore storage errors
    }
    setUser(null);
  }, []);

  return { user, loading, login, logout };
}
