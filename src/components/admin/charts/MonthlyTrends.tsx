"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface TrendData {
  month: string;
  count: number;
}

export function MonthlyTrends({ data }: { data: TrendData[] }) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No trend data yet</p>;
  }

  return (
    <div className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={{ stroke: "#e5e7eb" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#9ca3af" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#2093FF"
            strokeWidth={2.5}
            dot={{ r: 4, fill: "#2093FF" }}
            activeDot={{ r: 6 }}
            name="Submissions"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
