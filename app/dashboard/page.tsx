"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth/useAuth";
import { createClient } from "@/lib/supabase-client";
import type {
  Metric,
  ChartDataPoint,
  SmartAlert,
  DashboardMetrics,
} from "@/lib/mock/dashboardData";
import { KPICard } from "@/components/app/dashboard/KPICard";
import { PendingReviews } from "@/components/app/dashboard/PendingReviews";
import { RatingChart } from "@/components/app/dashboard/RatingChart";
import { SmartAlerts } from "@/components/app/dashboard/SmartAlerts";
import type { ReviewWithResponse } from "@/components/app/dashboard/ReviewSlideOver";

// ─── Raw DB types ─────────────────────────────────────────────────────────────

interface DbReview {
  id: string;
  rating: number;
  status: string;
  created_at: string;
  review_date: string | null;
  language: string | null;
  text: string | null;
  customer_name: string | null;
  source: string | null;
  responses: Array<{
    text: string | null;
    edited_text: string | null;
    status: string | null;
    model_used: string | null;
    approved_at: string | null;
  }> | null;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Replace {key} placeholders in a translated string. */
function ipl(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template
  );
}

/** Locale-aware relative time using native Intl.RelativeTimeFormat. */
function formatRelativeTime(isoDate: string | null | undefined, locale: string): string {
  if (!isoDate) return "";
  try {
    const diff = Date.now() - new Date(isoDate).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (mins < 60) return rtf.format(-mins, "minute");
    if (hours < 24) return rtf.format(-hours, "hour");
    return rtf.format(-days, "day");
  } catch {
    return "";
  }
}

type TFn = (key: string) => string;

function mapDbReviewToCard(row: DbReview, locale: string): ReviewWithResponse {
  const resp = row.responses?.[0] ?? null;
  const authorName = row.customer_name ?? "—";
  return {
    id: row.id,
    authorName,
    authorInitial: authorName.charAt(0).toUpperCase(),
    rating: Math.min(5, Math.max(1, row.rating)) as 1 | 2 | 3 | 4 | 5,
    text: row.text ?? "",
    language: row.language ?? "es",
    createdAt: row.created_at,
    relativeTime: formatRelativeTime(row.review_date ?? row.created_at, locale),
    status: "pending",
    source: row.source ?? "manual",
    responseText: resp?.text ?? null,
    editedText: resp?.edited_text ?? null,
    responseStatus: resp?.status ?? null,
    modelUsed: resp?.model_used ?? null,
  };
}

