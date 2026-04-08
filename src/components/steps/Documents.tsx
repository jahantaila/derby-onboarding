"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import StepNavigation from "@/components/wizard/StepNavigation";
import {
  ALLOWED_MIME_TYPES,
  DOCUMENT_TYPES,
  MAX_FILE_SIZE,
  type DocumentUpload,
} from "@/lib/types";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface UploadSlot {
  docType: string;
  label: string;
  doc: DocumentUpload | null;
  uploading: boolean;
  progress: number;
  error: string | null;
  previewUrl: string | null;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function resizeImage(file: File, maxWidth = 2048): Promise<File> {
  if (!file.type.startsWith("image/")) return Promise.resolve(file);
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width <= maxWidth) {
        resolve(file);
        return;
      }
      const scale = maxWidth / img.width;
      const canvas = document.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          resolve(
            blob
              ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
                  type: "image/jpeg",
                })
              : file
          );
        },
        "image/jpeg",
        0.85
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(file);
    };
    img.src = URL.createObjectURL(file);
  });
}

function FileThumbnail({
  doc,
  previewUrl,
}: {
  doc: DocumentUpload;
  previewUrl: string | null;
}) {
  if (previewUrl) {
    return (
      <div className="w-12 h-12 rounded bg-white/10 overflow-hidden">
        <img
          src={previewUrl}
          alt={doc.fileName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
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
  isMobile,
  onFileSelect,
  onRemove,
}: {
  slot: UploadSlot;
  isMobile: boolean;
  onFileSelect: (docType: string, file: File) => void;
  onRemove: (docType: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
      e.target.value = "";
    },
    [slot.docType, onFileSelect]
  );

  // Uploaded state
  if (slot.doc) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <FileThumbnail doc={slot.doc} previewUrl={slot.previewUrl} />
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

  // Mobile: split into Take Photo + Choose File buttons
  if (isMobile) {
    return (
      <div className="space-y-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-derby-blue/20 border border-derby-blue-light/30 rounded-lg px-4 py-3 text-derby-blue-light hover:bg-derby-blue/30 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <circle cx="12" cy="13" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
          </svg>
          <span className="text-sm font-body">Take Photo</span>
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border border-white/20 rounded-lg px-4 py-3 text-white/50 hover:border-white/40 hover:text-white/70 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm font-body">Choose File</span>
        </button>
        {slot.error && (
          <p className="text-red-400 text-xs font-body mt-1 text-center">
            {slot.error}
          </p>
        )}
      </div>
    );
  }

  // Desktop: drop zone (unchanged)
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-4 cursor-pointer transition-colors ${
        dragOver
          ? "border-derby-blue-light bg-derby-blue-light/10"
          : "border-white/20 hover:border-white/40"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp,image/*"
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
          Drop file or click to upload
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
  const prefersReduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [slots, setSlots] = useState<UploadSlot[]>(() =>
    DOCUMENT_TYPES.map((dt) => ({
      docType: dt.key,
      label: dt.label,
      doc: null,
      uploading: false,
      progress: 0,
      error: null,
      previewUrl: null,
    }))
  );
  const [loaded, setLoaded] = useState(false);

  // Mobile detection via pointer: coarse
  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
  }, []);

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

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      setSlots((prev) => {
        for (const slot of prev) {
          if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        }
        return prev;
      });
    };
  }, []);

  const updateSlot = useCallback(
    (docType: string, update: Partial<UploadSlot>) => {
      setSlots((prev) =>
        prev.map((s) => (s.docType === docType ? { ...s, ...update } : s))
      );
    },
    []
  );

  const handleFileSelect = useCallback(
    async (docType: string, file: File) => {
      // Client-side type validation
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

      // Resize images client-side before upload
      const processed = await resizeImage(file);

      // Size check after resize (resize may reduce size)
      if (processed.size > MAX_FILE_SIZE) {
        updateSlot(docType, { error: "File exceeds 10MB limit." });
        return;
      }

      // Generate preview URL for image files
      const previewUrl = processed.type.startsWith("image/")
        ? URL.createObjectURL(processed)
        : null;

      updateSlot(docType, { uploading: true, progress: 0, error: null, previewUrl });

      const formData = new FormData();
      formData.append("file", processed);
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

      // Clean up preview URL
      if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
      updateSlot(docType, { doc: null, previewUrl: null });

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
      <motion.div
        variants={prefersReduced ? undefined : staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.h2
          className="font-heading text-2xl text-white mb-2"
          variants={prefersReduced ? undefined : staggerItem}
        >
          ALMOST THERE
        </motion.h2>
        <motion.p
          className="text-white/60 font-body text-sm mb-6"
          variants={prefersReduced ? undefined : staggerItem}
        >
          A few quick uploads to verify your business &mdash; we handle the rest.
        </motion.p>

        <div className="space-y-4">
          {slots.map((slot) => (
            <motion.div key={slot.docType} variants={prefersReduced ? undefined : staggerItem}>
              <label className="block text-sm text-white/70 font-body mb-1">
                {slot.label}
              </label>
              <UploadZone
                slot={slot}
                isMobile={isMobile}
                onFileSelect={handleFileSelect}
                onRemove={handleRemove}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="mt-4">
        <p className="text-xs text-white/40 font-body">
          {uploadedCount} of {DOCUMENT_TYPES.length} documents uploaded
        </p>
      </div>

      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
