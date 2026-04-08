"use client";

import { motion, useReducedMotion } from "framer-motion";
import Input from "@/components/ui/Input";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function BusinessBasics() {
  const { formData, updateFields } = useWizard();
  const prefersReduced = useReducedMotion();

  const canAdvance = Boolean(formData.businessName?.trim());

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
          TELL US ABOUT YOUR BUSINESS
        </motion.h2>
        <motion.p
          className="text-white/60 font-body text-sm mb-6"
          variants={prefersReduced ? undefined : staggerItem}
        >
          We&apos;re building your presence from the ground up.
        </motion.p>
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Input
            label="Business Name"
            placeholder="e.g. Smith Plumbing Co."
            required
            value={formData.businessName ?? ""}
            onChange={(e) => updateFields({ businessName: e.target.value })}
          />
        </motion.div>
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Input
            label="Years in Business"
            placeholder="e.g. 5"
            type="number"
            min="0"
            value={formData.yearsInBusiness ?? ""}
            onChange={(e) => updateFields({ yearsInBusiness: e.target.value })}
          />
        </motion.div>
      </motion.div>
      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
