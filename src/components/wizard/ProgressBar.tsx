"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useWizard } from "./WizardProvider";
import { TOTAL_STEPS } from "@/lib/types";

export default function ProgressBar() {
  const { step } = useWizard();
  const prefersReduced = useReducedMotion();
  const pct = ((step + 1) / TOTAL_STEPS) * 100;
  const halfwayFired = useRef(false);
  const [showToast, setShowToast] = useState(false);

  // Step index 3 = step 4 of 8 = 50%
  const isHalfway = step === 3;
  // Step index 6 = step 7 of 8
  const isNearEnd = step >= 6;

  useEffect(() => {
    if (isHalfway && !halfwayFired.current) {
      halfwayFired.current = true;
      setShowToast(true);
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isHalfway]);

  return (
    <div className="mb-8 relative">
      <div className="flex justify-between text-sm text-white/60 mb-2 font-body">
        <span>
          Step {step + 1} of {TOTAL_STEPS} &mdash; {Math.round(pct)}% complete
        </span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full relative overflow-hidden"
          initial={false}
          animate={{
            width: `${pct}%`,
            scale: isHalfway && !prefersReduced ? [1, 1.05, 1] : 1,
          }}
          transition={{
            width: { duration: 0.4, ease: "easeOut" },
            scale: { duration: 0.6, ease: "easeInOut" },
          }}
          style={{
            background: isNearEnd
              ? undefined
              : "linear-gradient(135deg, #2093FF, #0026FF)",
          }}
        >
          {isNearEnd ? (
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, #2093FF, #0026FF)",
              }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.4) 50%, transparent 100%)",
                  backgroundSize: "200% 100%",
                  animation: prefersReduced
                    ? "none"
                    : "shimmer 2s linear infinite",
                }}
              />
            </div>
          ) : null}
        </motion.div>
      </div>

      {showToast && (
        <div
          role="status"
          aria-live="polite"
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm text-white font-body whitespace-nowrap animate-fade-in"
        >
          Halfway there!
        </div>
      )}
    </div>
  );
}
