"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { Metric } from "@/lib/mock/dashboardData";

interface KPICardProps {
  label: string;
  metric: Metric;
  changeContextOverride?: string;
  highlight?: boolean;
}

export function KPICard({ label, metric, changeContextOverride, highlight }: KPICardProps) {
  const { value, change, trend, changeContext } = metric;
  const context = changeContextOverride ?? changeContext;

  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-3 border ${
        highlight
          ? "bg-terra/5 border-terra/25"
          : "bg-paper border-line"
      }`}
    >
      <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
        {label}
      </div>

      <div
        className={`font-serif text-[38px] font-semibold leading-none tracking-tight ${
          highlight ? "text-terra" : "text-forest"
        }`}
      >
        {value}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {trend === "positive" && (
          <TrendingUp size={13} className="text-forest shrink-0" />
        )}
        {trend === "negative" && (
          <TrendingDown size={13} className="text-terra shrink-0" />
        )}
        <span
          className={`text-xs font-medium ${
            trend === "positive"
              ? "text-forest"
              : trend === "negative"
              ? "text-terra"
              : "text-muted"
          }`}
        >
          {change}
        </span>
        {context && <span className="text-xs text-muted">{context}</span>}
      </div>
    </div>
  );
}
