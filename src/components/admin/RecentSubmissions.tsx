"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface RecentSub {
  id: string;
  business_name: string | null;
  pipeline_status: string;
  created_at: string;
}

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: "bg-blue-100", text: "text-blue-700", label: "New" },
  in_progress: { bg: "bg-yellow-100", text: "text-yellow-700", label: "In Progress" },
  active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RecentSubmissions() {
  const [subs, setSubs] = useState<RecentSub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/submissions?page=1&page_size=10")
      .then((r) => r.json())
      .then((data) => setSubs(data.submissions || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (subs.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">No submissions yet</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {subs.map((sub) => {
        const badge = STATUS_BADGE[sub.pipeline_status] || STATUS_BADGE.new;
        return (
          <Link
            key={sub.id}
            href={`/admin/submissions/${sub.id}`}
            className="flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {sub.business_name || "Untitled"}
              </p>
              <p className="text-xs text-gray-400">{timeAgo(sub.created_at)}</p>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text} flex-shrink-0`}>
              {badge.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
