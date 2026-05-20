"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { LanguageBucket } from "@/lib/mock/insightsData";

const TOOLTIP_STYLE = {
  background: "#fdfbf6",
  border: "1px solid #d8d2c4",
  borderRadius: "12px",
  fontSize: 12,
  color: "#1a1a1a",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

interface Props {
  data: LanguageBucket[];
  title: string;
  emptyMessage?: string;
  minReviews?: number;
}

export function LanguageDonut({ data, title, emptyMessage, minReviews = 5 }: Props) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const hasEnough = total >= minReviews;

  return (
    <div className="bg-paper border border-line rounded-2xl p-5">
      <h2 className="font-serif font-semibold text-ink text-base mb-4">{title}</h2>

      {hasEnough ? (
        <div className="flex items-center gap-4">
          {/* Donut */}
          <div className="shrink-0 w-[160px] h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  dataKey="count"
                  paddingAngle={3}
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value, name) => [
                    `${value} (${Math.round((Number(value) / total) * 100)}%)`,
                    name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <ul className="flex-1 space-y-2.5">
            {data.map((entry) => (
              <li key={entry.code} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ background: entry.color }}
                />
                <span className="text-sm text-ink font-medium w-8">{entry.code}</span>
                <div className="flex-1 h-1.5 bg-cream-dark rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((entry.count / total) * 100)}%`,
                      background: entry.color,
                    }}
                  />
                </div>
                <span className="text-xs text-muted w-8 text-right">
                  {Math.round((entry.count / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[160px]">
          <p className="text-sm text-muted text-center max-w-[220px]">
            {emptyMessage ?? "No hay suficientes datos para mostrar el gráfico"}
          </p>
        </div>
      )}
    </div>
  );
}
