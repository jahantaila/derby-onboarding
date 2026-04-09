"use client";

import { useState } from "react";
import { useWizard } from "../WizardContext";
import Image from "next/image";

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
      </div>

      <div className="relative z-10 max-w-2xl">
        {/* Derby Digital logo */}
        <div className="flex items-center justify-center mb-10">
          <Image src="/logo.png" alt="Derby Digital" width={220} height={60} className="h-14 w-auto" />
        </div>

        {/* Gradient headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading uppercase leading-none tracking-tight mb-6">
          <span className="bg-gradient-to-r from-derby-blue to-derby-blue-deep bg-clip-text text-transparent">
            Let&apos;s Set Up
          </span>
          <br />
          <span className="text-gray-900">Your Google Ads</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg sm:text-xl text-gray-500 mb-10 leading-relaxed max-w-lg mx-auto">
          Fill out this quick form and our team will build your{" "}
          <span className="text-gray-700 font-semibold">custom landing page</span>{" "}
          and launch your{" "}
          <span className="text-gray-700 font-semibold">Google Ads campaign</span>{" "}
          within <span className="text-gray-700 font-semibold">2 to 3 weeks</span>.
          Takes about <span className="text-gray-700 font-semibold">5 minutes</span>.
        </p>

        {/* What we'll do */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 mb-8 text-left shadow-sm">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
            What you&apos;ll get
          </h3>
          <div className="space-y-3">
            {[
              { icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z", text: "Google Ads campaign targeting your service area" },
              { icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", text: "Custom landing page built for lead conversion" },
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "Google Business Profile verification assistance" },
              { icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", text: "Exclusive leads directly to your phone" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-derby-blue/10 to-derby-blue-deep/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-derby-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline note */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 text-left">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-derby-blue">Timeline:</span> After you submit this form, we'll have your landing page and ads ready to launch in{" "}
            <span className="font-semibold">2 to 3 weeks</span>. You'll start seeing leads shortly after.
          </p>
        </div>

        {/* Social proof */}
        <p className="text-sm text-gray-400 mb-8 flex items-center justify-center gap-2">
          <span className="flex -space-x-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </span>
          Trusted by 50+ local businesses
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        <button
          onClick={handleStart}
          disabled={loading}
          className="px-12 py-4 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold text-lg hover:shadow-xl hover:shadow-derby-blue/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed btn-interactive"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
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