function buildMetrics(reviews: DbReview[], t: TFn): DashboardMetrics {
  const now = Date.now();
  const ms30 = 30 * 24 * 3600 * 1000;
  const ms60 = 60 * 24 * 3600 * 1000;
  const thisMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).getTime();
  const lastMonthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth() - 1,
    1
  ).getTime();

  const overallAvg = avg(reviews.map((r) => r.rating));

  const recent30 = reviews.filter((r) => now - new Date(r.created_at).getTime() < ms30);
  const prev30 = reviews.filter((r) => {
    const age = now - new Date(r.created_at).getTime();
    return age >= ms30 && age < ms60;
  });
  const ratingDiff =
    recent30.length > 0 && prev30.length > 0
      ? (avg(recent30.map((r) => r.rating)) ?? 0) - (avg(prev30.map((r) => r.rating)) ?? 0)
      : null;

  const avgRating: Metric = {
    value: overallAvg !== null ? overallAvg.toFixed(1) : "—",
    change:
      ratingDiff !== null
        ? `${ratingDiff >= 0 ? "+" : ""}${ratingDiff.toFixed(1)}`
        : t("app.dashboard.noData"),
    trend:
      ratingDiff === null
        ? "neutral"
        : ratingDiff > 0
        ? "positive"
        : ratingDiff < 0
        ? "negative"
        : "neutral",
    changeContext: "",
  };

  const thisMonthCount = reviews.filter(
    (r) => new Date(r.created_at).getTime() >= thisMonthStart
  ).length;
  const lastMonthCount = reviews.filter((r) => {
    const ts = new Date(r.created_at).getTime();
    return ts >= lastMonthStart && ts < thisMonthStart;
  }).length;
  const countDiff = thisMonthCount - lastMonthCount;

  const totalReviews: Metric = {
    value: reviews.length,
    change: `${countDiff >= 0 ? "+" : ""}${countDiff}`,
    trend: countDiff > 0 ? "positive" : countDiff < 0 ? "negative" : "neutral",
    changeContext: "",
  };

  const pending = reviews.filter((r) => r.status === "pending");
  const urgent = pending.filter((r) => r.rating <= 2);
  const urgentLabel =
    urgent.length === 0
      ? t("app.dashboard.upToDate")
      : `${urgent.length} ${urgent.length === 1 ? t("app.dashboard.urgentOne") : t("app.dashboard.urgentMany")}`;

  const pendingCount: Metric = {
    value: pending.length,
    change: urgentLabel,
    trend: urgent.length > 0 ? "negative" : "neutral",
    changeContext: "",
  };

  const responseTimes: number[] = [];
  for (const review of reviews) {
    const resp = review.responses?.[0];
    if (resp?.approved_at) {
      const approvedAt = new Date(resp.approved_at).getTime();
      if (now - approvedAt < ms30) {
        const hours = (approvedAt - new Date(review.created_at).getTime()) / 3600000;
        if (hours >= 0) responseTimes.push(hours);
      }
    }
  }
  const avgHours = avg(responseTimes);

  const avgResponseTime: Metric = {
    value: avgHours !== null ? `${avgHours.toFixed(1)}h` : "—",
    change: avgHours !== null ? "" : t("app.dashboard.noData"),
    trend: "neutral",
    changeContext: "",
  };

  return { avgRating, totalReviews, pendingCount, avgResponseTime };
}

function buildChartData(reviews: DbReview[]): ChartDataPoint[] {
  const now = Date.now();
  const ms30 = 30 * 24 * 3600 * 1000;
  const map = new Map<string, number[]>();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 24 * 3600 * 1000);
    map.set(d.toISOString().slice(0, 10), []);
  }

  for (const r of reviews) {
    const ts = new Date(r.created_at).getTime();
    if (now - ts < ms30) {
      const key = new Date(r.created_at).toISOString().slice(0, 10);
      map.get(key)?.push(Number(r.rating));
    }
  }

  return Array.from(map.entries())
    .filter(([, ratings]) => ratings.length > 0)
    .map(([isoDate, ratings]) => {
      const d = new Date(isoDate);
      const label = `${d.getDate()} ${d.toLocaleString("es", { month: "short" })}`;
      return { date: label, rating: avg(ratings) as number };
    });
}

const NEGATIVE_WORDS: Record<string, string[]> = {
  es: ["lento", "frío", "sucio", "caro", "malo", "espera", "tarde"],
  en: ["slow", "cold", "dirty", "expensive", "bad", "wait", "rude"],
  nl: ["langzaam", "koud", "vies", "duur", "slecht", "wachten"],
  fr: ["lent", "froid", "sale", "cher", "mauvais", "attente"],
  de: ["langsam", "kalt", "schmutzig", "teuer", "schlecht", "warten"],
};

