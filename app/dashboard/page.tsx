"use client";

import { useTranslation } from "@/lib/i18n";
import { getMockDashboardData } from "@/lib/mock/dashboardData";
import { KPICard } from "@/components/app/dashboard/KPICard";
import { PendingReviews } from "@/components/app/dashboard/PendingReviews";
import { RatingChart } from "@/components/app/dashboard/RatingChart";
import { SmartAlerts } from "@/components/app/dashboard/SmartAlerts";

const data = getMockDashboardData();

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-[1200px] mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="display-serif text-[26px] font-semibold text-forest">
          {t("app.dashboard.title")}
        </h1>
        <p className="text-muted text-sm mt-1">{t("app.dashboard.subtitle")}</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <KPICard
          label={t("app.dashboard.kpi_rating")}
          metric={data.metrics.avgRating}
          changeContextOverride={t("app.dashboard.this_month")}
        />
        <KPICard
          label={t("app.dashboard.kpi_reviews")}
          metric={data.metrics.totalReviews}
          changeContextOverride={t("app.dashboard.this_week")}
        />
        <KPICard
          label={t("app.dashboard.kpi_pending")}
          metric={data.metrics.pendingCount}
          highlight
        />
        <KPICard
          label={t("app.dashboard.kpi_response_time")}
          metric={data.metrics.avgResponseTime}
        />
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Left: pending reviews + chart */}
        <div className="lg:col-span-2 space-y-4">
          <PendingReviews reviews={data.pendingReviews} />
          <RatingChart data={data.chartData} />
        </div>

        {/* Right: alerts */}
        <div>
          <SmartAlerts alerts={data.alerts} />
        </div>
      </div>
    </div>
  );
}
