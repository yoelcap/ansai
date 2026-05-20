"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, AlertCircle, Info, RefreshCw } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useInsightsData } from "@/lib/hooks/useInsightsData";
import type { Period, Topic, CriticalIssue } from "@/lib/mock/insightsData";
import { KPICard } from "@/components/app/dashboard/KPICard";
import { RatingEvolutionChart } from "@/components/app/insights/RatingEvolutionChart";
import { StarsChart } from "@/components/app/insights/StarsChart";
import { LanguageDonut } from "@/components/app/insights/LanguageDonut";
import { cn } from "@/lib/utils";

// ─── Period selector ──────────────────────────────────────────────────────────
const PERIODS: Period[] = ["7d", "30d", "90d", "year"];

const periodContextKey: Record<Period, string> = {
  "7d": "app.insights.vs_prev_week",
  "30d": "app.insights.vs_prev_month",
  "90d": "app.insights.vs_prev_quarter",
  year: "app.insights.vs_prev_year",
};

// ─── Rating domain ─────────────────────────────────────────────────────────────
function computeDomain(ratings: number[]): [number, number] {
  if (!ratings.length) return [3.8, 5];
  const min = Math.min(...ratings);
  return [Math.max(1, Math.floor((min - 0.4) * 10) / 10), 5];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn("animate-pulse bg-line rounded-xl", className)} style={style} />;
}

function KPISkeleton() {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5 flex flex-col gap-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <Skeleton className="h-5 w-40 mb-4" />
      <Skeleton style={{ height }} />
    </div>
  );
}

