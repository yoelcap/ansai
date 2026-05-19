"use client";

import { useTranslation } from "@/lib/i18n";
import type { ChartDataPoint } from "@/lib/mock/dashboardData";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const MIN_DATA_POINTS = 5;

export function RatingChart({ data }: { data: ChartDataPoint[] }) {
  const { t } = useTranslation();

  // Ensure ratings are valid numbers before computing domain
  const validData = data.filter((d) => typeof d.rating === "number" && isFinite(d.rating));

  if (validData.length < MIN_DATA_POINTS) {
    return (
      <div className="bg-paper border border-line rounded-2xl p-5">
        <div className="mb-4">
          <h2 className="font-serif font-semibold text-ink text-base">
            {t("app.dashboard.chart_title")}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            {t("app.dashboard.chart_subtitle")}
          </p>
        </div>
        <div className="h-[180px] flex flex-col items-center justify-center gap-2 bg-cream rounded-xl border border-line">
          <p className="text-sm font-medium text-ink-soft">
            {t("app.dashboard.chartNotEnoughData")}
          </p>
          <p className="text-xs text-muted text-center px-6">
            {t("app.dashboard.chartNotEnoughDataDesc")}
          </p>
        </div>
      </div>
    );
  }

  const minRating = Math.min(...validData.map((d) => d.rating));
  const yMin = Math.max(1, Math.floor(minRating * 2) / 2 - 0.5);

  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <div className="mb-4">
        <h2 className="font-serif font-semibold text-ink text-base">
          {t("app.dashboard.chart_title")}
        </h2>
        <p className="text-xs text-muted mt-0.5">
          {t("app.dashboard.chart_subtitle")}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart
          data={validData}
          margin={{ top: 4, right: 8, left: -24, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#d8d2c4"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6b6660" }}
            tickLine={false}
            axisLine={false}
            interval={4}
          />
          <YAxis
            domain={[yMin, 5]}
            tick={{ fontSize: 10, fill: "#6b6660" }}
            tickLine={false}
            axisLine={false}
            tickCount={4}
          />
          <Tooltip
            contentStyle={{
              background: "#fdfbf6",
              border: "1px solid #d8d2c4",
              borderRadius: "12px",
              fontSize: 12,
              color: "#1a1a1a",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
            }}
            formatter={(value) => [Number(value).toFixed(1), "Rating"]}
            labelStyle={{ color: "#6b6660", marginBottom: 2 }}
          />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#1f3a2e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: "#1f3a2e", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
