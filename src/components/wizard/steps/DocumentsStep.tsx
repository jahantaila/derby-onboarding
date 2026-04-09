"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useWizard } from "../WizardContext";

interface DocSlot {
  id: string;
  label: string;
  docType: string;
  required: boolean;
  icon: string;
}

const DOC_SLOTS: DocSlot[] = [
  { id: "business_license", label: "Business License", docType: "business_license", required: true, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "insurance", label: "Certificate of Insurance", docType: "insurance", required: true, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
  { id: "government_id", label: "Government ID", docType: "government_id", required: true, icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" },
  { id: "utility_bill_1", label: "Utility Bill #1", docType: "utility_bill_1", required: true, icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
  { id: "utility_bill_2", label: "Utility Bill #2", docType: "utility_bill_2", required: true, icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" },
];

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadedDoc {
  id: string;
  doc_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsStep() {
  const { sessionToken, goNext, goBack } = useWizard();
  const [uploads, setUploads] = useState<Record<string, UploadedDoc>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dragOver, setDragOver] = useState<Record<string, boolean>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Load existing documents on mount
  useEffect(() => {
    if (!sessionToken) {
      setLoadingDocs(false);
      return;
    }
    fetch(`/api/sessions/${sessionToken}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((session) => {
        if (session.id) {
          return fetch(`/api/documents?session_id=${session.id}`)
            .then((res) => res.ok ? res.json() : [])
            .then((docs: { id: string; doc_type: string; file_name: string; file_size: number; mime_type: string }[]) => {
              const loaded: Record<string, UploadedDoc> = {};
              for (const doc of docs) {
                loaded[doc.doc_type] = doc;
              }
              setUploads(loaded);
            });
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDocs(false));
  }, [sessionToken]);

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Please upload a PDF, JPG, or PNG file.";
    }
    if (file.size > MAX_SIZE) {
      return "File is too large. Maximum size is 10MB.";
    }
    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File, docType: string) => {
      if (!sessionToken) return;

      const validationError = validateFile(file);
      if (validationError) {
        setErrors((prev) => ({ ...prev, [docType]: validationError }));
        return;
      }

      setErrors((prev) => ({ ...prev, [docType]: "" }));
      setUploading((prev) => ({ ...prev, [docType]: true }));
      setProgress((prev) => ({ ...prev, [docType]: 0 }));

      // Simulate progress since fetch doesn't support progress natively
      const progressInterval = setInterval(() => {
        setProgress((prev) => ({
          ...prev,
          [docType]: Math.min((prev[docType] || 0) + 15, 90),
        }));
      }, 200);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("session_token", sessionToken);
        formData.append("doc_type", docType);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);

        if (!res.ok) {
          const data = await res.json();
          setErrors((prev) => ({ ...prev, [docType]: data.error || "Upload failed" }));
          setProgress((prev) => ({ ...prev, [docType]: 0 }));
          return;
        }

        const doc: UploadedDoc = await res.json();
        setUploads((prev) => ({ ...prev, [docType]: doc }));
        setProgress((prev) => ({ ...prev, [docType]: 100 }));
      } catch {
        clearInterval(progressInterval);
        setErrors((prev) => ({ ...prev, [docType]: "Upload failed. Please try again." }));
        setProgress((prev) => ({ ...prev, [docType]: 0 }));
      } finally {
        setUploading((prev) => ({ ...prev, [docType]: false }));
      }
    },
    [sessionToken, validateFile]
  );

  function handleDrop(e: React.DragEvent, docType: string) {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [docType]: false }));
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file, docType);
  }

  function handleDragOver(e: React.DragEvent, docType: string) {
    e.preventDefault();
    setDragOver((prev) => ({ ...prev, [docType]: true }));
  }

  function handleDragLeave(docType: string) {
    setDragOver((prev) => ({ ...prev, [docType]: false }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>, docType: string) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file, docType);
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleContinue() {
    setGlobalError(null);
    // Check required docs are uploaded
    const missing = DOC_SLOTS.filter(
      (slot) => slot.required && !uploads[slot.docType]
    );
    if (missing.length > 0) {
      setGlobalError(
        `Please upload: ${missing.map((s) => s.label).join(", ")}`
      );
      return;
    }

    // Save step to session
    if (sessionToken) {
      fetch(`/api/sessions/${sessionToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_step: 5 }),
      });
    }

    goNext();
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="mb-10">
        <h2 className="text-3xl sm:text-4xl font-heading uppercase text-gray-900 mb-2 leading-tight">Document Uploads</h2>
        <p className="text-gray-500 text-base">
          Upload your business documents. We accept PDF, JPG, and PNG files up to 10MB.
        </p>
      </div>

      <div className="space-y-5 animate-field-stagger">
        {loadingDocs ? (
          DOC_SLOTS.map((slot) => (
            <div key={slot.id} className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-gray-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))
        ) : null}
        {!loadingDocs && DOC_SLOTS.map((slot) => {
          const uploaded = uploads[slot.docType];
          const isUploading = uploading[slot.docType];
          const progressValue = progress[slot.docType] || 0;
          const error = errors[slot.docType];
          const isDragOver = dragOver[slot.docType];

          return (
            <div key={slot.id} className="relative">
              <div
                onDrop={(e) => handleDrop(e, slot.docType)}
                onDragOver={(e) => handleDragOver(e, slot.docType)}
                onDragLeave={() => handleDragLeave(slot.docType)}
                onClick={() => !isUploading && fileInputRefs.current[slot.docType]?.click()}
                className={`relative rounded-xl border-2 border-dashed p-6 lg:p-8 transition-all duration-200 cursor-pointer ${
                  uploaded
                    ? "border-green-500/50 bg-green-50"
                    : isDragOver
                    ? "border-derby-blue bg-blue-50"
                    : error
                    ? "border-red-500/50 bg-red-50"
                    : "border-[#D1D9E6] bg-white hover:border-derby-blue hover:bg-blue-50/30"
                }`}
              >
                <input
                  ref={(el) => { fileInputRefs.current[slot.docType] = el; }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, slot.docType)}
                />

                {uploaded ? (
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{slot.label}</h3>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {uploaded.file_name} ({formatFileSize(uploaded.file_size)})
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploads((prev) => {
                            const next = { ...prev };
                            delete next[slot.docType];
                            return next;
                          });
                        }}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-300"
                      >
                        Remove
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRefs.current[slot.docType]?.click();
                        }}
                        className="text-xs text-derby-blue hover:text-derby-blue-deep transition-colors px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400"
                      >
                        Replace
                      </button>
                    </div>
                  </div>
                ) : isUploading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-derby-blue animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={slot.icon} />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">{slot.label}</p>
                    <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-full transition-all duration-300"
                        style={{ width: `${progressValue}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                      <svg className="w-7 h-7 text-derby-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900">{slot.label}</h3>
                      {slot.required ? (
                        <span className="text-red-500 text-xs">*</span>
                      ) : (
                        <span className="text-gray-500 text-xs">(optional)</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      Drag &amp; drop or click to upload
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <p className="mt-1.5 text-sm text-red-500">{error}</p>
              )}
            </div>
          );
        })}
      </div>

      {globalError && (
        <p className="mt-4 text-sm text-red-500 text-center">{globalError}</p>
      )}

      <p className="mt-4 text-xs text-gray-500 text-center">
        Accepted formats: PDF, JPG, PNG &middot; Max 10MB per file
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10">
        <button
          onClick={goBack}
          className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 hover:text-gray-900 hover:border-gray-400 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold hover:shadow-lg hover:shadow-derby-blue/25 transition-all btn-interactive"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
