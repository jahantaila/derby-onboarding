"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useWizard } from "./WizardProvider";

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 120 : -120,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -120 : 120,
    opacity: 0,
  }),
};

interface Props {
  children: React.ReactNode[];
}

export default function StepRenderer({ children }: Props) {
  const { step, direction } = useWizard();

  return (
    <div className="relative min-h-[400px] overflow-hidden">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full"
        >
          {children[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
