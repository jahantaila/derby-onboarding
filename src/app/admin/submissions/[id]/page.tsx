"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/admin/useToast";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";
import { DocumentLightbox } from "@/components/admin/DocumentLightbox";
import { ActivityLog } from "@/components/admin/ActivityLog";
import { SERVICE_CATEGORIES } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface AdStrategy {
  id: string;
  client_id: string;
  strategy_notes: string | null;
  target_audience: string | null;
  positioning: string | null;
  competitive_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface Campaign {
  id: string;
  client_id: string;
  name: string;
  platform: string;
  budget_cents: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface CampaignMetric {
  id: string;
  campaign_id: string;
  date: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend_cents: number;
  created_at: string;
}

interface Lead {
  id: string;
  client_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: string;
  response_time_ms: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadResponse {
  id: string;
  client_id: string;
  template_name: string;
  subject: string;
  body_template: string;
  channel: string;
  is_active: boolean;
  delay_seconds: number;
  created_at: string;
  updated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

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

const PLATFORMS = ["google", "meta", "yelp", "nextdoor", "other"];
const CAMPAIGN_STATUSES = ["draft", "active", "paused", "completed"];
const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "lost"];

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "strategy", label: "Ad Strategy" },
  { id: "campaigns", label: "Campaigns" },
  { id: "results", label: "Results" },
  { id: "leads", label: "Leads" },
  { id: "documents", label: "Documents" },
  { id: "activity", label: "Activity" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0 })}`;
}

function isImageType(mimeType: string) {
  return mimeType.startsWith("image/");
}

function formatCategoryLabel(c: string) {
  return c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, " ");
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [formData, setFormData] = useState<FormDataExtras>({});
  const [documents, setDocuments] = useState<DocumentWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  // Overview / edit state
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

  // Strategy tab
  const [strategies, setStrategies] = useState<AdStrategy[]>([]);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [strategyForm, setStrategyForm] = useState<Partial<AdStrategy>>({});
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  const [strategySaving, setStrategySaving] = useState(false);

  // Campaigns tab
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState<Partial<Campaign>>({});
  const [campaignSaving, setCampaignSaving] = useState(false);

  // Results tab
  const [selectedCampaignForMetrics, setSelectedCampaignForMetrics] = useState<string>("");
  const [metrics, setMetrics] = useState<CampaignMetric[]>([]);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [metricForm, setMetricForm] = useState<Partial<CampaignMetric>>({});
  const [metricSaving, setMetricSaving] = useState(false);

  // Leads tab
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [leadForm, setLeadForm] = useState<Partial<Lead>>({});
  const [leadSaving, setLeadSaving] = useState(false);

  // Lead responses (auto-response templates)
  const [leadResponses, setLeadResponses] = useState<LeadResponse[]>([]);
  const [leadResponsesLoading, setLeadResponsesLoading] = useState(false);
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [editingResponse, setEditingResponse] = useState<LeadResponse | null>(null);
  const [responseForm, setResponseForm] = useState<Partial<LeadResponse>>({});
  const [responseSaving, setResponseSaving] = useState(false);
  const [previewResponse, setPreviewResponse] = useState<LeadResponse | null>(null);

  // ── Fetch core data ───────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [subRes, docsRes] = await Promise.all([
        fetch(`/api/admin/submissions/${id}`),
        fetch(`/api/admin/submissions/${id}/documents`),
      ]);
      if (!subRes.ok) { router.push("/admin/submissions"); return; }
      const subData = await subRes.json();
      setSubmission(subData.submission);
      setFormData(subData.form_data || {});
      setStatus(subData.submission.pipeline_status);
      setInternalNotes(subData.submission.notes?.internal || "");
      if (docsRes.ok) setDocuments(await docsRes.json());
    } catch {
      router.push("/admin/submissions");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Tab-specific lazy loads ───────────────────────────────────────────────

  const fetchStrategies = useCallback(async () => {
    setStrategyLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}/strategies`);
      if (res.ok) setStrategies(await res.json());
    } finally { setStrategyLoading(false); }
  }, [id]);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}/campaigns`);
      if (res.ok) setCampaigns(await res.json());
    } finally { setCampaignsLoading(false); }
  }, [id]);

  const fetchMetrics = useCallback(async (campaignId: string) => {
    if (!campaignId) return;
    setMetricsLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}/campaigns/${campaignId}/metrics`);
      if (res.ok) setMetrics(await res.json());
    } finally { setMetricsLoading(false); }
  }, [id]);

  const fetchLeads = useCallback(async () => {
    setLeadsLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}/leads`);
      if (res.ok) setLeads(await res.json());
    } finally { setLeadsLoading(false); }
  }, [id]);

  const fetchLeadResponses = useCallback(async () => {
    setLeadResponsesLoading(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}/lead-responses`);
      if (res.ok) setLeadResponses(await res.json());
    } finally { setLeadResponsesLoading(false); }
  }, [id]);

  useEffect(() => {
    if (activeTab === "strategy") fetchStrategies();
    if (activeTab === "campaigns" || activeTab === "results") fetchCampaigns();
    if (activeTab === "leads") { fetchLeads(); fetchLeadResponses(); }
  }, [activeTab, fetchStrategies, fetchCampaigns, fetchLeads, fetchLeadResponses]);

  useEffect(() => {
    if (activeTab === "results" && selectedCampaignForMetrics) {
      fetchMetrics(selectedCampaignForMetrics);
    }
  }, [activeTab, selectedCampaignForMetrics, fetchMetrics]);

  // ── Overview actions ──────────────────────────────────────────────────────

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

  async function saveEdits() {
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        setSubmission((await res.json()).submission);
        setIsEditing(false);
        showToast("Client info updated", "success");
      } else showToast("Failed to update client info", "error");
    } catch { showToast("Failed to update client info", "error"); }
    finally { setEditSaving(false); }
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
        setSubmission((await res.json()).submission);
        showToast(`Status updated to ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`, "success");
      } else {
        showToast("Failed to update status", "error");
        if (submission) setStatus(submission.pipeline_status);
      }
    } catch {
      showToast("Failed to update status", "error");
      if (submission) setStatus(submission.pipeline_status);
    } finally { setStatusSaving(false); }
  }

  async function handleSaveNotes() {
    setNotesSaving(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: { internal: internalNotes } }),
      });
      if (res.ok) showToast("Notes saved", "success");
      else showToast("Failed to save notes", "error");
    } catch { showToast("Failed to save notes", "error"); }
    finally { setNotesSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, { method: "DELETE" });
      if (res.ok) { showToast("Submission deleted", "success"); router.push("/admin/submissions"); }
      else showToast("Failed to delete submission", "error");
    } catch { showToast("Failed to delete submission", "error"); }
    finally { setDeleting(false); setShowDeleteConfirm(false); }
  }

  async function handleDownloadPdf() {
    if (!printRef.current) return;
    setPdfGenerating(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const canvas = await html2canvas(printRef.current, { scale: 2, useCORS: true, logging: false });
      const imgWidth = 210;
      const pageHeight = 297;
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
      pdf.save(`${(submission?.business_name || "submission").replace(/[^a-zA-Z0-9]/g, "-")}.pdf`);
      showToast("PDF downloaded", "success");
    } catch { showToast("Failed to generate PDF", "error"); }
    finally { setPdfGenerating(false); }
  }

  // ── Strategy actions ──────────────────────────────────────────────────────

  function startNewStrategy() {
    setStrategyForm({});
    setEditingStrategyId(null);
  }

  function startEditStrategy(s: AdStrategy) {
    setStrategyForm({ strategy_notes: s.strategy_notes || "", target_audience: s.target_audience || "", positioning: s.positioning || "", competitive_notes: s.competitive_notes || "" });
    setEditingStrategyId(s.id);
  }

  async function saveStrategy() {
    setStrategySaving(true);
    try {
      let res: Response;
      if (editingStrategyId) {
        res = await fetch(`/api/admin/clients/${id}/strategies/${editingStrategyId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(strategyForm),
        });
      } else {
        res = await fetch(`/api/admin/clients/${id}/strategies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(strategyForm),
        });
      }
      if (res.ok) {
        showToast("Strategy saved", "success");
        setStrategyForm({});
        setEditingStrategyId(null);
        fetchStrategies();
      } else showToast("Failed to save strategy", "error");
    } catch { showToast("Failed to save strategy", "error"); }
    finally { setStrategySaving(false); }
  }

  async function deleteStrategy(strategyId: string) {
    try {
      const res = await fetch(`/api/admin/clients/${id}/strategies/${strategyId}`, { method: "DELETE" });
      if (res.ok) { showToast("Strategy deleted", "success"); fetchStrategies(); }
      else showToast("Failed to delete strategy", "error");
    } catch { showToast("Failed to delete strategy", "error"); }
  }

  // ── Campaign actions ──────────────────────────────────────────────────────

  function startNewCampaign() {
    setCampaignForm({ name: "", platform: "google", budget_cents: 0, status: "draft" });
    setEditingCampaign(null);
    setShowCampaignForm(true);
  }

  function startEditCampaign(c: Campaign) {
    setCampaignForm({ name: c.name, platform: c.platform, budget_cents: c.budget_cents, start_date: c.start_date || "", end_date: c.end_date || "", status: c.status });
    setEditingCampaign(c);
    setShowCampaignForm(true);
  }

  async function saveCampaign() {
    setCampaignSaving(true);
    try {
      let res: Response;
      if (editingCampaign) {
        res = await fetch(`/api/admin/clients/${id}/campaigns/${editingCampaign.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaignForm),
        });
      } else {
        res = await fetch(`/api/admin/clients/${id}/campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(campaignForm),
        });
      }
      if (res.ok) {
        showToast("Campaign saved", "success");
        setShowCampaignForm(false);
        fetchCampaigns();
      } else showToast("Failed to save campaign", "error");
    } catch { showToast("Failed to save campaign", "error"); }
    finally { setCampaignSaving(false); }
  }

  async function deleteCampaign(campaignId: string) {
    try {
      const res = await fetch(`/api/admin/clients/${id}/campaigns/${campaignId}`, { method: "DELETE" });
      if (res.ok) { showToast("Campaign deleted", "success"); fetchCampaigns(); }
      else showToast("Failed to delete campaign", "error");
    } catch { showToast("Failed to delete campaign", "error"); }
  }

  // ── Metric actions ────────────────────────────────────────────────────────

  async function addMetric() {
    if (!selectedCampaignForMetrics) return;
    setMetricSaving(true);
    try {
      const res = await fetch(`/api/admin/clients/${id}/campaigns/${selectedCampaignForMetrics}/metrics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metricForm),
      });
      if (res.ok) {
        showToast("Metric added", "success");
        setMetricForm({});
        fetchMetrics(selectedCampaignForMetrics);
      } else showToast("Failed to add metric", "error");
    } catch { showToast("Failed to add metric", "error"); }
    finally { setMetricSaving(false); }
  }

  async function deleteMetric(metricId: string) {
    if (!selectedCampaignForMetrics) return;
    try {
      const res = await fetch(`/api/admin/clients/${id}/campaigns/${selectedCampaignForMetrics}/metrics?metricId=${metricId}`, { method: "DELETE" });
      if (res.ok) { showToast("Metric deleted", "success"); fetchMetrics(selectedCampaignForMetrics); }
      else showToast("Failed to delete metric", "error");
    } catch { showToast("Failed to delete metric", "error"); }
  }

  // ── Lead actions ──────────────────────────────────────────────────────────

  function startNewLead() {
    setLeadForm({ name: "", email: "", phone: "", source: "", status: "new", notes: "" });
    setEditingLead(null);
    setShowLeadForm(true);
  }

  function startEditLead(l: Lead) {
    setLeadForm({ name: l.name || "", email: l.email || "", phone: l.phone || "", source: l.source || "", status: l.status, notes: l.notes || "", response_time_ms: l.response_time_ms });
    setEditingLead(l);
    setShowLeadForm(true);
  }

  async function saveLead() {
    setLeadSaving(true);
    try {
      let res: Response;
      if (editingLead) {
        res = await fetch(`/api/admin/clients/${id}/leads/${editingLead.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadForm),
        });
      } else {
        res = await fetch(`/api/admin/clients/${id}/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(leadForm),
        });
      }
      if (res.ok) {
        showToast("Lead saved", "success");
        setShowLeadForm(false);
        fetchLeads();
      } else showToast("Failed to save lead", "error");
    } catch { showToast("Failed to save lead", "error"); }
    finally { setLeadSaving(false); }
  }

  async function deleteLead(leadId: string) {
    try {
      const res = await fetch(`/api/admin/clients/${id}/leads/${leadId}`, { method: "DELETE" });
      if (res.ok) { showToast("Lead deleted", "success"); fetchLeads(); }
      else showToast("Failed to delete lead", "error");
    } catch { showToast("Failed to delete lead", "error"); }
  }

  // ── Lead response template actions ───────────────────────────────────────

  function startNewResponse() {
    setResponseForm({ template_name: "", subject: "", body_template: "", channel: "email", is_active: true, delay_seconds: 0 });
    setEditingResponse(null);
    setShowResponseForm(true);
  }

  function startEditResponse(r: LeadResponse) {
    setResponseForm({ template_name: r.template_name, subject: r.subject, body_template: r.body_template, channel: r.channel, is_active: r.is_active, delay_seconds: r.delay_seconds });
    setEditingResponse(r);
    setShowResponseForm(true);
  }

  async function saveResponse() {
    if (!responseForm.template_name?.trim()) { showToast("Template name is required", "error"); return; }
    setResponseSaving(true);
    try {
      let res: Response;
      if (editingResponse) {
        res = await fetch(`/api/admin/clients/${id}/lead-responses/${editingResponse.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(responseForm),
        });
      } else {
        res = await fetch(`/api/admin/clients/${id}/lead-responses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(responseForm),
        });
      }
      if (res.ok) {
        showToast("Template saved", "success");
        setShowResponseForm(false);
        fetchLeadResponses();
      } else showToast("Failed to save template", "error");
    } catch { showToast("Failed to save template", "error"); }
    finally { setResponseSaving(false); }
  }

  async function deleteResponse(responseId: string) {
    try {
      const res = await fetch(`/api/admin/clients/${id}/lead-responses/${responseId}`, { method: "DELETE" });
      if (res.ok) { showToast("Template deleted", "success"); fetchLeadResponses(); }
      else showToast("Failed to delete template", "error");
    } catch { showToast("Failed to delete template", "error"); }
  }

  async function toggleResponseActive(r: LeadResponse) {
    try {
      const res = await fetch(`/api/admin/clients/${id}/lead-responses/${r.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !r.is_active }),
      });
      if (res.ok) fetchLeadResponses();
      else showToast("Failed to toggle template", "error");
    } catch { showToast("Failed to toggle template", "error"); }
  }

  function previewTemplate(r: LeadResponse) {
    setPreviewResponse(r);
  }

  function renderTemplatePreview(body: string) {
    return body
      .replace(/\{\{lead_name\}\}/g, submission?.contact_name || "John Smith")
      .replace(/\{\{business_name\}\}/g, submission?.business_name || "Acme Co.")
      .replace(/\{\{client_email\}\}/g, submission?.contact_email || "contact@example.com")
      .replace(/\{\{client_phone\}\}/g, submission?.contact_phone || "(555) 000-0000");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!submission) return null;

  const address = [submission.business_address, submission.business_city, submission.business_state, submission.business_zip].filter(Boolean).join(", ");
  const allServices = submission.service_categories ? submission.service_categories.map(formatCategoryLabel) : [];
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
              {!isEditing && activeTab === "overview" && (
                <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}
              {isEditing && activeTab === "overview" && (
                <>
                  <button onClick={() => { setIsEditing(false); setEditData({}); }} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={saveEdits} disabled={editSaving} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                    {editSaving ? "Saving..." : "Save"}
                  </button>
                </>
              )}
              <button onClick={handleDownloadPdf} disabled={pdfGenerating} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                <span className="hidden sm:inline">{pdfGenerating ? "..." : "PDF"}</span>
              </button>
              <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab nav */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-derby-blue text-derby-blue"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── Overview ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
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
                              setEditData((d) => ({ ...d, service_categories: selected ? current.filter((c) => c !== cat.id) : [...current, cat.id] }));
                            }}
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${selected ? "bg-derby-blue text-white border-derby-blue" : "bg-white text-gray-600 border-gray-200 hover:border-derby-blue/50"}`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : allServices.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allServices.map((svc) => (
                        <span key={svc} className="px-3 py-1.5 bg-blue-50 border border-derby-blue/20 rounded-full text-sm text-derby-blue">{svc}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No services listed</p>
                  )}
                  {formData.other_service && !isEditing && <Field label="Other Service" value={formData.other_service} />}
                  {!isEditing && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <Field label="Service Area" value={formData.service_area || null} />
                      <Field label="Years in Business" value={formData.years_in_business != null ? String(formData.years_in_business) : null} />
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

              <Section title="Ad Preferences & Online Presence">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Monthly Budget" value={formData.monthly_budget || null} />
                  <Field label="Google Account" value={formData.google_account_email || null} />
                  <Field label="Website" value={formData.website_url || null} />
                  <Field label="Current Platforms" value={formData.current_platforms?.length ? formData.current_platforms.join(", ") : null} />
                  <Field label="Facebook" value={formData.facebook_url || null} />
                  <Field label="Instagram" value={formData.instagram_url || null} />
                </div>
              </Section>
            </div>

            <div className="space-y-6">
              <Section title="Pipeline Status">
                <select value={status} onChange={(e) => handleStatusChange(e.target.value)} disabled={statusSaving} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50 disabled:opacity-50">
                  {STATUS_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                {statusSaving && <p className="text-xs text-gray-400 mt-1">Saving...</p>}
              </Section>

              <Section title="Internal Notes">
                <textarea value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} placeholder="Add internal notes..." rows={6} className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50 resize-y" />
                <div className="mt-2">
                  <button onClick={handleSaveNotes} disabled={notesSaving} className="px-4 py-2 bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                    {notesSaving ? "Saving..." : "Save Notes"}
                  </button>
                </div>
              </Section>

              <Section title="Details">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-400">Submitted</span><span className="text-gray-700">{formatDate(submission.submitted_at || submission.created_at)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Documents</span><span className="text-gray-700">{documents.length} file(s)</span></div>
                  <div className="flex justify-between gap-2"><span className="text-gray-400 flex-shrink-0">Session ID</span><span className="text-gray-500 text-xs font-mono truncate">{submission.session_id}</span></div>
                </div>
              </Section>
            </div>
          </div>
        )}

        {/* ── Ad Strategy ── */}
        {activeTab === "strategy" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Manage this client&apos;s ad strategy notes, target audience, and positioning.</p>
              {editingStrategyId === null && Object.keys(strategyForm).length === 0 && (
                <button onClick={startNewStrategy} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-lg hover:opacity-90 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Strategy
                </button>
              )}
            </div>

            {/* Strategy form */}
            {(editingStrategyId !== null || Object.keys(strategyForm).length > 0) && (
              <Section title={editingStrategyId ? "Edit Strategy" : "New Strategy"}>
                <div className="space-y-4">
                  <TextareaField label="Strategy Notes" value={strategyForm.strategy_notes || ""} onChange={(v) => setStrategyForm((f) => ({ ...f, strategy_notes: v }))} rows={4} />
                  <TextareaField label="Target Audience" value={strategyForm.target_audience || ""} onChange={(v) => setStrategyForm((f) => ({ ...f, target_audience: v }))} rows={3} />
                  <TextareaField label="Positioning" value={strategyForm.positioning || ""} onChange={(v) => setStrategyForm((f) => ({ ...f, positioning: v }))} rows={3} />
                  <TextareaField label="Competitive Notes" value={strategyForm.competitive_notes || ""} onChange={(v) => setStrategyForm((f) => ({ ...f, competitive_notes: v }))} rows={3} />
                  <div className="flex gap-3">
                    <button onClick={saveStrategy} disabled={strategySaving} className="px-4 py-2 bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                      {strategySaving ? "Saving..." : "Save"}
                    </button>
                    <button onClick={() => { setStrategyForm({}); setEditingStrategyId(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              </Section>
            )}

            {strategyLoading ? (
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ) : strategies.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No strategy entries yet. Create one above.</div>
            ) : (
              <div className="space-y-4">
                {strategies.map((s) => (
                  <Section key={s.id} title={`Strategy — ${formatDateShort(s.created_at)}`}>
                    <div className="space-y-4">
                      {s.strategy_notes && <div><p className="text-xs text-gray-400 mb-1">Strategy Notes</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{s.strategy_notes}</p></div>}
                      {s.target_audience && <div><p className="text-xs text-gray-400 mb-1">Target Audience</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{s.target_audience}</p></div>}
                      {s.positioning && <div><p className="text-xs text-gray-400 mb-1">Positioning</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{s.positioning}</p></div>}
                      {s.competitive_notes && <div><p className="text-xs text-gray-400 mb-1">Competitive Notes</p><p className="text-sm text-gray-700 whitespace-pre-wrap">{s.competitive_notes}</p></div>}
                      <div className="flex gap-3 pt-2 border-t border-gray-100">
                        <button onClick={() => startEditStrategy(s)} className="text-sm text-derby-blue hover:underline">Edit</button>
                        <button onClick={() => deleteStrategy(s.id)} className="text-sm text-red-500 hover:underline">Delete</button>
                      </div>
                    </div>
                  </Section>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Campaigns ── */}
        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">Track ad campaigns across platforms.</p>
              {!showCampaignForm && (
                <button onClick={startNewCampaign} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-lg hover:opacity-90 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  New Campaign
                </button>
              )}
            </div>

            {showCampaignForm && (
              <Section title={editingCampaign ? "Edit Campaign" : "New Campaign"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EditField label="Campaign Name" value={campaignForm.name || ""} onChange={(v) => setCampaignForm((f) => ({ ...f, name: v }))} />
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">Platform</label>
                    <select value={campaignForm.platform || "google"} onChange={(e) => setCampaignForm((f) => ({ ...f, platform: e.target.value }))} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50">
                      {PLATFORMS.map((p) => <option key={p} value={p}>{capitalize(p)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">Budget (cents)</label>
                    <input type="number" value={campaignForm.budget_cents || 0} onChange={(e) => setCampaignForm((f) => ({ ...f, budget_cents: Number(e.target.value) }))} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">Status</label>
                    <select value={campaignForm.status || "draft"} onChange={(e) => setCampaignForm((f) => ({ ...f, status: e.target.value }))} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50">
                      {CAMPAIGN_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
                    </select>
                  </div>
                  <EditField label="Start Date" value={campaignForm.start_date || ""} onChange={(v) => setCampaignForm((f) => ({ ...f, start_date: v }))} type="date" />
                  <EditField label="End Date" value={campaignForm.end_date || ""} onChange={(v) => setCampaignForm((f) => ({ ...f, end_date: v }))} type="date" />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={saveCampaign} disabled={campaignSaving} className="px-4 py-2 bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                    {campaignSaving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setShowCampaignForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </Section>
            )}

            {campaignsLoading ? (
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No campaigns yet.</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Platform</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Budget</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Dates</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{capitalize(c.platform)}</td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatCents(c.budget_cents)}</td>
                        <td className="px-4 py-3">
                          <CampaignStatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">
                          {c.start_date ? formatDateShort(c.start_date) : "—"} – {c.end_date ? formatDateShort(c.end_date) : "ongoing"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => startEditCampaign(c)} className="text-derby-blue hover:underline text-xs">Edit</button>
                            <button onClick={() => deleteCampaign(c.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Results ── */}
        {activeTab === "results" && (
          <div className="space-y-6">
            {campaigns.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No campaigns yet. Create campaigns first.</div>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <label className="text-sm font-medium text-gray-600">Campaign:</label>
                  <select
                    value={selectedCampaignForMetrics}
                    onChange={(e) => setSelectedCampaignForMetrics(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50"
                  >
                    <option value="">Select a campaign...</option>
                    {campaigns.map((c) => <option key={c.id} value={c.id}>{c.name} ({capitalize(c.platform)})</option>)}
                  </select>
                </div>

                {selectedCampaignForMetrics && (
                  <>
                    {/* Summary cards */}
                    {!metricsLoading && metrics.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <MetricCard label="Impressions" value={metrics.reduce((a, m) => a + m.impressions, 0).toLocaleString()} />
                        <MetricCard label="Clicks" value={metrics.reduce((a, m) => a + m.clicks, 0).toLocaleString()} />
                        <MetricCard label="Conversions" value={metrics.reduce((a, m) => a + m.conversions, 0).toLocaleString()} />
                        <MetricCard label="Total Spend" value={formatCents(metrics.reduce((a, m) => a + m.spend_cents, 0))} />
                      </div>
                    )}

                    {/* Add metric form */}
                    <Section title="Add Daily Entry">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <EditField label="Date" value={metricForm.date || ""} onChange={(v) => setMetricForm((f) => ({ ...f, date: v }))} type="date" />
                        <EditField label="Impressions" value={String(metricForm.impressions || "")} onChange={(v) => setMetricForm((f) => ({ ...f, impressions: Number(v) }))} type="number" />
                        <EditField label="Clicks" value={String(metricForm.clicks || "")} onChange={(v) => setMetricForm((f) => ({ ...f, clicks: Number(v) }))} type="number" />
                        <EditField label="Conversions" value={String(metricForm.conversions || "")} onChange={(v) => setMetricForm((f) => ({ ...f, conversions: Number(v) }))} type="number" />
                        <EditField label="Spend (cents)" value={String(metricForm.spend_cents || "")} onChange={(v) => setMetricForm((f) => ({ ...f, spend_cents: Number(v) }))} type="number" />
                        <div className="flex items-end">
                          <button onClick={addMetric} disabled={metricSaving || !metricForm.date} className="w-full px-3 py-2 bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                            {metricSaving ? "..." : "Add"}
                          </button>
                        </div>
                      </div>
                    </Section>

                    {/* Metrics table */}
                    {metricsLoading ? (
                      <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
                    ) : metrics.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">No entries yet. Add one above.</div>
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
                              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Impressions</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clicks</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Conversions</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Spend</th>
                              <th className="px-4 py-3" />
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {metrics.map((m) => (
                              <tr key={m.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-gray-700">{formatDateShort(m.date)}</td>
                                <td className="px-4 py-3 text-right text-gray-700">{m.impressions.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-700">{m.clicks.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-700 hidden sm:table-cell">{m.conversions.toLocaleString()}</td>
                                <td className="px-4 py-3 text-right text-gray-700 hidden md:table-cell">{formatCents(m.spend_cents)}</td>
                                <td className="px-4 py-3 text-right">
                                  <button onClick={() => deleteMetric(m.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Leads ── */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            {/* Header with avg response time */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Track leads for this client.</p>
                {leads.length > 0 && (() => {
                  const withTime = leads.filter((l) => l.response_time_ms != null);
                  if (withTime.length === 0) return null;
                  const avgMs = withTime.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / withTime.length;
                  const avgMin = Math.round(avgMs / 60000);
                  const color = avgMin < 5 ? "text-green-600" : avgMin <= 30 ? "text-yellow-600" : "text-red-600";
                  return <p className={`text-xs mt-0.5 font-medium ${color}`}>Avg response time: {avgMin < 1 ? "<1" : avgMin} min</p>;
                })()}
              </div>
              {!showLeadForm && (
                <button onClick={startNewLead} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-lg hover:opacity-90 transition-opacity">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Add Lead
                </button>
              )}
            </div>

            {showLeadForm && (
              <Section title={editingLead ? "Edit Lead" : "New Lead"}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <EditField label="Name" value={leadForm.name || ""} onChange={(v) => setLeadForm((f) => ({ ...f, name: v }))} />
                  <EditField label="Email" value={leadForm.email || ""} onChange={(v) => setLeadForm((f) => ({ ...f, email: v }))} type="email" />
                  <EditField label="Phone" value={leadForm.phone || ""} onChange={(v) => setLeadForm((f) => ({ ...f, phone: v }))} />
                  <EditField label="Source" value={leadForm.source || ""} onChange={(v) => setLeadForm((f) => ({ ...f, source: v }))} />
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">Status</label>
                    <select value={leadForm.status || "new"} onChange={(e) => setLeadForm((f) => ({ ...f, status: e.target.value }))} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50">
                      {LEAD_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-0.5 block">Response Time (ms)</label>
                    <input
                      type="number"
                      value={leadForm.response_time_ms ?? ""}
                      onChange={(e) => setLeadForm((f) => ({ ...f, response_time_ms: e.target.value ? parseInt(e.target.value) : null }))}
                      placeholder="e.g. 120000"
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <TextareaField label="Notes" value={leadForm.notes || ""} onChange={(v) => setLeadForm((f) => ({ ...f, notes: v }))} rows={3} />
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={saveLead} disabled={leadSaving} className="px-4 py-2 bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                    {leadSaving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => setShowLeadForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                </div>
              </Section>
            )}

            {leadsLoading ? (
              <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
            ) : leads.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No leads yet.</div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Source</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Response</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Added</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leads.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{l.name || "—"}</td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                          <div>{l.email || "—"}</div>
                          <div className="text-gray-400">{l.phone || ""}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{l.source || "—"}</td>
                        <td className="px-4 py-3">
                          <LeadStatusBadge status={l.status} />
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          {l.response_time_ms != null ? (
                            <span className={`text-xs font-medium ${l.response_time_ms < 300000 ? "text-green-600" : l.response_time_ms < 1800000 ? "text-yellow-600" : "text-red-600"}`}>
                              {Math.round(l.response_time_ms / 60000)} min
                            </span>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{formatDateShort(l.created_at)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button onClick={() => startEditLead(l)} className="text-derby-blue hover:underline text-xs">Edit</button>
                            <button onClick={() => deleteLead(l.id)} className="text-red-500 hover:underline text-xs">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Auto-Response Templates */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700">Auto-Response Templates</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Templates queued automatically when a new lead is created.</p>
                </div>
                {!showResponseForm && (
                  <button onClick={startNewResponse} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-derby-blue border border-derby-blue/30 rounded-lg hover:bg-derby-blue/5 transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Add Template
                  </button>
                )}
              </div>

              {showResponseForm && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-4">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{editingResponse ? "Edit Template" : "New Template"}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditField label="Template Name" value={responseForm.template_name || ""} onChange={(v) => setResponseForm((f) => ({ ...f, template_name: v }))} />
                    <EditField label="Subject" value={responseForm.subject || ""} onChange={(v) => setResponseForm((f) => ({ ...f, subject: v }))} />
                    <div>
                      <label className="text-xs text-gray-400 mb-0.5 block">Channel</label>
                      <select value={responseForm.channel || "email"} onChange={(e) => setResponseForm((f) => ({ ...f, channel: e.target.value }))} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50">
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 mb-0.5 block">Delay (seconds after lead creation)</label>
                      <input
                        type="number"
                        min={0}
                        value={responseForm.delay_seconds ?? 0}
                        onChange={(e) => setResponseForm((f) => ({ ...f, delay_seconds: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="text-xs text-gray-400 mb-0.5 block">Body Template <span className="text-gray-300">(use &#123;&#123;lead_name&#125;&#125;, &#123;&#123;business_name&#125;&#125;)</span></label>
                    <textarea
                      rows={5}
                      value={responseForm.body_template || ""}
                      onChange={(e) => setResponseForm((f) => ({ ...f, body_template: e.target.value }))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50 font-mono"
                      placeholder={"Hi {{lead_name}},\n\nThank you for your interest in {{business_name}}..."}
                    />
                  </div>
                  <div className="flex items-center gap-3 mt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={responseForm.is_active ?? true}
                        onChange={(e) => setResponseForm((f) => ({ ...f, is_active: e.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      Active
                    </label>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={saveResponse} disabled={responseSaving} className="px-4 py-2 bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50">
                      {responseSaving ? "Saving..." : "Save Template"}
                    </button>
                    <button onClick={() => setShowResponseForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                </div>
              )}

              {leadResponsesLoading ? (
                <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
              ) : leadResponses.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 rounded-xl border border-dashed border-gray-200">No templates configured.</div>
              ) : (
                <div className="space-y-2">
                  {leadResponses.map((r) => (
                    <div key={r.id} className={`bg-white rounded-xl border shadow-sm p-4 ${r.is_active ? "border-gray-200" : "border-gray-100 opacity-60"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            onClick={() => toggleResponseActive(r)}
                            title={r.is_active ? "Deactivate" : "Activate"}
                            className={`relative flex-shrink-0 w-9 h-5 rounded-full transition-colors ${r.is_active ? "bg-green-500" : "bg-gray-300"}`}
                          >
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${r.is_active ? "left-4" : "left-0.5"}`} />
                          </button>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{r.template_name}</p>
                            <p className="text-xs text-gray-400">
                              {r.channel.toUpperCase()} · {r.delay_seconds === 0 ? "Immediate" : `${Math.round(r.delay_seconds / 60)} min delay`}
                              {r.subject ? ` · "${r.subject}"` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <button onClick={() => previewTemplate(r)} className="text-xs text-gray-500 hover:text-derby-blue">Preview</button>
                          <button onClick={() => startEditResponse(r)} className="text-xs text-derby-blue hover:underline">Edit</button>
                          <button onClick={() => deleteResponse(r.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Documents ── */}
        {activeTab === "documents" && (
          <Section title="Documents">
            {documents.length === 0 ? (
              <p className="text-gray-400">No documents uploaded</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} onClick={() => setLightboxDoc(doc)} />
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ── Activity ── */}
        {activeTab === "activity" && (
          <Section title="Activity Log">
            <ActivityLog submissionId={id} />
          </Section>
        )}
      </div>

      {/* Document Lightbox */}
      {lightboxDoc && (
        <DocumentLightbox doc={lightboxDoc} docs={documents} onClose={() => setLightboxDoc(null)} onNavigate={(doc) => setLightboxDoc(doc)} />
      )}

      {/* Template Preview Modal */}
      {previewResponse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900">Template Preview</h3>
              <button onClick={() => setPreviewResponse(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">{previewResponse.channel} · {previewResponse.template_name}</div>
            {previewResponse.subject && (
              <div className="text-sm font-medium text-gray-800 mb-3 pb-3 border-b border-gray-100">
                Subject: {renderTemplatePreview(previewResponse.subject)}
              </div>
            )}
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {renderTemplatePreview(previewResponse.body_template) || "(no body)"}
            </pre>
            <p className="text-xs text-gray-400 mt-3">Variables substituted with sample data from this client.</p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
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
              <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">{deleting ? "Deleting..." : "Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-3 bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, value, className = "" }: { label: string; value: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm text-gray-700">{value || "—"}</p>
    </div>
  );
}

function EditField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-0.5 block">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50" />
    </div>
  );
}

function TextareaField({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (value: string) => void; rows?: number }) {
  return (
    <div>
      <label className="text-xs text-gray-400 mb-0.5 block">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-derby-blue/50 focus:ring-1 focus:ring-derby-blue/50 resize-y" />
    </div>
  );
}

function DocumentCard({ doc, onClick }: { doc: DocumentWithUrl; onClick: () => void }) {
  const isImage = isImageType(doc.mime_type);
  const label = DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type;
  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-derby-blue/30 transition-colors" onClick={onClick}>
      {isImage && doc.signed_url ? (
        <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={doc.signed_url} alt={doc.file_name} className="max-w-full max-h-full object-contain" />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-10 h-10 text-red-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            <span className="text-xs text-gray-400 uppercase">{doc.mime_type.split("/")[1]}</span>
          </div>
        </div>
      )}
      <div className="p-3">
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-900 truncate mb-1">{doc.file_name}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">{formatFileSize(doc.file_size)}</span>
          <span className="text-xs text-derby-blue font-medium">Click to preview</span>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function CampaignStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-600",
    active: "bg-green-100 text-green-700",
    paused: "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {capitalize(status)}
    </span>
  );
}

function LeadStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700",
    contacted: "bg-yellow-100 text-yellow-700",
    qualified: "bg-purple-100 text-purple-700",
    converted: "bg-green-100 text-green-700",
    lost: "bg-red-100 text-red-600",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-600"}`}>
      {capitalize(status)}
    </span>
  );
}
