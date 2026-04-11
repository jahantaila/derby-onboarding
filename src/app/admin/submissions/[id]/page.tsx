"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface SubmissionDetail {
  id: string;
  session_id: string;
  business_name: string | null;
  contact_name: string | null;
  business_phone: string | null;
  business_email: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
  service_categories: string[] | null;
  service_area_miles: number | null;
  weekly_budget_cents: number | null;
  contact_phone: string | null;
  contact_email: string | null;
  pipeline_status: "new" | "in_progress" | "active";
  submitted_at: string;
  created_at: string;
  notes: Record<string, string> | null;
}

interface FormDataExtras {
  website_url?: string;
  google_account_email?: string;
  monthly_budget?: string;
  current_platforms?: string[];
  facebook_url?: string;
  instagram_url?: string;
  service_area?: string;
  years_in_business?: number;
  employees?: string;
  other_service?: string;
}

interface DocumentWithUrl {
  id: string;
  doc_type: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  signed_url: string | null;
}

const STATUS_OPTIONS = [
  { value: "new", label: "New", bg: "bg-blue-100", text: "text-blue-700" },
  { value: "in_progress", label: "In Progress", bg: "bg-yellow-100", text: "text-yellow-700" },
  { value: "active", label: "Active", bg: "bg-green-100", text: "text-green-700" },
];

