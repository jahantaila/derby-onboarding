"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      if (!res.ok) throw new Error("Failed to create session");
      const { token } = await res.json();
      router.push(`/onboard/${token}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="font-heading text-4xl sm:text-5xl text-white mb-4">
        WELCOME
      </h2>
      <p className="font-body text-white/80 text-lg max-w-md mb-8">
        Fill your calendar with high-value local jobs in just a few steps.
      </p>
      {error && (
        <p className="text-red-400 font-body text-sm mb-4">{error}</p>
      )}
      <button
        onClick={handleStart}
        disabled={loading}
        className="bg-derby-gradient text-white font-body font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? "Creating session…" : "Get Started"}
      </button>
    </div>
  );
}
