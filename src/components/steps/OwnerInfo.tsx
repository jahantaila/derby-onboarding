"use client";

import { motion, useReducedMotion } from "framer-motion";
import Input from "@/components/ui/Input";
import StepNavigation from "@/components/wizard/StepNavigation";
import { useWizard } from "@/components/wizard/WizardProvider";
import { staggerContainer, staggerItem } from "@/lib/animations";

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function isValidPhone(v: string) {
  const digits = v.replace(/\D/g, "");
  return digits.length >= 7 && /^\+?[\d\s()-]+$/.test(v);
}

export default function OwnerInfo() {
  const { formData, updateFields } = useWizard();
  const prefersReduced = useReducedMotion();

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
      <motion.div
        variants={prefersReduced ? undefined : staggerContainer}
        initial="hidden"
        animate="show"
      >
        <motion.h2
          className="font-heading text-2xl text-white mb-2"
          variants={prefersReduced ? undefined : staggerItem}
        >
          THE PERSON BEHIND THE BRAND
        </motion.h2>
        <motion.p
          className="text-white/60 font-body text-sm mb-6"
          variants={prefersReduced ? undefined : staggerItem}
        >
          So we know who to celebrate when the leads start rolling in.
        </motion.p>
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
          <Input
            label="Full Name"
            placeholder="John Smith"
            required
            value={formData.ownerName ?? ""}
            onChange={(e) => updateFields({ ownerName: e.target.value })}
          />
        </motion.div>
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
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
        </motion.div>
        <motion.div variants={prefersReduced ? undefined : staggerItem}>
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
        </motion.div>
      </motion.div>
      <StepNavigation canAdvance={canAdvance} />
    </div>
  );
}
