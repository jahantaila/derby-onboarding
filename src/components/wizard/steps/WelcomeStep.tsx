"use client";

import { useState } from "react";
import { useWizard, STEPS } from "../WizardContext";

const STEP_PREVIEW = STEPS.filter(
  (s) => s.number >= 2 && s.number <= 6
).map((s) => ({ title: s.title, icon: s.icon }));

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
    <div className="flex flex-col items-center justify-center min-h-[600px] text-center px-4 relative">
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-derby-blue/6 rounded-full blur-[150px] animate-mesh-slow" />
        <div className="absolute bottom-1/3 left-1/4 w-[500px] h-[500px] bg-derby-blue-deep/5 rounded-full blur-[120px] animate-mesh-medium" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-derby-blue/4 rounded-full blur-[100px] animate-mesh-fast" />
      </div>

      <div className="relative z-10 max-w-2xl">
        {/* Derby Digital logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center shadow-lg shadow-derby-blue/20">
            <svg
              className="w-7 h-7 text-white"
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
          <span className="text-2xl font-heading uppercase tracking-wide text-gray-900">
            Derby Digital
          </span>
        </div>

        {/* Gradient headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading uppercase leading-none tracking-tight mb-6">
          <span className="bg-gradient-to-r from-derby-blue to-derby-blue-deep bg-clip-text text-transparent">
            Let&apos;s Get You
          </span>
          <br />
          <span className="text-gray-900">More Leads</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-gray-500 mb-10 leading-relaxed max-w-lg mx-auto">
          Fill out this quick form and our team will set up your Google ads
          within <span className="text-gray-700 font-semibold">48 hours</span>.
          Takes about <span className="text-gray-700 font-semibold">5 minutes</span>.
        </p>

        {/* Step preview */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-8 text-left shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
            Here&apos;s what we&apos;ll cover
          </h3>
          <div className="space-y-3">
            {STEP_PREVIEW.map((step, i) => (
              <div key={step.title} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-derby-blue/10 to-derby-blue-deep/10 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-derby-blue"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={step.icon}
                    />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">
                  <span className="text-gray-400 text-sm mr-2">{i + 1}.</span>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Social proof */}
        <p className="text-sm text-gray-400 mb-8 flex items-center justify-center gap-2">
          <span className="flex -space-x-1">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className="w-4 h-4 text-amber-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </span>
          Trusted by 50+ local businesses
        </p>

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        {/* CTA button */}
        <button
          onClick={handleStart}
          disabled={loading}
          className="px-12 py-4 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold text-lg hover:shadow-xl hover:shadow-derby-blue/25 hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
            "Get Started →"
          )}
        </button>
      </div>
    </div>
  );
}
