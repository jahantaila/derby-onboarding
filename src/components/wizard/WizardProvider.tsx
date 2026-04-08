"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { FormData } from "@/lib/types";
import { TOTAL_STEPS } from "@/lib/types";

interface WizardContextValue {
  step: number;
  formData: FormData;
  updateFields: (fields: Partial<FormData>) => void;
  goNext: () => void;
  goBack: () => void;
  direction: number; // 1 = forward, -1 = back (for animation)
  isFirst: boolean;
  isLast: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside WizardProvider");
  return ctx;
}

interface Props {
  token: string;
  initialStep: number;
  initialData: FormData;
  children: React.ReactNode;
}

export default function WizardProvider({
  token,
  initialStep,
  initialData,
  children,
}: Props) {
  const [step, setStep] = useState(initialStep);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [direction, setDirection] = useState(1);

  const updateFields = useCallback((fields: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
  }, []);

  const autoSave = useCallback(
    async (nextStep: number, data: FormData) => {
      try {
        await fetch(`/api/sessions/${token}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ form_data: data, current_step: nextStep }),
        });
      } catch {
        // silent — auto-save is best-effort
      }
    },
    [token]
  );

  const goNext = useCallback(() => {
    if (step >= TOTAL_STEPS - 1) return;
    const nextStep = step + 1;
    setDirection(1);
    setStep(nextStep);
    autoSave(nextStep, formData);
  }, [step, formData, autoSave]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    setDirection(-1);
    setStep(step - 1);
  }, [step]);

  const value = useMemo<WizardContextValue>(
    () => ({
      step,
      formData,
      updateFields,
      goNext,
      goBack,
      direction,
      isFirst: step === 0,
      isLast: step === TOTAL_STEPS - 1,
    }),
    [step, formData, updateFields, goNext, goBack, direction]
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
