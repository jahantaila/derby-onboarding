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
  new: { bg: "bg-blue-100", text: "text-blue-700", label: "New" },
  in_progress: { bg: "bg-yellow-100", text: "text-yellow-700", label: "In Progress" },
  active: { bg: "bg-green-100", text: "text-green-700", label: "Active" },
};

type SortField = "submitted_at" | "business_name" | "pipeline_status";
type SortDir = "asc" | "desc";

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
  const [error, setError] = useState(false);
  const [sortField, setSortField] = useState<SortField>("submitted_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(false);
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
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, search]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchSubmissions();
  }

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  // Client-side sort on current page
  const sorted = [...submissions].sort((a, b) => {
    let aVal: string;
    let bVal: string;
    if (sortField === "submitted_at") {
      aVal = a.submitted_at || a.created_at;
      bVal = b.submitted_at || b.created_at;
    } else if (sortField === "business_name") {
      aVal = a.business_name?.toLowerCase() || "";
      bVal = b.business_name?.toLowerCase() || "";
    } else {
      aVal = a.pipeline_status;
      bVal = b.pipeline_status;
    }
    const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  async function handleStatusChange(subId: string, newStatus: string) {
    setStatusUpdating(subId);
    try {
      const res = await fetch(`/api/admin/submissions/${subId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_status: newStatus }),
      });
      if (res.ok) {
        setSubmissions((prev) =>
          prev.map((s) =>
            s.id === subId ? { ...s, pipeline_status: newStatus as Submission["pipeline_status"] } : s
          )
        );
      }
    } catch {
      // silent fail
    } finally {
      setStatusUpdating(null);
    }
  }

  async function handleDelete(subId: string) {
    setDeletingId(subId);
    try {
      const res = await fetch(`/api/admin/submissions/${subId}`, { method: "DELETE" });
      if (res.ok) {
        setSubmissions((prev) => prev.filter((s) => s.id !== subId));
        if (pagination) {
          setPagination((p) => p ? { ...p, total: p.total - 1 } : p);
        }
      }
    } catch {
      // silent fail
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return (
        <svg className="w-3.5 h-3.5 text-gray-300 ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortDir === "asc" ? (
      <svg className="w-3.5 h-3.5 text-derby-blue ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3.5 h-3.5 text-derby-blue ml-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  }

  const confirmSub = submissions.find((s) => s.id === confirmDeleteId);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Submissions</h1>
        {pagination && (
          <span className="text-sm text-gray-500">{pagination.total} total</span>
        )}
      </div>
      <p className="text-gray-500 mb-6">Manage client onboarding submissions</p>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <form onSubmit={handleSearchSubmit} className="flex-1">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by business or owner name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </form>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && !loading && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 text-center">
          Unable to load submissions. Please try refreshing the page.
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">No submissions found</p>
            <p className="text-gray-400 text-sm mt-1">
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
                  <tr className="border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wider">
                    <th
                      className="px-5 py-3 font-medium cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => toggleSort("business_name")}
                    >
                      Business <SortIcon field="business_name" />
                    </th>
                    <th className="px-5 py-3 font-medium">Owner</th>
                    <th className="px-5 py-3 font-medium">Phone</th>
                    <th className="px-5 py-3 font-medium">Services</th>
                    <th
                      className="px-5 py-3 font-medium cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => toggleSort("pipeline_status")}
                    >
                      Status <SortIcon field="pipeline_status" />
                    </th>
                    <th
                      className="px-5 py-3 font-medium cursor-pointer hover:text-gray-800 select-none"
                      onClick={() => toggleSort("submitted_at")}
                    >
                      Date <SortIcon field="submitted_at" />
                    </th>
                    <th className="px-5 py-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((sub, idx) => {
                    const badge = STATUS_BADGE[sub.pipeline_status] || STATUS_BADGE.new;
                    return (
                      <tr
                        key={sub.id}
                        className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                      >
                        <td
                          className="px-5 py-3.5 font-medium text-gray-900 cursor-pointer"
                          onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                        >
                          {sub.business_name || "—"}
                        </td>
                        <td
                          className="px-5 py-3.5 text-gray-600 cursor-pointer"
                          onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                        >
                          {sub.contact_name || "—"}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          {sub.business_phone ? (
                            <a href={`tel:${sub.business_phone}`} className="hover:text-derby-blue transition-colors">
                              {sub.business_phone}
                            </a>
                          ) : "—"}
                        </td>
                        <td
                          className="px-5 py-3.5 text-gray-600 cursor-pointer"
                          onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                        >
                          {formatServices(sub.service_categories)}
                        </td>
                        <td className="px-5 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={sub.pipeline_status}
                            onChange={(e) => handleStatusChange(sub.id, e.target.value)}
                            disabled={statusUpdating === sub.id}
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-derby-blue/50 disabled:opacity-50 ${badge.bg} ${badge.text}`}
                          >
                            {STATUS_OPTIONS.filter((o) => o.value).map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td
                          className="px-5 py-3.5 text-gray-500 cursor-pointer"
                          onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                        >
                          {formatDate(sub.submitted_at || sub.created_at)}
                        </td>
                        <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setConfirmDeleteId(sub.id)}
                            className="p-1.5 text-gray-300 hover:text-red-500 rounded transition-colors"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {sorted.map((sub) => {
                const badge = STATUS_BADGE[sub.pipeline_status] || STATUS_BADGE.new;
                return (
                  <div key={sub.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-1">
                      <button
                        onClick={() => router.push(`/admin/submissions/${sub.id}`)}
                        className="font-medium text-gray-900 text-sm text-left"
                      >
                        {sub.business_name || "—"}
                      </button>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {badge.label}
                        </span>
                        <button
                          onClick={() => setConfirmDeleteId(sub.id)}
                          className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{sub.contact_name || "—"}</span>
                      <span>{formatDate(sub.submitted_at || sub.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.page_size + 1}–
            {Math.min(pagination.page * pagination.page_size, pagination.total)} of{" "}
            {pagination.total}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              disabled={page >= pagination.total_pages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Delete Submission</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete <strong>{confirmSub?.business_name || "this submission"}</strong>? All associated documents will also be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDeleteId(null)}
                disabled={deletingId === confirmDeleteId}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deletingId === confirmDeleteId ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
