"use client";

import { useEffect, useState } from "react";
import WizardProvider from "@/components/wizard/WizardProvider";
import ProgressBar from "@/components/wizard/ProgressBar";
import StepRenderer from "@/components/wizard/StepRenderer";
import Welcome from "@/components/steps/Welcome";
import BusinessBasics from "@/components/steps/BusinessBasics";
import OwnerInfo from "@/components/steps/OwnerInfo";
import Location from "@/components/steps/Location";
import Services from "@/components/steps/Services";
import OnlinePresence from "@/components/steps/OnlinePresence";
import Documents from "@/components/steps/Documents";
import Confirmation from "@/components/steps/Confirmation";
import type { Session } from "@/lib/types";

export default function EmbedPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function createSession() {
      try {
        const res = await fetch("/api/sessions", { method: "POST" });
        if (!res.ok) throw new Error("Failed to create session");
        const { token } = await res.json();

        const sessionRes = await fetch(`/api/sessions/${token}`);
        if (!sessionRes.ok) throw new Error("Session not found");
        const s: Session = await sessionRes.json();

        if (!cancelled) setSession(s);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        }
      }
    }

    createSession();
    return () => { cancelled = true; };
  }, []);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
        <p className="font-body text-white/60 text-sm">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-8 h-8 border-2 border-derby-blue-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WizardProvider
      token={session.token}
      initialStep={session.current_step}
      initialData={session.form_data}
      embed
    >
      <ProgressBar />
      <StepRenderer>
        <Welcome />
        <BusinessBasics />
        <OwnerInfo />
        <Location />
        <Services />
        <OnlinePresence />
        <Documents />
        <Confirmation />
      </StepRenderer>
    </WizardProvider>
  );
}
