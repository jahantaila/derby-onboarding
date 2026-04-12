"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/admin/useToast";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { DocumentLightbox } from "@/components/admin/DocumentLightbox";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { SERVICE_CATEGORIES } from "@/lib/constants";

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

function formatCategoryLabel(c: string) {
  return c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " ");
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [formData, setFormData] = useState<FormDataExtras>({});
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [statusSaving, setStatusSaving] = useState(false);
  const [internalNotes, setInternalNotes] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lightboxDoc, setLightboxDoc] = useState<DocumentWithUrl | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, unknown>>({});
  const [editSaving, setEditSaving] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
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

  function startEditing() {
    if (!submission) return;
    setEditData({
      business_name: submission.business_name || "",
      contact_name: submission.contact_name || "",
      business_phone: submission.business_phone || "",
      business_email: submission.business_email || "",
      business_address: submission.business_address || "",
      business_city: submission.business_city || "",
      business_state: submission.business_state || "",
      business_zip: submission.business_zip || "",
      contact_phone: submission.contact_phone || "",
      contact_email: submission.contact_email || "",
      service_categories: submission.service_categories || [],
      service_area_miles: submission.service_area_miles || "",
    });
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditData({});
  }

  async function saveEdits() {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const data = await res.json();
        setSubmission(data.submission);
        setIsEditing(false);
        setEditData({});
        showToast("Client info updated", "success");
      } else {
        showToast("Failed to update client info", "error");
      }
    } catch {
      showToast("Failed to update client info", "error");
    } finally {
      setEditSaving(false);
    }
  }

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
        const label = STATUS_OPTIONS.find((s) => s.value === newStatus)?.label || newStatus;
        showToast(`Status updated to ${label}`, "success");
      } else {
        showToast("Failed to update status", "error");
        if (submission) setStatus(submission.pipeline_status);
      }
    } catch {
      showToast("Failed to update status", "error");
      if (submission) setStatus(submission.pipeline_status);
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleSaveNotes() {
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: { internal: internalNotes } }),
      });
      if (res.ok) {
        showToast("Notes saved", "success");
      } else {
        showToast("Failed to save notes", "error");
      }
    } catch {
      showToast("Failed to save notes", "error");
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Submission deleted", "success");
        router.push("/admin/submissions");
      } else {
        showToast("Failed to delete submission", "error");
      }
    } catch {
      showToast("Failed to delete submission", "error");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleDownloadPdf() {
    if (!printRef.current) return;
    setPdfGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `${(submission?.business_name || "submission").replace(/[^a-zA-Z0-9]/g, "-")}.pdf`;
      pdf.save(fileName);
      showToast("PDF downloaded", "success");
    } catch {
      showToast("Failed to generate PDF", "error");
    } finally {
      setPdfGenerating(false);
    }
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
    ? submission.service_categories.map(formatCategoryLabel)
    : [];

  const currentBadge = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  return (
    <>
      <div ref={printRef}>
        {/* Breadcrumbs + Header */}
        <div className="mb-6">
          <div className="mb-3">
            <Breadcrumbs
              items={[
                { label: "Dashboard", href: "/admin" },
                { label: "Submissions", href: "/admin/submissions" },
                { label: submission.business_name || "Detail" },
              ]}
            />
          </div>
          <div className="flex items-start sm:items-center gap-3">
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
              {!isEditing && (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  title="Edit client info"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdits}
                    disabled={editSaving}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {editSaving ? "Saving..." : "Save"}
                  </button>
                </>
              )}
              <button
                onClick={handleDownloadPdf}
                disabled={pdfGenerating}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Download as PDF"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="hidden sm:inline">{pdfGenerating ? "..." : "PDF"}</span>
              </button>
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
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Information */}
            <Section title="Business Information">
              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EditField label="Business Name" value={editData.business_name as string} onChange={(v) => setEditData((d) => ({ ...d, business_name: v }))} />
                  <EditField label="Owner / Contact" value={editData.contact_name as string} onChange={(v) => setEditData((d) => ({ ...d, contact_name: v }))} />
                  <EditField label="Phone" value={editData.business_phone as string} onChange={(v) => setEditData((d) => ({ ...d, business_phone: v }))} />
                  <EditField label="Email" value={editData.business_email as string} onChange={(v) => setEditData((d) => ({ ...d, business_email: v }))} type="email" />
                  <EditField label="Address" value={editData.business_address as string} onChange={(v) => setEditData((d) => ({ ...d, business_address: v }))} />
                  <EditField label="City" value={editData.business_city as string} onChange={(v) => setEditData((d) => ({ ...d, business_city: v }))} />
                  <EditField label="State" value={editData.business_state as string} onChange={(v) => setEditData((d) => ({ ...d, business_state: v }))} />
                  <EditField label="Zip" value={editData.business_zip as string} onChange={(v) => setEditData((d) => ({ ...d, business_zip: v }))} />
                  <EditField label="Contact Phone" value={editData.contact_phone as string} onChange={(v) => setEditData((d) => ({ ...d, contact_phone: v }))} />
                  <EditField label="Contact Email" value={editData.contact_email as string} onChange={(v) => setEditData((d) => ({ ...d, contact_email: v }))} type="email" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Business Name" value={submission.business_name} />
                  <Field label="Owner" value={submission.contact_name} />
                  <Field label="Phone" value={submission.business_phone} />
                  <Field label="Email" value={submission.business_email} />
                  {address && <Field label="Address" value={address} className="sm:col-span-2" />}
                </div>
              )}
            </Section>

            {/* Services */}
            <Section title="Services & Trade">
              <div className="space-y-4">
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_CATEGORIES.map((cat) => {
                      const selected = ((editData.service_categories as string[]) || []).includes(cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            const current = (editData.service_categories as string[]) || [];
                            setEditData((d) => ({
                              ...d,
                              service_categories: selected
                                ? current.filter((c) => c !== cat.id)
                                : [...current, cat.id],
                            }));
                          }}
                          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                            selected
                              ? "bg-derby-blue text-white border-derby-blue"
                              : "bg-white text-gray-600 border-gray-200 hover:border-derby-blue/50"
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                ) : allServices.length > 0 ? (
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
                {formData.other_service && !isEditing && (
                  <Field label="Other Service" value={formData.other_service} />
                )}
                {!isEditing && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <Field label="Service Area" value={formData.service_area || null} />
                    <Field
                      label="Years in Business"
                      value={formData.years_in_business != null ? String(formData.years_in_business) : null}
                    />
                    <Field label="Employees" value={formData.employees || null} />
                  </div>
                )}
                {isEditing && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <EditField label="Service Area (miles)" value={String(editData.service_area_miles || "")} onChange={(v) => setEditData((d) => ({ ...d, service_area_miles: v ? Number(v) : null }))} type="number" />
                  </div>
                )}
              </div>
            </Section>

            {/* Documents */}
            <Section title="Documents">
              {documents.length === 0 ? (
                <p className="text-gray-400">No documents uploaded</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc) => (
                    <DocumentCard
                      key={doc.id}
                      doc={doc}
                      onClick={() => setLightboxDoc(doc)}
                    />
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
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50 disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {statusSaving && (
                <p className="text-xs text-gray-400 mt-1">Saving...</p>
              )}
            </Section>

            {/* Internal Notes */}
            <Section title="Internal Notes">
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add internal notes about this submission..."
                rows={6}
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50 resize-y"
              />
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={notesSaving}
                  className="px-4 py-2 bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {notesSaving ? "Saving..." : "Save Notes"}
                </button>
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

            {/* Activity Log */}
            <Section title="Activity Log">
              <ActivityLog submissionId={id} />
            </Section>
          </div>
        </div>
      </div>

      {/* Document Lightbox */}
      {lightboxDoc && (
        <DocumentLightbox
          doc={lightboxDoc}
          docs={documents}
          onClose={() => setLightboxDoc(null)}
          onNavigate={(doc) => setLightboxDoc(doc)}
        />
      )}

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

function EditField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-0.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50"
      />
    </div>
  );
}

function DocumentCard({ doc, onClick }: { doc: DocumentWithUrl; onClick: () => void }) {
  const isImage = isImageType(doc.mime_type);
  const label = DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type;

  return (
    <div
      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-derby-blue/30 transition-colors"
      onClick={onClick}
    >
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
          <span className="text-xs text-derby-blue font-medium">
            Click to preview
          </span>
        </div>
      </div>
    </div>
  );
}
