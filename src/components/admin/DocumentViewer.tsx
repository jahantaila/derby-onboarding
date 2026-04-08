"use client";

import { useState } from "react";

interface Doc {
  id: string;
  doc_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  signed_url: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  business_license: "Business License",
  insurance: "Insurance Certificate",
  utility_bill: "Utility Bill",
  gov_id: "Government ID",
};

export default function DocumentViewer({ documents }: { documents: Doc[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (documents.length === 0) {
    return (
      <p className="text-white/40 text-sm font-body">
        No documents uploaded
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {documents.map((doc) => {
        const isImage = doc.mime_type.startsWith("image/");
        const label = TYPE_LABELS[doc.doc_type] ?? doc.doc_type;

        return (
          <div
            key={doc.id}
            className="border border-white/10 rounded-lg overflow-hidden bg-white/5"
          >
            {doc.signed_url ? (
              isImage ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded(expanded === doc.id ? null : doc.id)
                    }
                    className="w-full aspect-square bg-black/20 flex items-center justify-center overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={doc.signed_url}
                      alt={label}
                      className="max-w-full max-h-full object-contain"
                    />
                  </button>
                  {expanded === doc.id && (
                    <div
                      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
                      onClick={() => setExpanded(null)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={doc.signed_url}
                        alt={label}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  )}
                </>
              ) : (
                <a
                  href={doc.signed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full aspect-square bg-black/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </a>
              )
            ) : (
              <div className="w-full aspect-square bg-black/20 flex items-center justify-center text-white/30 text-sm font-body">
                File unavailable
              </div>
            )}
            <div className="px-3 py-2">
              <p className="text-white text-sm font-body font-semibold truncate">
                {label}
              </p>
              <p className="text-white/40 text-xs font-body truncate">
                {doc.file_name}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
