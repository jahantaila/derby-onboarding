"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { useWizard } from "@/components/wizard/WizardProvider";
import { BUDGET_OPTIONS, DOCUMENT_TYPES, type DocumentUpload } from "@/lib/types";
import { staggerContainer, staggerItem } from "@/lib/animations";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-body font-semibold text-derby-blue-light uppercase tracking-wider mb-2">
      {children}
    </h3>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-white/5 last:border-b-0">
      <span className="text-white/50 font-body text-sm">{label}</span>
      <span className="text-white font-body text-sm text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function EmbedThankYou() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] text-center py-8">
      <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
        <svg
          className="w-7 h-7 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="font-heading text-2xl text-white mb-2">
        YOU&apos;RE IN THE GAME.
      </h2>
      <p className="font-body text-white/60 text-sm max-w-sm">
        Our team is already building your campaign. We&apos;ll be in touch within 24 hours.
      </p>
    </div>
  );
}

export default function Confirmation() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { formData, goBack, embed } = useWizard();
  const prefersReduced = useReducedMotion();
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/documents/${token}`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setDocuments)
      .catch(() => {});
  }, [token]);

  const budgetLabel = BUDGET_OPTIONS.find(
    (b) => b.value === formData.monthlyBudget
  )?.label;

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Submission failed");
      }

      if (embed) {
        // Notify parent window and show inline thank-you
        if (window.parent !== window) {
          window.parent.postMessage({ type: "derby:onboard:complete" }, "*");
        }
        setSubmitted(true);
      } else {
        router.push(`/onboard/${token}/thank-you`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }, [token, submitting, router, embed]);

  if (submitted) {
    return <EmbedThankYou />;
  }

  return (
    <div>
      <motion.div
        variants={prefersReduced ? undefined : staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.h2
          className="font-heading text-2xl text-white mb-1"
          variants={prefersReduced ? undefined : staggerItem}
        >
          READY TO LAUNCH
        </motion.h2>
        <motion.p
          className="text-white/60 font-body text-sm mb-6"
          variants={prefersReduced ? undefined : staggerItem}
        >
          Everything looks good. One click and we start working for you.
        </motion.p>

        <div className="space-y-6">
          {/* Business Basics */}
          <motion.div className="bg-white/5 rounded-lg p-4" variants={prefersReduced ? undefined : staggerItem}>
            <SectionHeading>Business</SectionHeading>
            <Field label="Business Name" value={formData.businessName} />
            <Field label="Years in Business" value={formData.yearsInBusiness} />
          </motion.div>

          {/* Owner / Contact */}
          <motion.div className="bg-white/5 rounded-lg p-4" variants={prefersReduced ? undefined : staggerItem}>
            <SectionHeading>Contact</SectionHeading>
            <Field label="Name" value={formData.ownerName} />
            <Field label="Phone" value={formData.ownerPhone} />
            <Field label="Email" value={formData.ownerEmail} />
          </motion.div>

          {/* Location */}
          <motion.div className="bg-white/5 rounded-lg p-4" variants={prefersReduced ? undefined : staggerItem}>
            <SectionHeading>Location</SectionHeading>
            <Field label="Address" value={formData.businessAddress} />
            <Field
              label="City / State / Zip"
              value={
                [formData.businessCity, formData.businessState, formData.businessZip]
                  .filter(Boolean)
                  .join(", ") || undefined
              }
            />
            <Field
              label="Service Areas"
              value={formData.serviceAreas?.join(", ") || undefined}
            />
          </motion.div>

          {/* Services */}
          <motion.div className="bg-white/5 rounded-lg p-4" variants={prefersReduced ? undefined : staggerItem}>
            <SectionHeading>Services</SectionHeading>
            <Field
              label="Categories"
              value={formData.services?.join(", ") || undefined}
            />
          </motion.div>

          {/* Online Presence */}
          <motion.div className="bg-white/5 rounded-lg p-4" variants={prefersReduced ? undefined : staggerItem}>
            <SectionHeading>Online Presence</SectionHeading>
            <Field label="Google Email" value={formData.googleEmail} />
            <Field label="Website" value={formData.websiteUrl} />
            <Field label="Monthly Budget" value={budgetLabel} />
          </motion.div>

          {/* Documents */}
          <motion.div className="bg-white/5 rounded-lg p-4" variants={prefersReduced ? undefined : staggerItem}>
            <SectionHeading>Documents</SectionHeading>
            {documents.length === 0 ? (
              <p className="text-white/40 text-sm font-body">
                No documents uploaded
              </p>
            ) : (
              <div className="space-y-1.5">
                {documents.map((doc) => {
                  const label = DOCUMENT_TYPES.find(
                    (dt) => dt.key === doc.docType
                  )?.label;
                  return (
                    <div
                      key={doc.id}
                      className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-b-0"
                    >
                      <svg
                        className="w-4 h-4 text-green-400 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-white/50 text-sm font-body">
                        {label ?? doc.docType}
                      </span>
                      <span className="text-white text-sm font-body truncate">
                        {doc.fileName}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {error && (
        <p className="text-red-400 text-sm font-body mt-4 text-center">
          {error}
        </p>
      )}

      <div className="flex justify-between items-center mt-8">
        <button
          type="button"
          onClick={goBack}
          disabled={submitting}
          className="text-white/60 hover:text-white font-body transition-colors px-4 py-2 disabled:opacity-40"
        >
          Back
        </button>
        <motion.button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-derby-gradient text-white font-body font-semibold px-10 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          whileHover={
            !submitting && !prefersReduced
              ? { scale: 1.02, boxShadow: "0 0 20px rgba(32,147,255,0.3)" }
              : undefined
          }
          whileTap={!submitting && !prefersReduced ? { scale: 0.98 } : undefined}
        >
          {submitting && (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          )}
          {submitting ? "Submitting..." : "Submit"}
        </motion.button>
      </div>
    </div>
  );
}
