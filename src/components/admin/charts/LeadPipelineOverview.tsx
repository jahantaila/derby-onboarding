"use client";

import { useState, useEffect } from "react";

interface PipelineData {
  stage_counts: Record<string, number>;
  conversion_rates: { from: string; to: string; rate: number }[];
  total: number;
  this_week: number;
  this_month: number;
  month_trend: number;
  client_options: { id: string; name: string }[];
}

const STAGE_CONFIG: { key: string; label: string; color: string; bg: string }[] = [
  { key: "new", label: "New", color: "bg-blue-500", bg: "bg-blue-50" },
  { key: "contacted", label: "Contacted", color: "bg-cyan-500", bg: "bg-cyan-50" },
  { key: "qualified", label: "Qualified", color: "bg-yellow-500", bg: "bg-yellow-50" },
  { key: "converted", label: "Converted", color: "bg-green-500", bg: "bg-green-50" },
  { key: "lost", label: "Lost", color: "bg-gray-400", bg: "bg-gray-50" },
];

const DATE_OPTIONS = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "all", label: "All time" },
];

export function LeadPipelineOverview() {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [clientId, setClientId] = useState("all");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ dateRange });
    if (clientId !== "all") params.set("clientId", clientId);
    fetch(`/api/admin/dashboard/lead-pipeline?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [dateRange, clientId]);

  const maxStageCount = data
    ? Math.max(...STAGE_CONFIG.map((s) => data.stage_counts[s.key] || 0), 1)
    : 1;

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap gap-2">
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none"
        >
          {DATE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none"
        >
          <option value="all">All Clients</option>
          {data?.client_options.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Weekly / monthly totals */}
      {!loading && data && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">Total</p>
            <p className="text-xl font-bold text-gray-900">{data.total}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">This Week</p>
            <p className="text-xl font-bold text-gray-900">{data.this_week}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500 mb-0.5">This Month</p>
            <p className="text-xl font-bold text-gray-900">{data.this_month}</p>
            {data.month_trend !== 0 && (
              <p className={`text-xs font-medium ${data.month_trend > 0 ? "text-green-600" : "text-red-500"}`}>
                {data.month_trend > 0 ? "+" : ""}{data.month_trend}% vs last
              </p>
            )}
          </div>
        </div>
      )}

      {/* Funnel visualization */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      ) : !data || data.total === 0 ? (
        <p className="text-sm text-gray-400 text-center py-6">No leads yet.</p>
      ) : (
        <div className="space-y-1.5">
          {STAGE_CONFIG.map((stage, idx) => {
            const count = data.stage_counts[stage.key] || 0;
            const widthPct = count === 0 ? 4 : Math.max(10, (count / maxStageCount) * 100);
            const convRate = idx < data.conversion_rates.length ? data.conversion_rates[idx] : null;

            return (
              <div key={stage.key}>
                <div className={`relative rounded-lg overflow-hidden h-10 ${stage.bg}`}>
                  <div
                    className={`h-full ${stage.color} opacity-80 transition-all duration-700 ease-out`}
                    style={{ width: `${widthPct}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-xs font-semibold text-gray-700">{stage.label}</span>
                    <span className="text-sm font-bold text-gray-800">{count}</span>
                  </div>
                </div>
                {convRate && (
                  <div className="flex items-center gap-1 pl-3 py-0.5">
                    <div className="w-px h-3 bg-gray-200" />
                    <span className="text-xs text-gray-400">
                      {convRate.rate}% → {convRate.to}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
