"use client";

import { motion, useReducedMotion } from "framer-motion";
import AdPreview from "@/components/ui/AdPreview";
import Checkbox from "@/components/ui/Checkbox";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";
import { SERVICE_OPTIONS } from "@/lib/types";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function Services() {
  const { formData, updateFields } = useWizard();
  const prefersReduced = useReducedMotion();

  const selected = formData.services ?? [];

  const toggle = (service: string, checked: boolean) => {
    const next = checked
      ? [...selected, service]
      : selected.filter((s) => s !== service);
    updateFields({ services: next });
  };

  const canAdvance = selected.length > 0;

  const subtitle = formData.businessName?.trim()
    ? `Every service ${formData.businessName} offers is another revenue stream we\u2019ll activate.`
    : "Every service you select is another revenue stream we\u2019ll activate.";

  return (
    <div>
      <motion.div
        variants={prefersReduced ? undefined : staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.h2
          className="font-heading text-2xl text-white mb-2"
          variants={prefersReduced ? undefined : staggerItem}
        >
          WHAT YOU DO BEST
        </motion.h2>
        <motion.p
          className="text-white/60 font-body text-sm mb-6"
          variants={prefersReduced ? undefined : staggerItem}
        >
          {subtitle}
        </motion.p>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-x-6"
          variants={prefersReduced ? undefined : staggerItem}
        >
          {SERVICE_OPTIONS.map((svc) => (
            <Checkbox
              key={svc}
              label={svc}
              checked={selected.includes(svc)}
              onChange={(checked) => toggle(svc, checked)}
            />
          ))}
        </motion.div>
      </motion.div>
      <AdPreview />
      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
