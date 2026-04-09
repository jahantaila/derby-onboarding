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
  { id: "business_license", label: "Business License", docType: "business_license", required: true, icon: "📄" },
  { id: "insurance", label: "Certificate of Insurance", docType: "insurance", required: true, icon: "🛡️" },
  { id: "government_id", label: "Government ID", docType: "government_id", required: true, icon: "🪪" },
  { id: "utility_bill", label: "Utility Bill", docType: "utility_bill", required: false, icon: "📬" },
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
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Document Uploads</h2>
        <p className="text-gray-400">
          Upload your business documents. We accept PDF, JPG, and PNG files up to 10MB.
        </p>
      </div>

      <div className="space-y-4">
        {loadingDocs ? (
          DOC_SLOTS.map((slot) => (
            <div key={slot.id} className="rounded-xl border-2 border-dashed border-gray-700 bg-derby-card p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse" />
                  <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
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
                className={`relative rounded-xl border-2 border-dashed p-6 transition-all duration-200 cursor-pointer ${
                  uploaded
                    ? "border-green-500/50 bg-green-500/5"
                    : isDragOver
                    ? "border-derby-blue bg-derby-blue/10"
                    : error
                    ? "border-red-500/50 bg-red-500/5"
                    : "border-gray-700 bg-derby-card hover:border-gray-500"
                }`}
              >
                <input
                  ref={(el) => { fileInputRefs.current[slot.docType] = el; }}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, slot.docType)}
                />

                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      uploaded
                        ? "bg-green-500/10"
                        : "bg-derby-card"
                    }`}
                  >
                    {uploaded ? (
                      <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span>{slot.icon}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white">{slot.label}</h3>
                      {slot.required ? (
                        <span className="text-red-400 text-xs">*</span>
                      ) : (
                        <span className="text-gray-500 text-xs">(optional)</span>
                      )}
                    </div>

                    {uploaded ? (
                      <p className="text-sm text-gray-400 truncate">
                        {uploaded.file_name} ({formatFileSize(uploaded.file_size)})
                      </p>
                    ) : isUploading ? (
                      <div className="mt-2">
                        <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-full transition-all duration-300"
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Uploading...</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Drag &amp; drop or click to upload
                      </p>
                    )}
                  </div>

                  {uploaded && !isUploading && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRefs.current[slot.docType]?.click();
                      }}
                      className="text-xs text-derby-blue hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-gray-700 hover:border-gray-500"
                    >
                      Replace
                    </button>
                  )}
                </div>
              </div>

              {error && (
                <p className="mt-1.5 text-sm text-red-400">{error}</p>
              )}
            </div>
          );
        })}
      </div>

      {globalError && (
        <p className="mt-4 text-sm text-red-400 text-center">{globalError}</p>
      )}

      <p className="mt-4 text-xs text-gray-500 text-center">
        Accepted formats: PDF, JPG, PNG &middot; Max 10MB per file
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10">
        <button
          onClick={goBack}
          className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold hover:shadow-lg hover:shadow-derby-blue/25 transition-all"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
