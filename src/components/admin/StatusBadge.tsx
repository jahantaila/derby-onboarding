"use client";

const STYLES: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-amber-500/20 text-amber-400",
  active: "bg-green-500/20 text-green-400",
};

const LABELS: Record<string, string> = {
  new: "New",
  in_progress: "In Progress",
  active: "Active",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-body font-semibold ${STYLES[status] ?? "bg-white/10 text-white/60"}`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
