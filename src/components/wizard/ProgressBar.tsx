"use client";

import { motion } from "framer-motion";
import { useWizard } from "./WizardProvider";
import { TOTAL_STEPS } from "@/lib/types";

export default function ProgressBar() {
  const { step } = useWizard();
  const pct = ((step + 1) / TOTAL_STEPS) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between text-sm text-white/60 mb-2 font-body">
        <span>
          Step {step + 1} of {TOTAL_STEPS} &mdash; {Math.round(pct)}% complete
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-derby-gradient rounded-full"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
