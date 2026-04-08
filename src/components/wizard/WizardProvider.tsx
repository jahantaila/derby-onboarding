"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
  embed: boolean;
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
  embed?: boolean;
  children: React.ReactNode;
}

function reportHeight() {
  if (typeof window === "undefined" || window.parent === window) return;
  requestAnimationFrame(() => {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: "derby:resize", height }, "*");
  });
  // Fallback for late-rendering content
  setTimeout(() => {
    const height = document.documentElement.scrollHeight;
    window.parent.postMessage({ type: "derby:resize", height }, "*");
  }, 350);
}

export default function WizardProvider({
  token,
  initialStep,
  initialData,
  embed = false,
  children,
}: Props) {
  const [step, setStep] = useState(initialStep);
  const [formData, setFormData] = useState<FormData>(initialData);
  const [direction, setDirection] = useState(1);

  // Report height on step change when embedded
  useEffect(() => {
    if (embed) reportHeight();
  }, [embed, step]);

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
      embed,
    }),
    [step, formData, updateFields, goNext, goBack, direction, embed]
  );

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  );
}
