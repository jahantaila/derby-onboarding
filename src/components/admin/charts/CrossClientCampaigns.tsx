"use client";

import { useState, useEffect } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface AnalyticsData {
  summary: {
    total_active_campaigns: number;
    total_spend_cents: number;
    total_impressions: number;
    total_clicks: number;
    total_conversions: number;
  };
  time_series: { date: string; spend_cents: number; conversions: number }[];
  roas_table: {
    campaign_id: string;
    campaign_name: string;
    client_id: string;
    client_name: string;
    platform: string;
    status: string;
    spend_cents: number;
    conversions: number;
    impressions: number;
    clicks: number;
    roas: number;
  }[];
  days: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  google: "#4285F4",
  meta: "#1877F2",
  yelp: "#D32323",
  nextdoor: "#00B246",
  other: "#9CA3AF",
};

function fmt$(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtNum(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const DAYS_OPTIONS = [30, 60, 90] as const;

export function CrossClientCampaigns() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [days, setDays] = useState<30 | 60 | 90>(30);
  const [loading, setLoading] = useState(true);
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/dashboard/analytics?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [days]);

  const summaryCards = data
    ? [
        { label: "Active Campaigns", value: String(data.summary.total_active_campaigns), gradient: "from-derby-blue to-derby-blue-deep" },
        { label: "Total Spend", value: fmt$(data.summary.total_spend_cents), gradient: "from-purple-500 to-indigo-600" },
        { label: "Impressions", value: fmtNum(data.summary.total_impressions), gradient: "from-cyan-500 to-blue-500" },
        { label: "Clicks", value: fmtNum(data.summary.total_clicks), gradient: "from-orange-400 to-amber-500" },
        { label: "Conversions", value: fmtNum(data.summary.total_conversions), gradient: "from-green-500 to-emerald-600" },
      ]
    : [];

  // Build chart data: group by week if days > 30 for readability
  const chartData =
    data?.time_series.map((d) => ({
      date: d.date.slice(5), // "MM-DD"
      spend: parseFloat((d.spend_cents / 100).toFixed(2)),
      conversions: d.conversions,
    })) || [];

  // Unique clients and platforms for filters
  const clients = data
    ? Array.from(new Set(data.roas_table.map((r) => r.client_id))).map((id) => ({
        id,
        name: data.roas_table.find((r) => r.client_id === id)?.client_name || id,
      }))
    : [];
  const platforms = data
    ? Array.from(new Set(data.roas_table.map((r) => r.platform)))
    : [];

  const filteredTable = data?.roas_table.filter((r) => {
    if (clientFilter !== "all" && r.client_id !== clientFilter) return false;
    if (platformFilter !== "all" && r.platform !== platformFilter) return false;
    return true;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="relative overflow-hidden bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100 animate-pulse" />
                <div className="w-16 h-3 bg-gray-100 rounded animate-pulse mb-2" />
                <div className="w-12 h-7 bg-gray-100 rounded animate-pulse" />
              </div>
            ))
          : summaryCards.map((card) => (
              <div key={card.label} className="relative overflow-hidden bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            ))}
      </div>

      {/* Spend vs Conversions Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Spend vs Conversions</h3>
            <p className="text-sm text-gray-500">Daily aggregates across all campaigns</p>
          </div>
          <div className="flex gap-1 rounded-lg border border-gray-200 overflow-hidden text-xs">
            {DAYS_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 font-medium transition-colors ${
                  days === d
                    ? "bg-derby-blue text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-56 bg-gray-50 rounded-lg animate-pulse" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-12">No campaign metrics yet.</p>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e5e7eb", fontSize: "12px" }}
                  formatter={(value, name) =>
                    name === "spend" ? [`$${Number(value).toLocaleString()}`, "Spend"] : [value, "Conversions"]
                  }
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar yAxisId="left" dataKey="spend" fill="#2093FF" fillOpacity={0.7} name="Spend ($)" radius={[2, 2, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="conversions"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  name="Conversions"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ROAS Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 pb-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Campaign ROAS</h3>
            <p className="text-sm text-gray-500">Conversions per dollar spent, ranked</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none"
            >
              <option value="all">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 focus:outline-none"
            >
              <option value="all">All Platforms</option>
              {platforms.map((p) => (
                <option key={p} value={p} className="capitalize">{p}</option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="p-6 pt-0 space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredTable.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No campaign data for this period.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Campaign</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Platform</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Spend</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Conv.</th>
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTable.map((row) => (
                  <tr key={row.campaign_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-800 truncate max-w-[180px]">{row.campaign_name}</td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-[140px]">{row.client_name}</td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white capitalize"
                        style={{ backgroundColor: PLATFORM_COLORS[row.platform] || "#9CA3AF" }}
                      >
                        {row.platform}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmt$(row.spend_cents)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{row.conversions}</td>
                    <td className="px-6 py-3 text-right font-semibold">
                      <span
                        className={
                          row.roas >= 0.5
                            ? "text-green-600"
                            : row.roas > 0
                            ? "text-yellow-600"
                            : "text-gray-400"
                        }
                      >
                        {row.roas > 0 ? row.roas.toFixed(3) : "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
