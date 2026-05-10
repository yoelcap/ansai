"use client";

import { useState } from "react";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import {
  getMockInsightsData,
  getRatingDomain,
  type Period,
  type Topic,
  type CriticalIssue,
} from "@/lib/mock/insightsData";
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

// ─── Topics section ───────────────────────────────────────────────────────────
function TopicsSection({ topics, t }: { topics: Topic[]; t: (k: string) => string }) {
  const maxCount = Math.max(...topics.map((t) => t.count));

  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <h2 className="font-serif font-semibold text-ink text-base mb-5">
        {t("app.insights.topics_title")}
      </h2>
      <ul className="space-y-3.5">
        {topics.map((topic) => (
          <li key={topic.name} className="flex items-center gap-3">
            {/* Topic name */}
            <span className="w-36 text-sm text-ink shrink-0 truncate">{topic.name}</span>

            {/* Positive / negative bar */}
            <div className="flex-1 h-2 bg-cream-dark rounded-full overflow-hidden flex">
              <div
                className="h-full bg-forest transition-all"
                style={{ width: `${(topic.count / maxCount) * topic.positivePercent}%` }}
              />
              <div
                className="h-full bg-terra transition-all"
                style={{
                  width: `${(topic.count / maxCount) * (100 - topic.positivePercent)}%`,
                }}
              />
            </div>

            {/* Count + breakdown */}
            <div className="flex items-center gap-2 shrink-0 text-xs">
              <span className="text-ink font-medium w-5 text-right">{topic.count}</span>
              <span className="text-muted hidden sm:inline">
                {t("app.insights.topics_count")}
              </span>
              <span className="text-forest w-10 hidden md:inline">
                {topic.positivePercent}% {t("app.insights.topics_pos")}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {/* Legend */}
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
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<Period>("30d");

  const data = getMockInsightsData(period);
  const domain = getRatingDomain(period);
  const contextLabel = t(periodContextKey[period]);

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

        {/* Period selector */}
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
          metric={data.kpis.avgRating}
          changeContextOverride={contextLabel}
        />
        <KPICard
          label={t("app.insights.kpi_reviews")}
          metric={data.kpis.reviewsReceived}
          changeContextOverride={contextLabel}
        />
        <KPICard
          label={t("app.insights.kpi_response_rate")}
          metric={data.kpis.responseRate}
          changeContextOverride={contextLabel}
        />
        <KPICard
          label={t("app.insights.kpi_response_time")}
          metric={data.kpis.avgResponseTime}
          changeContextOverride={contextLabel}
        />
      </div>

      {/* Rating evolution */}
      <RatingEvolutionChart
        data={data.ratingEvolution}
        domain={domain}
        title={t("app.insights.chart_rating_title")}
      />

      {/* Stars + Language */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StarsChart
          data={data.starDistribution}
          title={t("app.insights.chart_stars_title")}
          countLabel={t("app.insights.chart_stars_reviews")}
        />
        <LanguageDonut
          data={data.languageShare}
          title={t("app.insights.chart_lang_title")}
        />
      </div>

      {/* Topics */}
      <TopicsSection topics={data.topics} t={t} />

      {/* Critical issues */}
      <CriticalSection issues={data.criticalIssues} t={t} />
    </div>
  );
}
