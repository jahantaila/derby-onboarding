"use client";

import { useEffect, useState } from "react";

interface ActivityEntry {
  id: string;
  action: string;
  details: Record<string, unknown>;
  performed_by: string;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  active: "Active",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getActionIcon(action: string) {
  switch (action) {
    case "status_change":
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    case "note_edit":
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
    case "info_edit":
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    default:
      return (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

function getActionDescription(entry: ActivityEntry) {
  switch (entry.action) {
    case "status_change": {
      const from = STATUS_LABELS[entry.details.from as string] || entry.details.from;
      const to = STATUS_LABELS[entry.details.to as string] || entry.details.to;
      return (
        <span>
          Status changed from <span className="font-medium">{from as string}</span> to{" "}
          <span className="font-medium">{to as string}</span>
        </span>
      );
    }
    case "note_edit":
      return <span>Notes updated</span>;
    case "info_edit": {
      const fields = entry.details.fields as string[];
      return (
        <span>
          Client info edited ({fields?.length || 0} field{(fields?.length || 0) !== 1 ? "s" : ""})
        </span>
      );
    }
    default:
      return <span>{entry.action}</span>;
  }
}

export function ActivityLog({ submissionId }: { submissionId: string }) {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/submissions/${submissionId}/activity`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEntries(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [submissionId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-3">No activity yet</p>;
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

      <div className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} className="flex gap-3 relative">
            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center text-gray-500 flex-shrink-0 z-10">
              {getActionIcon(entry.action)}
            </div>
            <div className="flex-1 min-w-0 -mt-0.5">
              <p className="text-sm text-gray-700">{getActionDescription(entry)}</p>
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(entry.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
