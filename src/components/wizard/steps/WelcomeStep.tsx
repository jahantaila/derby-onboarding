"use client";

import { useState } from "react";
import { useWizard } from "../WizardContext";

export default function WelcomeStep() {
  const { goNext, setSessionToken } = useWizard();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");

      const { token } = await res.json();
      localStorage.setItem("derby_session_token", token);
      setSessionToken(token);
      goNext();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-derby-blue/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-derby-blue-deep/8 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-lg">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center mx-auto mb-8 shadow-lg shadow-derby-blue/20">
          <svg
            className="w-10 h-10 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-derby-blue to-derby-blue-deep bg-clip-text text-transparent">
            Derby Digital
          </span>
        </h1>

        <p className="text-lg text-gray-500 mb-10 leading-relaxed">
          Let&apos;s get you dominating your local market. This takes about 5
          minutes.
        </p>

        {/* What you'll need */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-10 text-left shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
            What you&apos;ll need
          </h3>
          <ul className="space-y-3">
            {[
              "Business License",
              "Certificate of Insurance",
              "Government-issued ID",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-gray-700">
                <span className="w-6 h-6 rounded-full bg-derby-blue/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3.5 h-3.5 text-derby-blue"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleStart}
          disabled={loading}
          className="px-10 py-4 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold text-lg hover:shadow-lg hover:shadow-derby-blue/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Creating your session...
            </span>
          ) : (
            "Let's Go"
          )}
        </button>
      </div>
    </div>
  );
}
