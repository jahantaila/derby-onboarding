"use client";

import Checkbox from "@/components/ui/Checkbox";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";
import { SERVICE_OPTIONS } from "@/lib/types";

export default function Services() {
  const { formData, updateFields } = useWizard();

  const selected = formData.services ?? [];

  const toggle = (service: string, checked: boolean) => {
    const next = checked
      ? [...selected, service]
      : selected.filter((s) => s !== service);
    updateFields({ services: next });
  };

  const canAdvance = selected.length > 0;

  return (
    <div>
      <h2 className="font-heading text-2xl text-white mb-2">SERVICES</h2>
      <p className="text-white/60 font-body text-sm mb-6">
        Select all services your business offers.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        {SERVICE_OPTIONS.map((svc) => (
          <Checkbox
            key={svc}
            label={svc}
            checked={selected.includes(svc)}
            onChange={(checked) => toggle(svc, checked)}
          />
        ))}
      </div>
      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
