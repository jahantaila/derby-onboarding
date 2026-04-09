"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { FormData } from "@/lib/types";

export const STEPS = [
  { number: 1, title: "Welcome", icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  { number: 2, title: "Business Info", icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" },
  { number: 3, title: "Services", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
  { number: 4, title: "Documents", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { number: 5, title: "Ad Preferences", icon: "M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" },
  { number: 6, title: "Review", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" },
  { number: 7, title: "Confirmation", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
] as const;

export const TOTAL_STEPS = STEPS.length;

interface WizardContextType {
  currentStep: number;
  formData: FormData;
  sessionToken: string | null;
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
  updateFormData: (data: Partial<FormData>) => void;
  setSessionToken: (token: string) => void;
  completionPercent: number;
  direction: "forward" | "backward";
  isRestoring: boolean;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used within WizardProvider");
  return ctx;
}

export function WizardProvider({ children }: { children: ReactNode }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isRestoring, setIsRestoring] = useState(true);

  const completionPercent = Math.round(((currentStep - 1) / (TOTAL_STEPS - 1)) * 100);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("derby_session_token");
    if (savedToken && !sessionToken) {
      fetch(`/api/sessions/${savedToken}`)
        .then((res) => {
          if (!res.ok) throw new Error("Session not found");
          return res.json();
        })
        .then((session) => {
          setSessionToken(savedToken);
          if (session.form_data) setFormData(session.form_data);
          if (session.current_step > 1) setCurrentStep(session.current_step);
        })
        .catch(() => {
          localStorage.removeItem("derby_session_token");
        })
        .finally(() => {
          setIsRestoring(false);
        });
    } else {
      setIsRestoring(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const goNext = useCallback(() => {
    setDirection("forward");
    setCurrentStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setDirection("backward");
    setCurrentStep((s) => Math.max(s - 1, 1));
  }, []);

  const goToStep = useCallback((step: number) => {
    setDirection(step > currentStep ? "forward" : "backward");
    setCurrentStep(Math.max(1, Math.min(step, TOTAL_STEPS)));
  }, [currentStep]);

  const updateFormData = useCallback((data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  }, []);

  return (
    <WizardContext.Provider
      value={{
        currentStep,
        formData,
        sessionToken,
        goNext,
        goBack,
        goToStep,
        updateFormData,
        setSessionToken,
        completionPercent,
        direction,
        isRestoring,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}
