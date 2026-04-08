"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useWizard } from "@/components/wizard/WizardProvider";

const TRANSITION_COPY: Record<number, string> = {
  1: "Let's build something great!",
  2: "Business details locked in!",
  3: "Nice -- now let's get to know you.",
  4: "Your territory is set!",
  5: "Services locked -- you're crushing it.",
  6: "Almost done -- just a few uploads.",
  7: "Documents in. Let's review everything.",
};

export default function StepToast() {
  const { step } = useWizard();
  const prefersReduced = useReducedMotion();
  const prevStep = useRef(step);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (prevStep.current !== step && step > prevStep.current) {
      const copy = TRANSITION_COPY[step];
      if (copy) {
        setMessage(copy);
        const timer = setTimeout(() => setMessage(null), 2000);
        prevStep.current = step;
        return () => clearTimeout(timer);
      }
    }
    prevStep.current = step;
  }, [step]);

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
          animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
          exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-body shadow-lg"
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
