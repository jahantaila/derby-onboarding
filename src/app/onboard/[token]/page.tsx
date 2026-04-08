"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
import type { Session } from "@/lib/types";

export default function OnboardPage() {
  const { token } = useParams<{ token: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/sessions/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Session not found");
        return r.json();
      })
      .then(setSession)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <h2 className="font-heading text-2xl text-white mb-4">
          SESSION NOT FOUND
        </h2>
        <p className="font-body text-white/60">
          This onboarding link is invalid or has expired.
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-derby-blue-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <WizardProvider
      token={token}
      initialStep={session.current_step}
      initialData={session.form_data}
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
      </StepRenderer>
    </WizardProvider>
  );
}
