"use client";

import { useState, useEffect, useCallback } from "react";
import { useWizard } from "../WizardContext";

interface DocInfo {
  doc_type: string;
  file_name: string;
}

const SERVICE_LABELS: Record<string, string> = {
  electrician: "Electrician",
  plumber: "Plumber",
  hvac: "HVAC",
  roofer: "Roofer",
  painter: "Painter",
  remodeler: "Remodeler",
  handyman: "Handyman",
  general_contractor: "General Contractor",
  landscaper: "Landscaper",
  pest_control: "Pest Control",
  garage_door: "Garage Door",
  locksmith: "Locksmith",
  other: "Other",
};

const DOC_TYPE_LABELS: Record<string, string> = {
  business_license: "Business License",
  insurance: "Certificate of Insurance",
  government_id: "Government ID",
  utility_bill: "Utility Bill",
};

const BUDGET_LABELS: Record<string, string> = {
  "500-1000": "$500 - $1,000",
  "1000-2000": "$1,000 - $2,000",
  "2000-3000": "$2,000 - $3,000",
  "3000+": "$3,000+",
};

const PLATFORM_LABELS: Record<string, string> = {
  google_ads: "Google Ads",
  angi: "Angi",
  homeadvisor: "HomeAdvisor",
  thumbtack: "Thumbtack",
  yelp: "Yelp",
  facebook: "Facebook",
  none: "None",
};

function ConfettiAnimation() {
  const pieces = Array.from({ length: 50 }, (_, i) => i);
  const colors = ["#2093FF", "#0026FF", "#FFD700", "#FF6B6B", "#4ADE80", "#A78BFA"];

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.5;
        const duration = 2 + Math.random() * 2;
        const color = colors[i % colors.length];
        const size = 6 + Math.random() * 8;
        const rotation = Math.random() * 360;

        return (
          <div
            key={i}
            className="absolute animate-confetti-fall"
            style={{
              left: `${left}%`,
              top: "-20px",
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              transform: `rotate(${rotation}deg)`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}

function SectionCard({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-derby-card border border-gray-800 rounded-2xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <button
          onClick={onEdit}
          className="text-sm text-derby-blue hover:text-white transition-colors px-3 py-1 rounded-lg border border-derby-blue/30 hover:border-derby-blue hover:bg-derby-blue/10"
        >
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-1.5">
      <span className="text-sm text-gray-400 sm:w-40 shrink-0">{label}</span>
      <span className="text-sm text-white">{value || "—"}</span>
    </div>
  );
}

export default function ReviewStep() {
  const { formData, sessionToken, goBack, goNext, goToStep } = useWizard();
  const [documents, setDocuments] = useState<DocInfo[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`/api/sessions/${sessionToken}`);
      if (!res.ok) return;
      const session = await res.json();
      // Fetch documents for this session via a separate call
      const docsRes = await fetch(`/api/documents?session_id=${session.id}`);
      if (docsRes.ok) {
        const docs = await docsRes.json();
        setDocuments(docs);
      }
    } catch {
      // Silent fail
    }
  }, [sessionToken]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleSubmit() {
    if (!sessionToken || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_token: sessionToken }),
      });

      if (res.ok) {
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          goNext();
        }, 2500);
      } else {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error || "Failed to submit. Please try again.");
        setSubmitting(false);
      }
    } catch {
      setSubmitError("Something went wrong. Please check your connection and try again.");
      setSubmitting(false);
    }
  }

  const serviceLabels = (formData.service_categories || []).map(
    (cat) => SERVICE_LABELS[cat] || cat
  );

  const platformLabels = (formData.current_platforms || []).map(
    (p) => PLATFORM_LABELS[p] || p
  );

  return (
    <div className="max-w-2xl mx-auto px-4">
      {showConfetti && <ConfettiAnimation />}

      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Review &amp; Submit</h2>
        <p className="text-gray-400">
          Review your information below. Click Edit on any section to make changes.
        </p>
      </div>

      {/* Business Information */}
      <SectionCard title="Business Information" onEdit={() => goToStep(2)}>
        <div className="divide-y divide-gray-800">
          <InfoRow label="Business Name" value={formData.business_name} />
          <InfoRow label="Owner Name" value={formData.owner_name} />
          <InfoRow label="Phone" value={formData.phone} />
          <InfoRow label="Email" value={formData.email} />
          <InfoRow label="Address" value={formData.address} />
          <InfoRow
            label="City, State, ZIP"
            value={
              [formData.city, formData.state, formData.zip].filter(Boolean).join(", ") || undefined
            }
          />
        </div>
      </SectionCard>

      {/* Services */}
      <SectionCard title="Services &amp; Trade" onEdit={() => goToStep(3)}>
        <div className="divide-y divide-gray-800">
          <div className="py-1.5">
            <span className="text-sm text-gray-400 block mb-1.5">Services</span>
            <div className="flex flex-wrap gap-2">
              {serviceLabels.length > 0 ? (
                serviceLabels.map((label) => (
                  <span
                    key={label}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-derby-blue/10 text-derby-blue border border-derby-blue/20"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">—</span>
              )}
            </div>
            {formData.other_service && (
              <p className="text-sm text-gray-300 mt-1.5">
                Other: {formData.other_service}
              </p>
            )}
          </div>
          <InfoRow label="Service Area" value={formData.service_area} />
          <InfoRow
            label="Years in Business"
            value={formData.years_in_business?.toString()}
          />
          <InfoRow label="Employees" value={formData.employees} />
        </div>
      </SectionCard>

      {/* Documents */}
      <SectionCard title="Documents" onEdit={() => goToStep(4)}>
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.doc_type}
                className="flex items-center gap-3 py-1.5"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-white">
                    {DOC_TYPE_LABELS[doc.doc_type] || doc.doc_type}
                  </p>
                  <p className="text-xs text-gray-500">{doc.file_name}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
        )}
      </SectionCard>

      {/* Ad Preferences */}
      <SectionCard title="Ad Preferences" onEdit={() => goToStep(5)}>
        <div className="divide-y divide-gray-800">
          <InfoRow label="Website" value={formData.website_url} />
          <InfoRow label="Google Email" value={formData.google_account_email} />
          <InfoRow
            label="Monthly Budget"
            value={
              formData.monthly_budget
                ? BUDGET_LABELS[formData.monthly_budget] || formData.monthly_budget
                : undefined
            }
          />
          <div className="py-1.5">
            <span className="text-sm text-gray-400 block mb-1.5">
              Current Platforms
            </span>
            <div className="flex flex-wrap gap-2">
              {platformLabels.length > 0 ? (
                platformLabels.map((label) => (
                  <span
                    key={label}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-derby-blue/10 text-derby-blue border border-derby-blue/20"
                  >
                    {label}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500">—</span>
              )}
            </div>
          </div>
          {formData.facebook_url && (
            <InfoRow label="Facebook" value={formData.facebook_url} />
          )}
          {formData.instagram_url && (
            <InfoRow label="Instagram" value={formData.instagram_url} />
          )}
        </div>
      </SectionCard>

      {/* Error */}
      {submitError && (
        <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-400 text-center">
          {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 mb-8">
        <button
          onClick={goBack}
          className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-10 py-4 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-bold text-lg hover:shadow-lg hover:shadow-derby-blue/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </div>
  );
}
