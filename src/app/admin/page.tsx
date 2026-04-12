"use client";

import { useEffect, useState, useRef } from "react";
import { ConversionFunnel } from "@/components/admin/charts/ConversionFunnel";
import { ServiceBreakdown } from "@/components/admin/charts/ServiceBreakdown";
import { MonthlyTrends } from "@/components/admin/charts/MonthlyTrends";
import { TimeInStage } from "@/components/admin/charts/TimeInStage";
import { RecentSubmissions } from "@/components/admin/RecentSubmissions";
import { StaleAlerts } from "@/components/admin/StaleAlerts";
import Link from "next/link";

interface Stats {
  total: number;
  new: number;
  in_progress: number;
  active: number;
  this_week: number;
  this_month: number;
  weekly_chart: { week: string; count: number }[];
  funnel: {
    new: number;
    in_progress: number;
    active: number;
    new_to_ip_rate: number;
    ip_to_active_rate: number;
  };
  service_breakdown: { category: string; count: number }[];
  monthly_trends: { month: string; count: number }[];
  avg_time_in_stage: { status: string; avg_days: number }[];
}

interface SlaRow {
  client_id: string;
  business_name: string | null;
  total_leads: number;
  leads_with_response: number;
  avg_response_ms: number | null;
}

function SlaColor(ms: number | null): { dot: string; label: string } {
  if (ms == null) return { dot: "bg-gray-300", label: "text-gray-400" };
  const min = ms / 60000;
  if (min < 5) return { dot: "bg-green-500", label: "text-green-600" };
  if (min <= 30) return { dot: "bg-yellow-400", label: "text-yellow-600" };
  return { dot: "bg-red-500", label: "text-red-600" };
}

function LeadResponseSLA() {
  const [rows, setRows] = useState<SlaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/lead-response-sla")
      .then((r) => (r.ok ? r.json() : []))
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="h-32 bg-gray-50 rounded-xl animate-pulse" />;
  if (rows.length === 0) return <p className="text-sm text-gray-400 py-4 text-center">No lead data yet.</p>;

  return (
    <div className="space-y-2">
      {rows.map((r) => {
        const { dot, label } = SlaColor(r.avg_response_ms);
        const avgMin = r.avg_response_ms != null ? Math.round(r.avg_response_ms / 60000) : null;
        const responseRate = r.total_leads > 0 ? Math.round((r.leads_with_response / r.total_leads) * 100) : 0;
        return (
          <div key={r.client_id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dot}`} />
            <div className="flex-1 min-w-0">
              <Link href={`/admin/submissions/${r.client_id}`} className="text-sm font-medium text-gray-800 hover:text-derby-blue truncate block">
                {r.business_name || "Unnamed Client"}
              </Link>
              <p className="text-xs text-gray-400">{r.total_leads} leads · {responseRate}% responded</p>
            </div>
            <span className={`text-xs font-semibold flex-shrink-0 ${label}`}>
              {avgMin != null ? `${avgMin < 1 ? "<1" : avgMin} min` : "—"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function CountUp({ target, duration = 1200 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setValue(0);
      return;
    }
    const startTime = performance.now();
    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    }
    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [target, duration]);

  return <>{value}</>;
}

const STAT_CARDS = [
  { key: "total" as const, label: "Total Submissions", gradient: "from-derby-blue to-derby-blue-deep" },
  { key: "new" as const, label: "New", gradient: "from-blue-500 to-blue-600" },
  { key: "in_progress" as const, label: "In Progress", gradient: "from-yellow-500 to-orange-500" },
  { key: "active" as const, label: "Active", gradient: "from-green-500 to-emerald-600" },
  { key: "this_week" as const, label: "This Week", gradient: "from-cyan-500 to-blue-600" },
  { key: "this_month" as const, label: "This Month", gradient: "from-sky-500 to-derby-blue" },
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const maxChartValue = stats
    ? Math.max(...stats.weekly_chart.map((w) => w.count), 1)
    : 1;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Overview of your onboarding pipeline</p>

      {/* Stale Alerts */}
      <StaleAlerts />

      {error && !loading && (
        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 text-center">
          Unable to load dashboard data. Please try refreshing the page.
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="relative overflow-hidden bg-white rounded-xl p-5 border border-gray-200 shadow-sm"
          >
            <div
              className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}
            />
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">
              {card.label}
            </p>
            <p className="text-3xl font-bold text-gray-900">
              {loading ? (
                <span className="inline-block w-12 h-8 bg-gray-100 rounded animate-pulse" />
              ) : stats ? (
                <CountUp target={stats[card.key]} />
              ) : (
                "—"
              )}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Submissions Per Week</h2>
        <p className="text-sm text-gray-500 mb-6">Last 8 weeks</p>

        {loading ? (
          <div className="h-48 flex items-end gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-gray-100 rounded-t animate-pulse"
                  style={{ height: `${30 + Math.random() * 70}%` }}
                />
                <div className="w-8 h-3 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="h-48 flex items-end gap-3">
            {stats.weekly_chart.map((week, i) => {
              const heightPct =
                week.count === 0 ? 4 : (week.count / maxChartValue) * 100;
              return (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  {week.count > 0 && (
                    <span className="text-xs text-gray-500">{week.count}</span>
                  )}
                  <div
                    className="w-full bg-gradient-to-t from-derby-blue to-derby-blue-deep rounded-t transition-all duration-700 ease-out"
                    style={{
                      height: `${heightPct}%`,
                      animationDelay: `${i * 80}ms`,
                    }}
                  />
                  <span className="text-xs text-gray-400">{week.week}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">Failed to load chart data.</p>
        )}
      </div>

      {/* Analytics Grid */}
      {!loading && stats && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Conversion Funnel */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Pipeline Funnel</h2>
              <p className="text-sm text-gray-500 mb-4">Conversion through stages</p>
              <ConversionFunnel data={stats.funnel} />
            </div>

            {/* Service Breakdown */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Service Categories</h2>
              <p className="text-sm text-gray-500 mb-4">Most requested services</p>
              <ServiceBreakdown data={stats.service_breakdown} />
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Monthly Trends</h2>
            <p className="text-sm text-gray-500 mb-4">Submissions over the last 6 months</p>
            <MonthlyTrends data={stats.monthly_trends} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Time in Stage */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Avg. Time in Stage</h2>
              <p className="text-sm text-gray-500 mb-4">Average days since submission</p>
              <TimeInStage data={stats.avg_time_in_stage} />
            </div>

            {/* Recent Submissions */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Recent Submissions</h2>
              <p className="text-sm text-gray-500 mb-4">Latest client onboardings</p>
              <RecentSubmissions />
            </div>

            {/* Lead Response SLA */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Lead Response SLA</h2>
              <p className="text-sm text-gray-500 mb-1">Avg. response time by client</p>
              <div className="flex gap-3 text-xs text-gray-400 mb-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> &lt;5 min</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 5–30 min</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> &gt;30 min</span>
              </div>
              <LeadResponseSLA />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
