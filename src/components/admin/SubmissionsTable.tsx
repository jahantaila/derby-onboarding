"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StatusBadge from "./StatusBadge";

interface Submission {
  id: string;
  business_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  pipeline_status: string;
  submitted_at: string;
  document_count: number;
}

interface ListResponse {
  submissions: Submission[];
  total: number;
  page: number;
  limit: number;
}

export default function SubmissionsTable() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const status = searchParams.get("status") ?? "";
  const sort = searchParams.get("sort") ?? "submitted_at";
  const order = searchParams.get("order") ?? "desc";

  const fetchData = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (search) qs.set("q", search);
    if (status) qs.set("status", status);
    qs.set("sort", sort);
    qs.set("order", order);
    qs.set("page", String(page));
    try {
      const res = await fetch(`/api/admin/submissions?${qs}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [search, status, sort, order, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.set("page", "1");
    router.push(`/admin/dashboard?${params}`);
  };

  const handleSort = (col: string) => {
    if (sort === col) {
      setParam("order", order === "asc" ? "desc" : "asc");
    } else {
      setParam("sort", col);
    }
  };

  const totalPages = data ? Math.ceil(data.total / data.limit) : 0;

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const SortIcon = ({ col }: { col: string }) => {
    if (sort !== col) return null;
    return <span className="ml-1">{order === "asc" ? "\u2191" : "\u2193"}</span>;
  };

  return (
    <div>
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setParam("q", search)}
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm font-body placeholder:text-white/30 focus:outline-none focus:border-derby-blue-light"
        />
        <select
          value={status}
          onChange={(e) => setParam("status", e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm font-body focus:outline-none focus:border-derby-blue-light"
        >
          <option value="" className="bg-derby-dark">
            All Statuses
          </option>
          <option value="new" className="bg-derby-dark">
            New
          </option>
          <option value="in_progress" className="bg-derby-dark">
            In Progress
          </option>
          <option value="active" className="bg-derby-dark">
            Active
          </option>
        </select>
        <button
          type="button"
          onClick={() => setParam("q", search)}
          className="bg-derby-gradient text-white font-body text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          Search
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-derby-blue-light border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !data || data.submissions.length === 0 ? (
        <div className="text-center py-12 text-white/40 font-body">
          {search || status
            ? "No submissions match your search."
            : "No submissions yet. Clients will appear here after completing onboarding."}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm font-body">
              <thead>
                <tr className="border-b border-white/10 text-white/60">
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("business_name")}
                  >
                    Business <SortIcon col="business_name" />
                  </th>
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("contact_name")}
                  >
                    Contact <SortIcon col="contact_name" />
                  </th>
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("pipeline_status")}
                  >
                    Status <SortIcon col="pipeline_status" />
                  </th>
                  <th className="text-left py-3 px-4">Docs</th>
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort("submitted_at")}
                  >
                    Submitted <SortIcon col="submitted_at" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.submissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    onClick={() => router.push(`/admin/clients/${sub.id}`)}
                  >
                    <td className="py-3 px-4 text-white truncate max-w-[200px]">
                      {sub.business_name ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-white/70 truncate max-w-[200px]">
                      {sub.contact_name ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={sub.pipeline_status} />
                    </td>
                    <td className="py-3 px-4 text-white/50">
                      {sub.document_count}
                    </td>
                    <td className="py-3 px-4 text-white/50">
                      {formatDate(sub.submitted_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {data.submissions.map((sub) => (
              <div
                key={sub.id}
                className="border border-white/10 rounded-lg p-4 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => router.push(`/admin/clients/${sub.id}`)}
              >
                <div className="flex justify-between items-start mb-2">
                  <p className="text-white font-semibold truncate flex-1">
                    {sub.business_name ?? "—"}
                  </p>
                  <StatusBadge status={sub.pipeline_status} />
                </div>
                <p className="text-white/60 text-sm">
                  {sub.contact_name ?? "—"}
                </p>
                <div className="flex justify-between items-center mt-2 text-xs text-white/40">
                  <span>{sub.document_count} docs</span>
                  <span>{formatDate(sub.submitted_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 text-sm font-body text-white/60">
              <span>
                Showing {(page - 1) * data.limit + 1}–
                {Math.min(page * data.limit, data.total)} of {data.total}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setParam("page", String(page - 1))}
                  className="px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setParam("page", String(page + 1))}
                  className="px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-30 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
