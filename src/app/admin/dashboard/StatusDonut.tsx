"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { STATUS_CHART_COLORS, type StatusName } from "@/lib/status";

export function StatusDonut({ data }: { data: { name: StatusName; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
        No tasks for this date.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          strokeWidth={2}
          stroke="#fcfcfb"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={STATUS_CHART_COLORS[entry.name]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [`${value} task${value === 1 ? "" : "s"}`, name]}
          contentStyle={{ fontSize: 13, borderRadius: 8, borderColor: "#e1e0d9" }}
        />
        <Legend
          verticalAlign="middle"
          align="right"
          layout="vertical"
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 13, color: "#52514e" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
