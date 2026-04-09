"use client";

import { useEffect, useState, useRef } from "react";

interface Stats {
  total: number;
  new: number;
  in_progress: number;
  active: number;
  this_week: number;
  this_month: number;
  weekly_chart: { week: string; count: number }[];
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
      // Ease out cubic
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
            {/* Gradient accent bar */}
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
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
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
    </div>
  );
}
