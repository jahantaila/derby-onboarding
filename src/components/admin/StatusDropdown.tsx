"use client";

import { useState } from "react";

const OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "active", label: "Active" },
];

interface Props {
  submissionId: string;
  currentStatus: string;
  onUpdate?: (newStatus: string) => void;
}

export default function StatusDropdown({
  submissionId,
  currentStatus,
  onUpdate,
}: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_status: newStatus }),
      });
      if (!res.ok) throw new Error("Update failed");
      onUpdate?.(newStatus);
    } catch {
      setStatus(currentStatus);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={saving}
      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-body focus:outline-none focus:border-derby-blue-light disabled:opacity-50"
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value} className="bg-derby-dark">
          {opt.label}
        </option>
      ))}
    </select>
  );
}
