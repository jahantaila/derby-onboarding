"use client";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";
import { BUDGET_OPTIONS } from "@/lib/types";

export default function OnlinePresence() {
  const { formData, updateFields } = useWizard();

  const canAdvance = Boolean(formData.monthlyBudget);

  return (
    <div>
      <h2 className="font-heading text-2xl text-white mb-2">
        YOUR DIGITAL FOOTPRINT
      </h2>
      <p className="text-white/60 font-body text-sm mb-6">
        We&apos;ll connect you to customers searching for your services right now.
      </p>
      <Input
        label="Google Business Email"
        placeholder="you@gmail.com"
        type="email"
        value={formData.googleEmail ?? ""}
        onChange={(e) => updateFields({ googleEmail: e.target.value })}
      />
      <Input
        label="Website URL (optional)"
        placeholder="https://www.yoursite.com"
        type="url"
        value={formData.websiteUrl ?? ""}
        onChange={(e) => updateFields({ websiteUrl: e.target.value })}
      />
      <Select
        label="Monthly Ad Budget"
        options={BUDGET_OPTIONS as unknown as { label: string; value: string }[]}
        required
        value={formData.monthlyBudget ?? ""}
        onChange={(e) => updateFields({ monthlyBudget: e.target.value })}
      />
      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
