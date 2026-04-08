"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/sessions", { method: "POST" });
      const { token } = await res.json();
      router.push(`/onboard/${token}`);
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="font-heading text-4xl sm:text-5xl text-white mb-4">
        WELCOME
      </h2>
      <p className="font-body text-white/80 text-lg max-w-md mb-8">
        Set up your Local Services Ads campaign in just a few steps.
      </p>
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
