"use client";

import { useState, useEffect } from "react";

interface SpendData {
  clients: {
    client_id: string;
    client_name: string;
    this_month_cents: number;
    last_month_cents: number;
    budget_cents: number;
    mom_change: number;
    budget_utilization: number | null;
  }[];
  portfolio: {
    this_month_cents: number;
    last_month_cents: number;
    budget_cents: number;
    mom_change: number;
    budget_utilization: number | null;
  };
}

function fmt$(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function MoMBadge({ pct }: { pct: number }) {
  if (pct === 0) return <span className="text-xs text-gray-400">—</span>;
  const positive = pct > 0;
  return (
    <span className={`text-xs font-medium ${positive ? "text-green-600" : "text-red-500"}`}>
      {positive ? "+" : ""}{pct}%
    </span>
  );
}

function UtilBar({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-xs text-gray-400">—</span>;
  const color = pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-400" : "bg-green-500";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-600 w-8 text-right">{pct}%</span>
    </div>
  );
}

export function RevenueSpendTracking() {
  const [data, setData] = useState<SpendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/dashboard/spend")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-gray-50 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-sm text-gray-400 text-center py-8">Unable to load spend data.</p>;
  }

  const p = data.portfolio;

  return (
    <div className="space-y-5">
      {/* Portfolio summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
          <p className="text-xs text-gray-500 mb-1">This Month</p>
          <p className="text-xl font-bold text-gray-900">{fmt$(p.this_month_cents)}</p>
          <MoMBadge pct={p.mom_change} />
        </div>
        <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 mb-1">Last Month</p>
          <p className="text-xl font-bold text-gray-900">{fmt$(p.last_month_cents)}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 border border-orange-100">
          <p className="text-xs text-gray-500 mb-1">Total Budget</p>
          <p className="text-xl font-bold text-gray-900">{fmt$(p.budget_cents)}</p>
          {p.budget_utilization !== null && (
            <p className="text-xs text-gray-500 mt-0.5">{p.budget_utilization}% utilized</p>
          )}
        </div>
      </div>

      {/* Per-client table */}
      {data.clients.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No campaign spend data yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Client</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">This Month</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">MoM</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Budget</th>
                <th className="px-4 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide">Utilized</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.clients.map((c) => (
                <tr key={c.client_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 truncate max-w-[160px]">{c.client_name}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{fmt$(c.this_month_cents)}</td>
                  <td className="px-4 py-3 text-right"><MoMBadge pct={c.mom_change} /></td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{c.budget_cents > 0 ? fmt$(c.budget_cents) : "—"}</td>
                  <td className="px-4 py-3"><UtilBar pct={c.budget_utilization} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
