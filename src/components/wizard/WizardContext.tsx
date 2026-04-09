"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { FormData } from "@/lib/types";

export const STEPS = [
  { number: 1, title: "Welcome" },
  { number: 2, title: "Business Info" },
  { number: 3, title: "Services" },
  { number: 4, title: "Documents" },
  { number: 5, title: "Ad Preferences" },
  { number: 6, title: "Review" },
  { number: 7, title: "Confirmation" },
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

  const completionPercent = Math.round(((currentStep - 1) / (TOTAL_STEPS - 1)) * 100);

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
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}
