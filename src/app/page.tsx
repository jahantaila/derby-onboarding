"use client";

import { WizardProvider } from "@/components/wizard/WizardContext";
import WizardLayout from "@/components/wizard/WizardLayout";
import StepRenderer from "@/components/wizard/StepRenderer";

export default function Home() {
  return (
    <WizardProvider>
      <WizardLayout>
        <StepRenderer />
      </WizardLayout>
    </WizardProvider>
  );
}
