"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { StarBucket } from "@/lib/mock/insightsData";

const TOOLTIP_STYLE = {
  background: "#fdfbf6",
  border: "1px solid #d8d2c4",
  borderRadius: "12px",
  fontSize: 12,
  color: "#1a1a1a",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

interface Props {
  data: StarBucket[];
  title: string;
  countLabel: string;
}

export function StarsChart({ data, title, countLabel }: Props) {
  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <h2 className="font-serif font-semibold text-ink text-base mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 24, left: 4, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fontSize: 11, fill: "#6b6660" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value) => [value, countLabel]}
            labelStyle={{ color: "#6b6660", marginBottom: 2 }}
            cursor={{ fill: "#f5f1ea" }}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
