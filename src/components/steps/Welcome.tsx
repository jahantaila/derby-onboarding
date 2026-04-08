"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useWizard } from "@/components/wizard/WizardProvider";
import { staggerContainer, staggerItem } from "@/lib/animations";

export default function Welcome() {
  const { goNext } = useWizard();
  const prefersReduced = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-[400px] text-center"
      variants={prefersReduced ? undefined : staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.h2
        className="font-heading text-4xl sm:text-5xl text-white mb-4"
        variants={prefersReduced ? undefined : staggerItem}
      >
        YOU&apos;RE IN.
      </motion.h2>
      <motion.p
        className="font-body text-white/80 text-lg max-w-md mb-8"
        variants={prefersReduced ? undefined : staggerItem}
      >
        Welcome to the fastest way to fill your calendar with high-value local
        jobs.
      </motion.p>
      <motion.button
        onClick={goNext}
        className="bg-derby-gradient text-white font-body font-semibold px-10 py-4 rounded-lg hover:opacity-90 transition-opacity text-lg"
        variants={prefersReduced ? undefined : staggerItem}
        whileHover={prefersReduced ? undefined : { scale: 1.02, boxShadow: "0 0 20px rgba(32,147,255,0.3)" }}
        whileTap={prefersReduced ? undefined : { scale: 0.98 }}
      >
        Let&apos;s Go
      </motion.button>
    </motion.div>
  );
}
