"use client";

import { useWizard } from "./WizardProvider";
import { TOTAL_STEPS } from "@/lib/types";

export default function WizardBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const { step } = useWizard();
  const progress = (step + 1) / TOTAL_STEPS;

  return (
    <div
      style={{
        background: `hsl(${220 + progress * 15}, ${60 + progress * 10}%, ${6 + progress * 4}%)`,
        transition: "background 0.5s ease",
        borderRadius: "0.75rem",
        padding: "1.5rem",
      }}
    >
      {children}
    </div>
  );
}
