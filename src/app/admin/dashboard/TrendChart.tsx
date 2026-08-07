"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function TrendChart({
  data,
}: {
  data: { day: string; Assigned: number; Completed: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid vertical={false} stroke="#e1e0d9" strokeDasharray="3 3" />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 12, fill: "#898781" }}
          axisLine={{ stroke: "#c3c2b7" }}
          tickLine={false}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fontSize: 12, fill: "#898781" }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8, borderColor: "#e1e0d9" }} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, color: "#52514e" }} />
        <Bar dataKey="Assigned" fill="#2a78d6" radius={[4, 4, 0, 0]} maxBarSize={28} />
        <Bar dataKey="Completed" fill="#0ca30c" radius={[4, 4, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}
