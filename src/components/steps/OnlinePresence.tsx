"use client";

import { motion, useReducedMotion } from "framer-motion";
import Input from "@/components/ui/Input";
import ROICalculator from "@/components/ui/ROICalculator";
import Select from "@/components/ui/Select";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";
import { BUDGET_OPTIONS } from "@/lib/types";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function OnlinePresence() {
  const { formData, updateFields } = useWizard();
  const prefersReduced = useReducedMotion();

  const canAdvance = Boolean(formData.monthlyBudget);

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
          YOUR DIGITAL FOOTPRINT
        </motion.h2>
        <motion.p
          className="text-white/60 font-body text-sm mb-6"
          variants={prefersReduced ? undefined : staggerItem}
        >
          We&apos;ll connect you to customers searching for your services right now.
        </motion.p>
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Input
            label="Google Business Email"
            placeholder="you@gmail.com"
            type="email"
            value={formData.googleEmail ?? ""}
            onChange={(e) => updateFields({ googleEmail: e.target.value })}
          />
        </motion.div>
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Input
            label="Website URL (optional)"
            placeholder="https://www.yoursite.com"
            type="url"
            value={formData.websiteUrl ?? ""}
            onChange={(e) => updateFields({ websiteUrl: e.target.value })}
          />
        </motion.div>
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Select
            label="Monthly Ad Budget"
            options={BUDGET_OPTIONS as unknown as { label: string; value: string }[]}
            required
            value={formData.monthlyBudget ?? ""}
            onChange={(e) => updateFields({ monthlyBudget: e.target.value })}
          />
          <ROICalculator
            monthlyBudget={formData.monthlyBudget}
            city={formData.businessCity}
            services={formData.services}
          />
        </motion.div>
      </motion.div>
      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
