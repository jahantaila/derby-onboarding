"use client";

import { useEffect, useCallback } from "react";

interface DocumentWithUrl {
  id: string;
  doc_type: string;
  file_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  signed_url: string | null;
}

interface DocumentLightboxProps {
  doc: DocumentWithUrl;
  docs: DocumentWithUrl[];
  onClose: () => void;
  onNavigate: (doc: DocumentWithUrl) => void;
}

export function DocumentLightbox({ doc, docs, onClose, onNavigate }: DocumentLightboxProps) {
  const currentIndex = docs.findIndex((d) => d.id === doc.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < docs.length - 1;
  const isImage = doc.mime_type.startsWith("image/");
  const isPdf = doc.mime_type === "application/pdf";

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onNavigate(docs[currentIndex - 1]);
      if (e.key === "ArrowRight" && hasNext) onNavigate(docs[currentIndex + 1]);
    },
    [onClose, onNavigate, docs, currentIndex, hasPrev, hasNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] mx-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between bg-black/50 text-white px-4 py-3 rounded-t-xl">
          <span className="text-sm truncate mr-4">{doc.file_name}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {doc.signed_url && (
              <a
                href={doc.signed_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="text-lg px-2 py-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-black/40 rounded-b-xl overflow-auto flex items-center justify-center min-h-[60vh]">
          {isImage && doc.signed_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={doc.signed_url}
              alt={doc.file_name}
              className="max-w-full max-h-[80vh] object-contain"
            />
          )}
          {isPdf && doc.signed_url && (
            <iframe
              src={doc.signed_url}
              className="w-full h-[80vh]"
              title={doc.file_name}
            />
          )}
          {!isImage && !isPdf && (
            <div className="text-center text-white/70 p-8">
              <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">Preview not available for this file type</p>
              {doc.signed_url && (
                <a
                  href={doc.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-derby-blue hover:underline"
                >
                  Download to view
                </a>
              )}
            </div>
          )}
        </div>

        {/* Prev/Next arrows */}
        {hasPrev && (
          <button
            onClick={() => onNavigate(docs[currentIndex - 1])}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full mr-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors hidden sm:block"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {hasNext && (
          <button
            onClick={() => onNavigate(docs[currentIndex + 1])}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors hidden sm:block"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
