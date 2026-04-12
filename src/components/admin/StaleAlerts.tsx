"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "./useToast";

interface StaleSub {
  id: string;
  business_name: string | null;
  created_at: string;
}

export function StaleAlerts() {
  const [stale, setStale] = useState<StaleSub[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetch("/api/admin/submissions?status=new&page_size=100")
      .then((r) => r.json())
      .then((data) => {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const staleItems = (data.submissions || []).filter(
          (s: StaleSub) => new Date(s.created_at).getTime() < sevenDaysAgo
        );
        setStale(staleItems);
      })
      .catch(() => {});
  }, []);

  async function markInProgress(id: string) {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_status: "in_progress" }),
      });
      if (res.ok) {
        setStale((prev) => prev.filter((s) => s.id !== id));
        showToast("Moved to In Progress", "success");
      }
    } catch {
      showToast("Failed to update", "error");
    }
  }

  if (stale.length === 0) return null;

  function daysAgo(dateStr: string) {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h3 className="text-sm font-semibold text-amber-800">
          {stale.length} submission{stale.length > 1 ? "s" : ""} waiting &gt;7 days
        </h3>
      </div>
      <div className="space-y-2">
        {stale.slice(0, 5).map((sub) => (
          <div key={sub.id} className="flex items-center justify-between">
            <Link
              href={`/admin/submissions/${sub.id}`}
              className="text-sm text-amber-900 hover:underline truncate flex-1 mr-3"
            >
              {sub.business_name || "Untitled"} — {daysAgo(sub.created_at)} days
            </Link>
            <button
              onClick={() => markInProgress(sub.id)}
              className="text-xs px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg transition-colors whitespace-nowrap"
            >
              Move to In Progress
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
