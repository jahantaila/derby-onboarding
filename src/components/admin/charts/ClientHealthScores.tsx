"use client";

import { useState, useEffect, ReactNode } from "react";
import Link from "next/link";

interface ClientHealthScore {
  client_id: string;
  business_name: string;
  score: number;
  tier: "healthy" | "attention" | "at_risk";
  factors: {
    sla_compliance: number;
    has_active_campaign: boolean;
    lead_conversion_rate: number;
    days_since_activity: number | null;
  };
}

interface HealthData {
  clients: ClientHealthScore[];
}

const TIER_CONFIG = {
  healthy: {
    label: "Healthy",
    dot: "bg-green-500",
    bar: "bg-green-500",
    badge: "bg-green-50 text-green-700 border-green-200",
    row: "hover:bg-green-50/50",
  },
  attention: {
    label: "Attention",
    dot: "bg-yellow-400",
    bar: "bg-yellow-400",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
    row: "hover:bg-yellow-50/50",
  },
  at_risk: {
    label: "At Risk",
    dot: "bg-red-500",
    bar: "bg-red-400",
    badge: "bg-red-50 text-red-700 border-red-200",
    row: "hover:bg-red-50/50",
  },
};

function ScoreBar({ score, tier }: { score: number; tier: ClientHealthScore["tier"] }) {
  const cfg = TIER_CONFIG[tier];
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${cfg.bar} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-bold text-gray-700 w-7 text-right">{score}</span>
    </div>
  );
}

function FactorRow({ label, value }: { label: string; value: string | ReactNode }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  );
}

export function ClientHealthScores() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/dashboard/health-scores")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const tiers = data
    ? {
        healthy: data.clients.filter((c) => c.tier === "healthy").length,
        attention: data.clients.filter((c) => c.tier === "attention").length,
        at_risk: data.clients.filter((c) => c.tier === "at_risk").length,
      }
    : null;

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.clients.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-8">
        No active clients to score yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tier summary */}
      {tiers && (
        <div className="grid grid-cols-3 gap-2">
          {(["healthy", "attention", "at_risk"] as const).map((tier) => {
            const cfg = TIER_CONFIG[tier];
            return (
              <div key={tier} className={`rounded-lg border px-3 py-2 text-center ${cfg.badge}`}>
                <p className="text-lg font-bold">{tiers[tier]}</p>
                <p className="text-xs">{cfg.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-3 text-xs text-gray-400">
        {(["healthy", "attention", "at_risk"] as const).map((tier) => (
          <span key={tier} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${TIER_CONFIG[tier].dot} inline-block`} />
            {TIER_CONFIG[tier].label}
          </span>
        ))}
      </div>

      {/* Client list */}
      <div className="space-y-1.5">
        {data.clients.map((client) => {
          const cfg = TIER_CONFIG[client.tier];
          const isOpen = expanded === client.client_id;
          return (
            <div key={client.client_id} className="rounded-lg border border-gray-100 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : client.client_id)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${cfg.row}`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{client.business_name}</p>
                </div>
                <div className="w-32 flex-shrink-0">
                  <ScoreBar score={client.score} tier={client.tier} />
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isOpen && (
                <div className="px-4 pb-3 pt-1 border-t border-gray-100 bg-gray-50/50 space-y-1.5">
                  <FactorRow
                    label="SLA Compliance"
                    value={`${client.factors.sla_compliance}%`}
                  />
                  <FactorRow
                    label="Active Campaign"
                    value={
                      client.factors.has_active_campaign ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-500">No</span>
                      )
                    }
                  />
                  <FactorRow
                    label="Lead Conversion"
                    value={`${client.factors.lead_conversion_rate}%`}
                  />
                  <FactorRow
                    label="Last Activity"
                    value={
                      client.factors.days_since_activity !== null
                        ? `${client.factors.days_since_activity}d ago`
                        : "No data"
                    }
                  />
                  <div className="pt-1">
                    <Link
                      href={`/admin/submissions/${client.client_id}`}
                      className="text-xs text-derby-blue hover:underline"
                    >
                      View client profile →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
