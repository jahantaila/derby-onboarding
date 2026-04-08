"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatusDropdown from "./StatusDropdown";
import DocumentViewer from "./DocumentViewer";

interface Document {
  id: string;
  doc_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  signed_url: string | null;
}

interface SubmissionData {
  id: string;
  session_id: string;
  business_name: string | null;
  business_phone: string | null;
  business_email: string | null;
  business_address: string | null;
  business_city: string | null;
  business_state: string | null;
  business_zip: string | null;
  service_categories: string[] | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  pipeline_status: string;
  submitted_at: string;
  form_data: Record<string, unknown>;
  documents: Document[];
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/10 rounded-lg p-5 bg-white/5">
      <h3 className="font-heading text-lg text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-1.5">
      <span className="text-white/50 text-sm font-body sm:w-40 shrink-0">
        {label}
      </span>
      <span className="text-white text-sm font-body">{value}</span>
    </div>
  );
}

export default function SubmissionDetail({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<SubmissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/submissions/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-derby-blue-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60 font-body">Submission not found</p>
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          className="mt-4 text-derby-blue-light font-body text-sm hover:underline"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const fd = data.form_data;

  return (
    <div>
      <button
        type="button"
        onClick={() => router.push("/admin/dashboard")}
        className="text-white/60 font-body text-sm hover:text-white transition-colors mb-6 inline-flex items-center gap-1"
      >
        &larr; Back to Dashboard
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="font-heading text-2xl text-white">
            {data.business_name ?? "Unknown Business"}
          </h2>
          <p className="text-white/50 text-sm font-body">
            Submitted{" "}
            {new Date(data.submitted_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <StatusDropdown
          submissionId={data.id}
          currentStatus={data.pipeline_status}
        />
      </div>

      <div className="space-y-6">
        <Section title="BUSINESS INFO">
          <Field label="Name" value={data.business_name} />
          <Field
            label="Years in Business"
            value={fd.yearsInBusiness as string | undefined}
          />
          <Field
            label="Address"
            value={
              [
                data.business_address,
                data.business_city,
                data.business_state,
                data.business_zip,
              ]
                .filter(Boolean)
                .join(", ") || null
            }
          />
          <Field
            label="Service Areas"
            value={(fd.serviceAreas as string[] | undefined)?.join(", ")}
          />
        </Section>

        <Section title="CONTACT">
          <Field label="Name" value={data.contact_name} />
          <Field label="Phone" value={data.contact_phone} />
          <Field label="Email" value={data.contact_email} />
        </Section>

        <Section title="SERVICES & BUDGET">
          <Field
            label="Services"
            value={data.service_categories?.join(", ")}
          />
          <Field
            label="Budget"
            value={fd.monthlyBudget as string | undefined}
          />
          <Field
            label="Google Email"
            value={fd.googleEmail as string | undefined}
          />
          <Field
            label="Website"
            value={fd.websiteUrl as string | undefined}
          />
        </Section>

        <Section title="DOCUMENTS">
          <DocumentViewer documents={data.documents} />
        </Section>
      </div>
    </div>
  );
}