function buildAlerts(reviews: DbReview[], t: TFn): SmartAlert[] {
  const now = Date.now();
  const ms7 = 7 * 24 * 3600 * 1000;
  const ms30 = 30 * 24 * 3600 * 1000;
  const ms60 = 60 * 24 * 3600 * 1000;
  const ms48h = 48 * 3600 * 1000;
  const alerts: SmartAlert[] = [];

  const recent7 = reviews.filter((r) => now - new Date(r.created_at).getTime() < ms7);
  const wordCounts = new Map<string, number>();
  for (const review of recent7) {
    const lang = review.language ?? "es";
    const words = NEGATIVE_WORDS[lang] ?? NEGATIVE_WORDS.es;
    const text = (review.text ?? "").toLowerCase();
    const seen = new Set<string>();
    for (const w of words) {
      if (!seen.has(w) && text.includes(w)) {
        seen.add(w);
        wordCounts.set(w, (wordCounts.get(w) ?? 0) + 1);
      }
    }
  }
  for (const [word, count] of wordCounts) {
    if (count >= 3) {
      alerts.push({
        id: `word-${word}`,
        type: "warning",
        message: ipl(t("app.dashboard.alertWordMention"), { count, word }),
      });
    }
  }

  const recent30 = reviews.filter((r) => now - new Date(r.created_at).getTime() < ms30);
  const prev30 = reviews.filter((r) => {
    const age = now - new Date(r.created_at).getTime();
    return age >= ms30 && age < ms60;
  });
  if (recent30.length > 0 && prev30.length > 0) {
    const diff =
      (avg(recent30.map((r) => r.rating)) ?? 0) -
      (avg(prev30.map((r) => r.rating)) ?? 0);
    if (Math.abs(diff) >= 0.3) {
      const key =
        diff > 0 ? "app.dashboard.alertRatingUp" : "app.dashboard.alertRatingDown";
      alerts.push({
        id: "rating-trend",
        type: diff > 0 ? "success" : "warning",
        message: ipl(t(key), { diff: Math.abs(diff).toFixed(1) }),
      });
    }
  }

  const critical48h = reviews.filter(
    (r) => r.rating <= 2 && now - new Date(r.created_at).getTime() < ms48h
  );
  if (critical48h.length > 0) {
    const key =
      critical48h.length === 1
        ? "app.dashboard.alertCriticalOne"
        : "app.dashboard.alertCriticalMany";
    alerts.push({
      id: "critical-48h",
      type: "warning",
      message: ipl(t(key), { count: critical48h.length }),
    });
  }

  return alerts;
}

// ─── Skeleton components ──────────────────────────────────────────────────────

function KPISkeleton() {
  return (
    <div className="rounded-2xl p-5 flex flex-col gap-3 border bg-paper border-line">
      <div className="h-2.5 w-20 bg-line rounded animate-pulse" />
      <div className="h-9 w-16 bg-line rounded animate-pulse" />
      <div className="h-2.5 w-28 bg-line rounded animate-pulse" />
    </div>
  );
}

function PendingSkeleton() {
  return (
    <div className="bg-paper border border-line rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-line">
        <div className="h-4 w-36 bg-line rounded animate-pulse" />
      </div>
      <ul className="divide-y divide-line">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-start gap-3 px-5 py-3.5">
            <div className="w-8 h-8 rounded-full bg-line animate-pulse shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 bg-line rounded animate-pulse w-32" />
              <div className="h-3 bg-line rounded animate-pulse w-full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AlertsSkeleton() {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <div className="h-4 w-36 bg-line rounded animate-pulse mb-4" />
      <div className="space-y-2.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-10 bg-line rounded-xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <div className="h-4 w-40 bg-line rounded animate-pulse mb-1" />
      <div className="h-3 w-24 bg-line rounded animate-pulse mb-4" />
      <div className="h-[180px] bg-line rounded-xl animate-pulse" />
    </div>
  );
}

function EmptyStateCard({ t }: { t: TFn }) {
  return (
    <div className="lg:col-span-3 bg-paper border border-line rounded-2xl p-10 text-center">
      <p className="font-serif text-xl text-forest mb-2">
        {t("app.dashboard.emptyState")}
      </p>
      <p className="text-sm text-muted mb-5">{t("app.dashboard.emptyStateDesc")}</p>
      <Link href="/reviews" className="btn-primary inline-flex">
        {t("app.dashboard.addFirstReview")}
      </Link>
    </div>
  );
}

