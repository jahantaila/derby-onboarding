"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  session_id: string;
  business_name: string | null;
  contact_name: string | null;
  business_phone: string | null;
  business_email: string | null;
  service_categories: string[] | null;
  pipeline_status: "new" | "in_progress" | "active";
  submitted_at: string;
  created_at: string;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
  service_area_miles: number | null;
  weekly_budget_cents: number | null;
  contact_phone: string | null;
  contact_email: string | null;
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In Progress" },
  { value: "active", label: "Active" },
];

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: "bg-blue-500/15", text: "text-blue-400", label: "New" },
  in_progress: { bg: "bg-yellow-500/15", text: "text-yellow-400", label: "In Progress" },
  active: { bg: "bg-green-500/15", text: "text-green-400", label: "Active" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatServices(categories: string[] | null) {
  if (!categories || categories.length === 0) return "—";
  const labels = categories.map(
    (c) => c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " ")
  );
  if (labels.length <= 2) return labels.join(", ");
  return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
}

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), page_size: "20" });
      if (statusFilter) params.set("status", statusFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/submissions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setSubmissions(data.submissions);
      setPagination(data.pagination);
    } catch {
      setSubmissions([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchSubmissions();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Submissions</h1>
      <p className="text-gray-400 mb-6">Manage client onboarding submissions</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by business or owner name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-derby-card border border-white/10 rounded-lg px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-derby-card border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-derby-card rounded-xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-white/5 rounded animate-pulse" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg">No submissions found</p>
            <p className="text-gray-500 text-sm mt-1">
              {search || statusFilter
                ? "Try adjusting your search or filters"
                : "Submissions will appear here as clients complete onboarding"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 font-medium">Business</th>
                    <th className="px-5 py-3 font-medium">Owner</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Email</th>
                    <th className="px-5 py-3 font-medium">Services</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => {
                    const badge = STATUS_BADGE[sub.pipeline_status] || STATUS_BADGE.new;
                    const isExpanded = expandedId === sub.id;
                    return (
                      <SubmissionRow
                        key={sub.id}
                        sub={sub}
                        badge={badge}
                        isExpanded={isExpanded}
                        onToggle={() => setExpandedId(isExpanded ? null : sub.id)}
                        onViewDetail={() => router.push(`/admin/submissions/${sub.id}`)}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-white/10">
              {submissions.map((sub) => {
                const badge = STATUS_BADGE[sub.pipeline_status] || STATUS_BADGE.new;
                const isExpanded = expandedId === sub.id;
                return (
                  <MobileSubmissionCard
                    key={sub.id}
                    sub={sub}
                    badge={badge}
                    isExpanded={isExpanded}
                    onToggle={() => setExpandedId(isExpanded ? null : sub.id)}
                    onViewDetail={() => router.push(`/admin/submissions/${sub.id}`)}
                  />
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-400">
            Showing {(pagination.page - 1) * pagination.page_size + 1}–
            {Math.min(pagination.page * pagination.page_size, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg bg-derby-card border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg bg-derby-card border border-white/10 text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionRow({
  sub,
  badge,
  isExpanded,
  onToggle,
  onViewDetail,
}: {
  sub: Submission;
  badge: { bg: string; text: string; label: string };
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetail: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
      >
        <td className="px-5 py-3.5 font-medium text-white">
          {sub.business_name || "—"}
        </td>
        <td className="px-5 py-3.5 text-gray-300">{sub.contact_name || "—"}</td>
        <td className="px-5 py-3.5 text-gray-300">{sub.business_phone || "—"}</td>
        <td className="px-5 py-3.5 text-gray-300">{sub.business_email || "—"}</td>
        <td className="px-5 py-3.5 text-gray-300">
          {formatServices(sub.service_categories)}
        </td>
        <td className="px-5 py-3.5">
          <span
            className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
        </td>
        <td className="px-5 py-3.5 text-gray-400">
          {formatDate(sub.submitted_at || sub.created_at)}
        </td>
      </tr>
      {isExpanded && (
        <tr>
          <td colSpan={7} className="px-5 py-4 bg-white/[0.02]">
            <DetailPanel sub={sub} onViewDetail={onViewDetail} />
          </td>
        </tr>
      )}
    </>
  );
}

function MobileSubmissionCard({
  sub,
  badge,
  isExpanded,
  onToggle,
  onViewDetail,
}: {
  sub: Submission;
  badge: { bg: string; text: string; label: string };
  isExpanded: boolean;
  onToggle: () => void;
  onViewDetail: () => void;
}) {
  return (
    <div>
      <button onClick={onToggle} className="w-full text-left px-4 py-3.5">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-white text-sm">
            {sub.business_name || "—"}
          </span>
          <span
            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}
          >
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span>{sub.contact_name || "—"}</span>
          <span>{formatDate(sub.submitted_at || sub.created_at)}</span>
        </div>
      </button>
      {isExpanded && (
        <div className="px-4 pb-4">
          <DetailPanel sub={sub} onViewDetail={onViewDetail} />
        </div>
      )}
    </div>
  );
}

function DetailPanel({ sub, onViewDetail }: { sub: Submission; onViewDetail: () => void }) {
  const allServices = sub.service_categories
    ? sub.service_categories
        .map((c) => c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " "))
        .join(", ")
    : "—";

  const address = [sub.business_address, sub.business_city, sub.business_state, sub.business_zip]
    .filter(Boolean)
    .join(", ");

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Business Info
          </h4>
          <DetailRow label="Business" value={sub.business_name} />
          <DetailRow label="Owner" value={sub.contact_name} />
          <DetailRow label="Phone" value={sub.business_phone} />
          <DetailRow label="Email" value={sub.business_email} />
          {address && <DetailRow label="Address" value={address} />}
        </div>
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
            Services & Details
          </h4>
          <DetailRow label="Services" value={allServices} />
          <DetailRow
            label="Submitted"
            value={formatDate(sub.submitted_at || sub.created_at)}
          />
          <DetailRow label="Status" value={STATUS_BADGE[sub.pipeline_status]?.label || sub.pipeline_status} />
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-white/5">
        <button
          onClick={(e) => { e.stopPropagation(); onViewDetail(); }}
          className="px-4 py-2 bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          View Full Details
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex gap-2">
      <span className="text-gray-500 shrink-0">{label}:</span>
      <span className="text-gray-200">{value || "—"}</span>
    </div>
  );
}
