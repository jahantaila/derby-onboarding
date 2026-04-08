"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useWizard } from "./WizardProvider";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
    scale: 0.95,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    opacity: 0,
    scale: 0.95,
  }),
};

const reducedVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

interface Props {
  children: React.ReactNode[];
}

export default function StepRenderer({ children }: Props) {
  const { step, direction } = useWizard();
  const prefersReduced = useReducedMotion();

  return (
    <div className="relative min-h-[400px] overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={prefersReduced ? reducedVariants : variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={
            prefersReduced
              ? { duration: 0.15 }
              : {
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                  duration: 0.35,
                }
          }
          className="w-full"
        >
          {children[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