// ─── Topics section ───────────────────────────────────────────────────────────
function TopicsSection({ topics, t }: { topics: Topic[]; t: (k: string) => string }) {
  if (!topics.length) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-5">
        <h2 className="font-serif font-semibold text-ink text-base mb-4">
          {t("app.insights.topics_title")}
        </h2>
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted">{t("app.insights.empty_topics")}</p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...topics.map((tp) => tp.count));

  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <h2 className="font-serif font-semibold text-ink text-base mb-5">
        {t("app.insights.topics_title")}
      </h2>
      <ul className="space-y-3.5">
        {topics.map((topic) => (
          <li key={topic.name} className="flex items-center gap-3">
            <span className="w-36 text-sm text-ink shrink-0 truncate">{topic.name}</span>
            <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden flex">
              <div
                className="h-full bg-forest transition-all"
                style={{ width: `${(topic.count / maxCount) * topic.positivePercent}%` }}
              />
              <div
                className="h-full bg-terra transition-all"
                style={{ width: `${(topic.count / maxCount) * (100 - topic.positivePercent)}%` }}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="text-ink font-medium w-5 text-right">{topic.count}</span>
              <span className="text-muted hidden sm:inline">{t("app.insights.topics_count")}</span>
              <span className="text-forest w-10 hidden md:inline">
                {topic.positivePercent}% {t("app.insights.topics_pos")}
              </span>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-line">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-forest" />
          <span className="text-xs text-muted">{t("app.insights.topics_pos")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-terra" />
          <span className="text-xs text-muted">{t("app.insights.topics_neg")}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Critical issues section ──────────────────────────────────────────────────
const severityConfig = {
  high: {
    icon: AlertTriangle,
    class: "text-terra bg-terra/10",
    labelKey: "app.insights.severity_high",
  },
  medium: {
    icon: AlertCircle,
    class: "text-gold bg-gold/10",
    labelKey: "app.insights.severity_medium",
  },
  low: {
    icon: Info,
    class: "text-muted bg-muted/10",
    labelKey: "app.insights.severity_low",
  },
} as const;

function SeverityBadge({
  severity,
  t,
}: {
  severity: CriticalIssue["severity"];
  t: (k: string) => string;
}) {
  const cfg = severityConfig[severity];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium",
        cfg.class
      )}
    >
      <Icon size={10} />
      {t(cfg.labelKey)}
    </span>
  );
}

function CriticalSection({
  issues,
  t,
}: {
  issues: CriticalIssue[];
  t: (k: string) => string;
}) {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <h2 className="font-serif font-semibold text-ink text-base mb-4">
        {t("app.insights.critical_title")}
      </h2>
      {issues.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <p className="text-sm text-muted">{t("app.insights.empty_critical")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {issues.map((issue) => (
            <li key={issue.id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold text-ink">{issue.topic}</span>
                    <SeverityBadge severity={issue.severity} t={t} />
                  </div>
                  <p className="text-xs text-muted leading-relaxed italic">{issue.example}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-semibold text-terra">{issue.mentions}</span>
                  <p className="text-[11px] text-muted">{t("app.insights.critical_mentions")}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("30d");
  const { data, loading, error, totalReviews, retry } = useInsightsData(period);
  const contextLabel = t(periodContextKey[period]);

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-[1100px] mx-auto space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <div>
            <h1 className="display-serif text-[26px] font-semibold text-forest">
              {t("app.insights.title")}
            </h1>
            <p className="text-muted text-sm mt-1">{t("app.insights.subtitle")}</p>
          </div>
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <KPISkeleton key={i} />)}
        </div>
        <ChartSkeleton height={200} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ChartSkeleton height={180} />
          <ChartSkeleton height={180} />
        </div>
        <ChartSkeleton height={120} />
        <ChartSkeleton height={120} />
      </div>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-[1100px] mx-auto space-y-4">
        <div>
          <h1 className="display-serif text-[26px] font-semibold text-forest">
            {t("app.insights.title")}
          </h1>
          <p className="text-muted text-sm mt-1">{t("app.insights.subtitle")}</p>
        </div>
        <div className="bg-paper border border-line rounded-2xl p-8 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-muted">{t("app.insights.error_load")}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-forest text-paper text-sm font-medium hover:bg-forest-dark transition-colors"
          >
            <RefreshCw size={14} />
            {t("app.insights.retry")}
          </button>
        </div>
      </div>
    );
  }

  // ─── Global empty state ────────────────────────────────────────────────────
  if (totalReviews === 0) {
    return (
      <div className="max-w-[1100px] mx-auto space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <div>
            <h1 className="display-serif text-[26px] font-semibold text-forest">
              {t("app.insights.title")}
            </h1>
            <p className="text-muted text-sm mt-1">{t("app.insights.subtitle")}</p>
          </div>
          <div className="flex items-center gap-1 bg-paper border border-line rounded-xl p-1 flex-wrap">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                  period === p
                    ? "bg-forest text-paper"
                    : "text-muted hover:text-ink hover:bg-cream"
                )}
              >
                {t(`app.insights.period_${p}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-paper border border-line rounded-2xl p-12 flex flex-col items-center gap-4 text-center">
          <p className="text-base text-ink font-medium">{t("app.insights.empty_no_reviews")}</p>
          <button
            onClick={() => router.push("/reviews")}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            {t("app.insights.go_reviews")}
          </button>
        </div>
      </div>
    );
  }

  // ─── Normal state ──────────────────────────────────────────────────────────
  const ratingValues = data!.ratingEvolution.map((p) => p.rating);
  const domain = computeDomain(ratingValues);

  return (
    <div className="max-w-[1100px] mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
        <div>
          <h1 className="display-serif text-[26px] font-semibold text-forest">
            {t("app.insights.title")}
          </h1>
          <p className="text-muted text-sm mt-1">{t("app.insights.subtitle")}</p>
        </div>
        <div className="flex items-center gap-1 bg-paper border border-line rounded-xl p-1 flex-wrap">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                period === p
                  ? "bg-forest text-paper"
                  : "text-muted hover:text-ink hover:bg-cream"
              )}
            >
              {t(`app.insights.period_${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard
          label={t("app.insights.kpi_rating")}
          metric={data!.kpis.avgRating}
          changeContextOverride={contextLabel}
        />
        <KPICard
          label={t("app.insights.kpi_reviews")}
          metric={data!.kpis.reviewsReceived}
          changeContextOverride={contextLabel}
        />
        <KPICard
          label={t("app.insights.kpi_response_rate")}
          metric={data!.kpis.responseRate}
          changeContextOverride={contextLabel}
        />
        <KPICard
          label={t("app.insights.kpi_response_time")}
          metric={data!.kpis.avgResponseTime}
          changeContextOverride={contextLabel}
        />
      </div>

      {/* Rating evolution */}
      <RatingEvolutionChart
        data={data!.ratingEvolution}
        domain={domain}
        title={t("app.insights.chart_rating_title")}
        emptyMessage={t("app.insights.empty_rating_chart")}
        minPoints={3}
      />

      {/* Stars + Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StarsChart
          data={data!.starDistribution}
          title={t("app.insights.chart_stars_title")}
          countLabel={t("app.insights.chart_stars_reviews")}
          emptyMessage={t("app.insights.empty_stars_chart")}
          minReviews={5}
        />
        <LanguageDonut
          data={data!.languageShare}
          title={t("app.insights.chart_lang_title")}
          emptyMessage={t("app.insights.empty_lang_chart")}
          minReviews={5}
        />
      </div>

      {/* Topics */}
      <TopicsSection topics={data!.topics} t={t} />

      {/* Critical issues */}
      <CriticalSection issues={data!.criticalIssues} t={t} />
    </div>
  );
}
