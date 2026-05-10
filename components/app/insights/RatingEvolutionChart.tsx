"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RatingPoint } from "@/lib/mock/insightsData";

const TOOLTIP_STYLE = {
  background: "#fdfbf6",
  border: "1px solid #d8d2c4",
  borderRadius: "12px",
  fontSize: 12,
  color: "#1a1a1a",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

interface Props {
  data: RatingPoint[];
  domain: [number, number];
  title: string;
}

export function RatingEvolutionChart({ data, domain, title }: Props) {
  const interval = data.length <= 7 ? 0 : data.length <= 30 ? 4 : 1;

  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <h2 className="font-serif font-semibold text-ink text-base mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#d8d2c4" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#6b6660" }}
            tickLine={false}
            axisLine={false}
            interval={interval}
          />
          <YAxis
            domain={domain}
            tick={{ fontSize: 10, fill: "#6b6660" }}
            tickLine={false}
            axisLine={false}
            tickCount={4}
            tickFormatter={(v) => Number(v).toFixed(1)}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
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
