"use client";

import Input from "@/components/ui/Input";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";

export default function BusinessBasics() {
  const { formData, updateFields } = useWizard();

  const canAdvance = Boolean(formData.businessName?.trim());

  return (
    <div>
      <h2 className="font-heading text-2xl text-white mb-6">
        BUSINESS BASICS
      </h2>
      <Input
        label="Business Name"
        placeholder="e.g. Smith Plumbing Co."
        required
        value={formData.businessName ?? ""}
        onChange={(e) => updateFields({ businessName: e.target.value })}
      />
      <Input
        label="Years in Business"
        placeholder="e.g. 5"
        type="number"
        min="0"
        value={formData.yearsInBusiness ?? ""}
        onChange={(e) => updateFields({ yearsInBusiness: e.target.value })}
      />
      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
