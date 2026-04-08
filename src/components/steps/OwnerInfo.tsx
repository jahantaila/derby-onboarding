"use client";

import Input from "@/components/ui/Input";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 && /^\+?[\d\s()-]+$/.test(v);
}

export default function OwnerInfo() {
  const { formData, updateFields } = useWizard();

  const nameOk = Boolean(formData.ownerName?.trim());
  const phoneOk = formData.ownerPhone
    ? isValidPhone(formData.ownerPhone)
    : false;
  const emailOk = formData.ownerEmail
    ? isValidEmail(formData.ownerEmail)
    : false;
  const canAdvance = nameOk && phoneOk && emailOk;

  return (
    <div>
      <h2 className="font-heading text-2xl text-white mb-2">
        THE PERSON BEHIND THE BRAND
      </h2>
      <p className="text-white/60 font-body text-sm mb-6">
        So we know who to celebrate when the leads start rolling in.
      </p>
      <Input
        label="Full Name"
        placeholder="John Smith"
        required
        value={formData.ownerName ?? ""}
        onChange={(e) => updateFields({ ownerName: e.target.value })}
      />
      <Input
        label="Phone Number"
        placeholder="(555) 123-4567"
        type="tel"
        required
        value={formData.ownerPhone ?? ""}
        onChange={(e) => updateFields({ ownerPhone: e.target.value })}
        error={
          formData.ownerPhone && !phoneOk ? "Enter a valid phone number" : undefined
        }
      />
      <Input
        label="Email Address"
        placeholder="john@smithplumbing.com"
        type="email"
        required
        value={formData.ownerEmail ?? ""}
        onChange={(e) => updateFields({ ownerEmail: e.target.value })}
        error={
          formData.ownerEmail && !emailOk ? "Enter a valid email address" : undefined
        }
      />
      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
