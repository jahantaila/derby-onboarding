"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import StepNavigation from "@/components/wizard/StepNavigation";
import {
  ALLOWED_MIME_TYPES,
  DOCUMENT_TYPES,
  MAX_FILE_SIZE,
  type DocumentUpload,
} from "@/lib/types";

interface UploadSlot {
  docType: string;
  label: string;
  doc: DocumentUpload | null;
  uploading: boolean;
  progress: number;
  error: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function FileThumbnail({ doc }: { doc: DocumentUpload }) {
  if (doc.mimeType.startsWith("image/")) {
    return (
      <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center overflow-hidden">
        <svg
          className="w-6 h-6 text-derby-blue-light"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center">
      <svg
        className="w-6 h-6 text-red-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
        />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontSize="6"
          fill="currentColor"
          fontWeight="bold"
        >
          PDF
        </text>
      </svg>
    </div>
  );
}

function UploadZone({
  slot,
  onFileSelect,
  onRemove,
}: {
  slot: UploadSlot;
  onFileSelect: (docType: string, file: File) => void;
  onRemove: (docType: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) onFileSelect(slot.docType, file);
    },
    [slot.docType, onFileSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(slot.docType, file);
      // Reset so re-selecting the same file triggers onChange
      e.target.value = "";
    },
    [slot.docType, onFileSelect]
  );

  // Uploaded state
  if (slot.doc) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FileThumbnail doc={slot.doc} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white font-body truncate">
              {slot.doc.fileName}
            </p>
            <p className="text-xs text-white/50 font-body">
              {formatFileSize(slot.doc.fileSize)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRemove(slot.docType)}
            className="text-white/40 hover:text-red-400 transition-colors p-1"
            aria-label={`Remove ${slot.label}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Uploading state
  if (slot.uploading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-sm text-white/70 font-body mb-2">Uploading...</p>
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="bg-derby-gradient h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${slot.progress}%` }}
          />
        </div>
        <p className="text-xs text-white/50 font-body mt-1">{slot.progress}%</p>
      </div>
    );
  }

  // Empty drop zone
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
        dragOver
          ? "border-derby-blue-light bg-derby-blue-light/10"
          : "border-white/20 hover:border-white/40"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
      <div className="flex flex-col items-center gap-1 text-center">
        <svg
          className="w-8 h-8 text-white/30"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p className="text-sm text-white/50 font-body">
          Drop file or tap to upload
        </p>
        <p className="text-xs text-white/30 font-body">
          PDF, JPG, PNG &middot; Max 10MB
        </p>
      </div>
      {slot.error && (
        <p className="text-red-400 text-xs font-body mt-2 text-center">
          {slot.error}
        </p>
      )}
    </div>
  );
}

export default function Documents() {
  const { token } = useParams<{ token: string }>();
  const [slots, setSlots] = useState<UploadSlot[]>(() =>
    DOCUMENT_TYPES.map((dt) => ({
      docType: dt.key,
      label: dt.label,
      doc: null,
      uploading: false,
      progress: 0,
      error: null,
    }))
  );
  const [loaded, setLoaded] = useState(false);

  // Load existing documents on mount
  useEffect(() => {
    fetch(`/api/documents/${token}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((docs: DocumentUpload[]) => {
        setSlots((prev) =>
          prev.map((slot) => {
            const existing = docs.find((d) => d.docType === slot.docType);
            return existing ? { ...slot, doc: existing } : slot;
          })
        );
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [token]);

  const updateSlot = useCallback(
    (docType: string, update: Partial<UploadSlot>) => {
      setSlots((prev) =>
        prev.map((s) => (s.docType === docType ? { ...s, ...update } : s))
      );
    },
    []
  );

  const handleFileSelect = useCallback(
    (docType: string, file: File) => {
      // Client-side validation
      if (
        !ALLOWED_MIME_TYPES.includes(
          file.type as (typeof ALLOWED_MIME_TYPES)[number]
        )
      ) {
        updateSlot(docType, {
          error: "Invalid file type. Use PDF, JPG, or PNG.",
        });
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        updateSlot(docType, { error: "File exceeds 10MB limit." });
        return;
      }

      updateSlot(docType, { uploading: true, progress: 0, error: null });

      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionToken", token);
      formData.append("docType", docType);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          updateSlot(docType, { progress: pct });
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const doc: DocumentUpload = JSON.parse(xhr.responseText);
            updateSlot(docType, {
              doc,
              uploading: false,
              progress: 100,
              error: null,
            });
          } catch {
            updateSlot(docType, {
              uploading: false,
              error: "Unexpected response",
            });
          }
        } else {
          let msg = "Upload failed";
          try {
            const err = JSON.parse(xhr.responseText);
            if (err.error) msg = err.error;
          } catch {
            // use default message
          }
          updateSlot(docType, { uploading: false, error: msg });
        }
      });

      xhr.addEventListener("error", () => {
        updateSlot(docType, {
          uploading: false,
          error: "Network error. Please try again.",
        });
      });

      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    },
    [token, updateSlot]
  );

  const handleRemove = useCallback(
    (docType: string) => {
      const slot = slots.find((s) => s.docType === docType);
      if (!slot?.doc) return;

      const docId = slot.doc.id;
      updateSlot(docType, { doc: null });

      fetch(
        `/api/upload?id=${encodeURIComponent(docId)}&sessionToken=${encodeURIComponent(token)}`,
        { method: "DELETE" }
      ).catch(() => {
        // Best-effort deletion; slot is already cleared in UI
      });
    },
    [slots, token, updateSlot]
  );

  const uploadedCount = slots.filter((s) => s.doc !== null).length;
  const anyUploading = slots.some((s) => s.uploading);
  const canAdvance = uploadedCount >= 1 && !anyUploading;

  if (!loaded) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-6 h-6 border-2 border-derby-blue-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-heading text-2xl text-white mb-2">DOCUMENTS</h2>
      <p className="text-white/60 font-body text-sm mb-6">
        Upload at least one document to verify your business. You can add more
        later.
      </p>

      <div className="space-y-4">
        {slots.map((slot) => (
          <div key={slot.docType}>
            <label className="block text-sm text-white/70 font-body mb-1">
              {slot.label}
            </label>
            <UploadZone
              slot={slot}
              onFileSelect={handleFileSelect}
              onRemove={handleRemove}
            />
          </div>
        ))}
      </div>

      <div className="mt-4">
        <p className="text-xs text-white/40 font-body">
          {uploadedCount} of {DOCUMENT_TYPES.length} documents uploaded
        </p>
      </div>

      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
