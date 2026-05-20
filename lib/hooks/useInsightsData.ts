"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-client";
import { useAuth } from "@/lib/auth/useAuth";
import type {
  Period,
  InsightsData,
  RatingPoint,
  StarBucket,
  LanguageBucket,
  CriticalIssue,
} from "@/lib/mock/insightsData";
import type { Metric } from "@/lib/mock/dashboardData";

// Mirrors hex values from tailwind.config.ts / insightsData.ts
const C = {
  forest: "#1f3a2e",
  forestLight: "#2d5544",
  terra: "#c4663d",
  terraLight: "#d97e54",
  gold: "#c9a961",
} as const;

const STAR_COLORS: Record<number, string> = {
  5: C.forest,
  4: C.forestLight,
  3: C.gold,
  2: C.terraLight,
  1: C.terra,
};

const LANG_COLORS = [C.forest, C.forestLight, C.terra, C.gold, C.gold];

function periodDays(period: Period): number {
  return period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
}

function getDateRange(period: Period): { start: Date; prevStart: Date } {
  const days = periodDays(period);
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const prevStart = new Date(start);
  prevStart.setDate(prevStart.getDate() - days);
  return { start, prevStart };
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function fmtChange(
  current: number,
  prev: number
): { change: string; trend: Metric["trend"] } {
  if (prev === 0) return { change: "—", trend: "neutral" };
  const diff = current - prev;
  const sign = diff >= 0 ? "+" : "";
  return {
    change: `${sign}${diff.toFixed(1)}`,
    trend: diff > 0 ? "positive" : diff < 0 ? "negative" : "neutral",
  };
}

function buildRatingEvolution(
  reviews: { rating: number; review_date: string }[],
  period: Period
): RatingPoint[] {
  if (!reviews.length) return [];

  const bucketKey = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (period === "year")
      return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    if (period === "90d") {
      const week = Math.ceil(d.getDate() / 7);
      return `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}-W${week}`;
    }
    return dateStr.slice(0, 10);
  };

  const formatLabel = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (period === "year")
      return d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
    if (period === "90d") {
      const week = Math.ceil(d.getDate() / 7);
      return `S${week} ${d.toLocaleDateString("es-ES", { month: "short" })}`;
    }
    return `${d.getDate()} ${d.toLocaleDateString("es-ES", { month: "short" })}`;
  };

  const buckets = new Map<string, { sum: number; count: number; firstDate: string }>();
  for (const r of reviews) {
    const key = bucketKey(r.review_date);
    const entry = buckets.get(key);
    if (entry) {
      entry.sum += r.rating;
      entry.count += 1;
    } else {
      buckets.set(key, { sum: r.rating, count: 1, firstDate: r.review_date });
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { sum, count, firstDate }]) => ({
      date: formatLabel(firstDate),
      rating: Math.round((sum / count) * 10) / 10,
    }));
}

function buildStarDistribution(reviews: { rating: number }[]): StarBucket[] {
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of reviews) {
    const s = Math.round(r.rating);
    if (s >= 1 && s <= 5) counts[s]++;
  }
  return [5, 4, 3, 2, 1].map((s) => ({
    label: `${s} ★`,
    count: counts[s],
    color: STAR_COLORS[s],
  }));
}

function buildLanguageShare(reviews: { language: string }[]): LanguageBucket[] {
  const counts = new Map<string, number>();
  for (const r of reviews) {
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([code, count], i) => ({
      code: code.toUpperCase(),
      label: code.toUpperCase(),
      count,
      color: LANG_COLORS[i % LANG_COLORS.length],
    }));
}

function buildCriticalIssues(
  reviews: { id: string; rating: number; text: string | null }[]
): CriticalIssue[] {
  const critical = reviews
    .filter((r) => r.rating <= 2 && r.text)
    .slice(-3)
    .reverse();

  return critical.map((r) => ({
    id: r.id,
    topic: r.rating === 1 ? "Reseña 1 ★" : "Reseña 2 ★",
    mentions: 1,
    severity: r.rating === 1 ? ("high" as const) : ("medium" as const),
    example: `«${(r.text ?? "").slice(0, 130)}${(r.text ?? "").length > 130 ? "…" : ""}»`,
  }));
}

export interface InsightsState {
  data: InsightsData | null;
  loading: boolean;
  error: string | null;
  totalReviews: number;
  retry: () => void;
}

export function useInsightsData(period: Period): InsightsState {
  const { business, loading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());
  const [state, setState] = useState<Omit<InsightsState, "retry">>({
    data: null,
    loading: true,
    error: null,
    totalReviews: 0,
  });

  const load = useCallback(async () => {
    if (!business?.id) return;
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const { start, prevStart } = getDateRange(period);

      const [reviewsResult, prevReviewsResult] = await Promise.all([
        supabase
          .from("reviews")
          .select("id, rating, language, review_date, text, status")
          .eq("business_id", business.id)
          .gte("review_date", start.toISOString())
          .order("review_date", { ascending: true }),
        supabase
          .from("reviews")
          .select("rating")
          .eq("business_id", business.id)
          .gte("review_date", prevStart.toISOString())
          .lt("review_date", start.toISOString()),
      ]);

      if (reviewsResult.error) throw reviewsResult.error;

      type ReviewRow = { id: string; rating: number; language: string; review_date: string; text: string | null; status: string };
      const reviews = (reviewsResult.data ?? []) as ReviewRow[];
      const prevReviews = (prevReviewsResult.data ?? []) as { rating: number }[];

      // Response rate: count responded reviews
      let responseRate = 0;
      if (reviews.length > 0) {
        const ids = reviews.map((r) => r.id);
        const { data: responses } = await supabase
          .from("responses")
          .select("review_id")
          .in("review_id", ids);
        responseRate = Math.round(((responses?.length ?? 0) / reviews.length) * 100);
      }

      const currentAvg = avg(reviews.map((r) => r.rating));
      const prevAvg = avg(prevReviews.map((r) => r.rating));
      const ratingChg = fmtChange(currentAvg, prevAvg);
      const countChg = fmtChange(reviews.length, prevReviews.length);

      const kpis = {
        avgRating: {
          value: reviews.length ? Math.round(currentAvg * 10) / 10 : "—",
          change: ratingChg.change,
          trend: ratingChg.trend,
          changeContext: "",
        } as Metric,
        reviewsReceived: {
          value: reviews.length,
          change: countChg.change,
          trend: countChg.trend,
          changeContext: "",
        } as Metric,
        responseRate: {
          value: `${responseRate}%`,
          change: "—",
          trend: "neutral" as const,
          changeContext: "",
        } as Metric,
        avgResponseTime: {
          value: "—",
          change: "",
          trend: "neutral" as const,
          changeContext: "",
        } as Metric,
      };

      const data: InsightsData = {
        kpis,
        ratingEvolution: buildRatingEvolution(reviews, period),
        starDistribution: buildStarDistribution(reviews),
        languageShare: buildLanguageShare(reviews),
        topics: [],
        criticalIssues: buildCriticalIssues(reviews),
      };

      setState({ data, loading: false, error: null, totalReviews: reviews.length });
    } catch (err) {
      console.error("[useInsightsData] error:", err);
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, [business?.id, period, supabase]);

  useEffect(() => {
    if (authLoading) return;
    if (!business?.id) {
      setState({ data: null, loading: false, error: null, totalReviews: 0 });
      return;
    }
    load();
  }, [authLoading, load]);

  return { ...state, retry: load };
}