const DOC_TYPE_LABELS: Record<string, string> = {
  business_license: "Business License",
  insurance: "Certificate of Insurance",
  government_id: "Government ID",
  utility_bill: "Utility Bill",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImageType(mimeType: string) {
  return mimeType.startsWith("image/");
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [formData, setFormData] = useState<FormDataExtras>({});
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, docsRes] = await Promise.all([
        fetch(`/api/admin/submissions/${id}`),
        fetch(`/api/admin/submissions/${id}/documents`),
      ]);

      if (!subRes.ok) {
        router.push("/admin/submissions");
        return;
      }

      const subData = await subRes.json();
      setSubmission(subData.submission);
      setFormData(subData.form_data || {});
      setStatus(subData.submission.pipeline_status);
      setInternalNotes(subData.submission.notes?.internal || "");

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
      }
    } catch {
      router.push("/admin/submissions");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline_status: newStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmission(data.submission);
      }
    } catch {
      if (submission) setStatus(submission.pipeline_status);
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleSaveNotes() {
    setNotesSaving(true);
    setNotesSaved(false);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: { internal: internalNotes } }),
      });
      if (res.ok) {
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      }
    } catch {
      // silent fail
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/admin/submissions");
      }
    } catch {
      // silent fail
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!submission) return null;

  const address = [
    submission.business_address,
    submission.business_city,
    submission.business_state,
    submission.business_zip,
  ]
    .filter(Boolean)
    .join(", ");

  const allServices = submission.service_categories
    ? submission.service_categories.map(
        (c) => c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " ")
      )
    : [];

  const currentBadge = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-break { page-break-before: always; }
        }
      `}</style>

      <div ref={printRef}>
        {/* Header */}
        <div className="flex items-start sm:items-center gap-3 mb-6 no-print">
          <Link
            href="/admin/submissions"
            className="text-gray-400 hover:text-gray-700 transition-colors mt-1 sm:mt-0 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
              {submission.business_name || "Untitled"}
            </h1>
            <p className="text-gray-500 text-xs sm:text-sm">
              Submitted {formatDate(submission.submitted_at || submission.created_at)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`hidden sm:inline-block px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${currentBadge.bg} ${currentBadge.text}`}>
              {currentBadge.label}
            </span>
            {/* PDF / Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              title="Download as PDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="hidden sm:inline">PDF</span>
            </button>
            {/* Delete button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete submission"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Print header (only shows on print) */}
        <div id="print-area" className="hidden print:block">
          <div className="mb-6 pb-4 border-b border-gray-300">
            <h1 className="text-2xl font-bold text-gray-900">{submission.business_name || "Untitled"}</h1>
            <p className="text-gray-500 text-sm">Submitted {formatDate(submission.submitted_at || submission.created_at)} · Status: {currentBadge.label}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="print-area">
          {/* Main content - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <Section title="Business Information">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business Name" value={submission.business_name} />
                <Field label="Owner" value={submission.contact_name} />
                <Field label="Phone" value={submission.business_phone} />
                <Field label="Email" value={submission.business_email} />
                {address && <Field label="Address" value={address} className="sm:col-span-2" />}
              </div>
            </Section>

            {/* Services */}
            <Section title="Services & Trade">
              <div className="space-y-4">
                {allServices.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allServices.map((svc) => (
                      <span
                        key={svc}
                        className="px-3 py-1.5 bg-blue-50 border border-derby-blue/20 rounded-full text-sm text-derby-blue"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No services listed</p>
                )}
                {formData.other_service && (
                  <Field label="Other Service" value={formData.other_service} />
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <Field label="Service Area" value={formData.service_area || null} />
                  <Field
                    label="Years in Business"
                    value={formData.years_in_business != null ? String(formData.years_in_business) : null}
                  />
                  <Field label="Employees" value={formData.employees || null} />
                </div>
              </div>
            </Section>

            {/* Documents */}
            <Section title="Documents">
              {documents.length === 0 ? (
                <p className="text-gray-400">No documents uploaded</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))}
                </div>
              )}
            </Section>

            {/* Ad Preferences */}
            <Section title="Ad Preferences & Online Presence">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Monthly Budget" value={formData.monthly_budget || null} />
                <Field label="Google Account" value={formData.google_account_email || null} />
                <Field label="Website" value={formData.website_url || null} />
                <Field
                  label="Current Platforms"
                  value={
                    formData.current_platforms && formData.current_platforms.length > 0
                      ? formData.current_platforms.join(", ")
                      : null
                  }
                />
                <Field label="Facebook" value={formData.facebook_url || null} />
                <Field label="Instagram" value={formData.instagram_url || null} />
              </div>
            </Section>
          </div>

          {/* Sidebar - 1 col */}
          <div className="space-y-6">
            {/* Status */}
            <Section title="Pipeline Status">
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={statusSaving}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50 disabled:opacity-50 no-print"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {statusSaving && (
                <p className="text-xs text-gray-400 mt-1 no-print">Saving...</p>
              )}
            </Section>

            {/* Internal Notes */}
            <Section title="Internal Notes">
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add internal notes about this submission..."
                rows={6}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50 resize-y no-print"
              />
              {internalNotes && (
                <p className="hidden print:block text-sm text-gray-700 whitespace-pre-wrap">{internalNotes}</p>
              )}
              <div className="flex items-center gap-3 mt-2 no-print">
                <button
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  className="px-4 py-2 bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {notesSaving ? "Saving..." : "Save Notes"}
                </button>
                {notesSaved && (
                  <span className="text-green-600 text-sm">Saved!</span>
                )}
              </div>
            </Section>

            {/* Quick Info */}
            <Section title="Details">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Submitted</span>
                  <span className="text-gray-700">
                    {formatDate(submission.submitted_at || submission.created_at)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Documents</span>
                  <span className="text-gray-700">{documents.length} file(s)</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-gray-400 flex-shrink-0">Session ID</span>
                  <span className="text-gray-500 text-xs font-mono truncate">
                    {submission.session_id}
                  </span>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
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
              Are you sure you want to delete <strong>{submission.business_name || "this submission"}</strong>? All associated documents will also be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          {title}
        </h3>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string | null;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-700">{value || "—"}</p>
    </div>
  );
}

function DocumentCard({ doc }: { doc: DocumentWithUrl }) {
  const isImage = isImageType(doc.mime_type);
  const label = DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type;

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      {isImage && doc.signed_url && (
        <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doc.signed_url}
            alt={doc.file_name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {!isImage && (
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-10 h-10 text-red-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-400 uppercase">{doc.mime_type.split("/")[1]}</span>
          </div>
        </div>
      )}

      <div className="p-3">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-900 truncate mb-1">{doc.file_name}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
          {doc.signed_url && (
            <a
              href={doc.signed_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-derby-blue hover:text-derby-blue-deep transition-colors font-medium"
            >
              {isImage ? "View Full" : "Download"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
