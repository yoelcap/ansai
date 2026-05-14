"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";

export default function DevLoginPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else {
      router.replace(profile?.onboarded ? "/dashboard" : "/onboarding");
    }
  }, [loading, user, profile, router]);

  return <div className="min-h-screen bg-cream" />;
}
