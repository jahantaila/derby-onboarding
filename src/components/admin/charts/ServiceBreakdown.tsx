"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ServiceData {
  category: string;
  count: number;
}

const COLORS = [
  "#2093FF", "#0026FF", "#3B82F6", "#6366F1", "#8B5CF6",
  "#A855F7", "#D946EF", "#EC4899", "#F43F5E", "#EF4444",
  "#F97316", "#EAB308", "#22C55E",
];

function formatLabel(cat: string) {
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, " ");
}

export function ServiceBreakdown({ data }: { data: ServiceData[] }) {
  if (data.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-8">No service data yet</p>;
  }

  const chartData = data.map((d) => ({ name: formatLabel(d.category), value: d.count }));

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {data.slice(0, 8).map((d, i) => (
          <div key={d.category} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            {formatLabel(d.category)} ({d.count})
          </div>
        ))}
      </div>
    </div>
  );
}