const ZERO_METRICS: DashboardMetrics = {
  avgRating: { value: "—", change: "", trend: "neutral", changeContext: "" },
  totalReviews: { value: 0, change: "", trend: "neutral", changeContext: "" },
  pendingCount: { value: 0, change: "", trend: "neutral", changeContext: "" },
  avgResponseTime: { value: "—", change: "", trend: "neutral", changeContext: "" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { t, locale } = useTranslation();
  const { business, loading: authLoading } = useAuth();

  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawReviews, setRawReviews] = useState<DbReview[]>([]);
  const [rawPending, setRawPending] = useState<DbReview[]>([]);

  // Derived — recompute on locale change without re-fetching
  const hasAnyReviews = rawReviews.length > 0;
  const metrics = useMemo(() => buildMetrics(rawReviews, t), [rawReviews, t]);
  const chartData = useMemo(() => buildChartData(rawReviews), [rawReviews]);
  const alerts = useMemo(() => buildAlerts(rawReviews, t), [rawReviews, t]);
  const pendingReviews = useMemo(
    () => rawPending.map((r) => mapDbReviewToCard(r, locale)),
    [rawPending, locale]
  );

  const loadData = useCallback(async (businessId: string) => {
    setDataLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const [allResult, pendingResult] = await Promise.all([
        supabase
          .from("reviews")
          .select(
            "id, rating, status, created_at, review_date, language, text, customer_name, source, responses(text, edited_text, status, model_used, approved_at)"
          )
          .eq("business_id", businessId)
          .order("created_at", { ascending: false }),
        supabase
          .from("reviews")
          .select("*, responses(*)")
          .eq("business_id", businessId)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);
      if (allResult.error) throw allResult.error;
      if (pendingResult.error) throw pendingResult.error;
      setRawReviews((allResult.data ?? []) as DbReview[]);
      setRawPending((pendingResult.data ?? []) as DbReview[]);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err instanceof Error ? err.message : t("app.dashboard.unknownError"));
    } finally {
      setDataLoading(false);
    }
  }, []); // no t/locale dep — only fetches raw data

  useEffect(() => {
    if (!authLoading && business?.id) {
      loadData(business.id);
    } else if (!authLoading && !business) {
      setDataLoading(false);
    }
  }, [authLoading, business?.id, loadData]);

  const isLoading = authLoading || dataLoading;

  const displayAlerts: SmartAlert[] =
    alerts.length > 0
      ? alerts
      : [
          {
            id: "all-good",
            type: "info",
            message: `${t("app.dashboard.allGood")} — ${t("app.dashboard.allGoodDesc")}`,
          },
        ];

  return (
    <div className="max-w-[1200px] mx-auto">
      <div className="mb-6">
        <h1 className="display-serif text-[26px] font-semibold text-forest">
          {t("app.dashboard.title")}
        </h1>
        <p className="text-muted text-sm mt-1">{t("app.dashboard.subtitle")}</p>
      </div>

      {error && !isLoading && (
        <div className="mb-5 flex items-center justify-between gap-4 bg-terra/5 border border-terra/25 rounded-2xl px-5 py-4">
          <p className="text-sm text-terra">{t("app.dashboard.loadError")}</p>
          <button
            onClick={() => business?.id && loadData(business.id)}
            className="flex items-center gap-1.5 text-xs font-medium text-terra border border-terra/40 rounded-lg px-3 py-1.5 hover:bg-terra hover:text-paper transition-all shrink-0"
          >
            <RefreshCw size={13} />
            {t("app.dashboard.retryLoad")}
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {isLoading ? (
          <>
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
            <KPISkeleton />
          </>
        ) : (
          <>
            <KPICard
              label={t("app.dashboard.kpi_rating")}
              metric={metrics.avgRating}
              changeContextOverride={t("app.dashboard.this_month")}
            />
            <KPICard
              label={t("app.dashboard.kpi_reviews")}
              metric={metrics.totalReviews}
              changeContextOverride={t("app.dashboard.this_month")}
            />
            <KPICard
              label={t("app.dashboard.kpi_pending")}
              metric={metrics.pendingCount}
              highlight
            />
            <KPICard
              label={t("app.dashboard.kpi_response_time")}
              metric={metrics.avgResponseTime}
            />
          </>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <div className="lg:col-span-2 space-y-4">
              <PendingSkeleton />
              <ChartSkeleton />
            </div>
            <AlertsSkeleton />
          </>
        ) : !hasAnyReviews ? (
          <EmptyStateCard t={t} />
        ) : (
          <>
            <div className="lg:col-span-2 space-y-4">
              <PendingReviews reviews={pendingReviews} />
              <RatingChart data={chartData} />
            </div>
            <SmartAlerts alerts={displayAlerts} />
          </>
        )}
      </div>
    </div>
  );
}
