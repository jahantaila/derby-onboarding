"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

interface ROICalculatorProps {
  monthlyBudget: string | undefined;
  city: string | undefined;
  services: string[] | undefined;
}

const LEAD_RANGES: Record<string, [number, number]> = {
  "500-1000": [15, 25],
  "1000-2500": [30, 60],
  "2500-5000": [60, 120],
  "5000+": [120, 250],
};

function useAnimatedNumber(target: number, duration = 400) {
  const [display, setDisplay] = useState(target);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = display;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return display;
}

export default function ROICalculator({
  monthlyBudget,
  city,
  services,
}: ROICalculatorProps) {
  const prefersReduced = useReducedMotion();
  const range = monthlyBudget ? LEAD_RANGES[monthlyBudget] : null;

  const low = useAnimatedNumber(range ? range[0] : 0);
  const high = useAnimatedNumber(range ? range[1] : 0);

  if (!range) return null;

  const serviceLabel =
    services && services.length > 0 ? services[0] : "home service";
  const locationLabel = city || "your area";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={monthlyBudget}
        initial={prefersReduced ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReduced ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="mt-2 mb-4 rounded-lg border border-derby-blue-light/20 bg-derby-blue-light/5 px-4 py-3"
      >
        <p className="text-sm text-white/80 font-body leading-relaxed">
          {serviceLabel.charAt(0).toUpperCase() + serviceLabel.slice(1)}{" "}
          businesses in {locationLabel} at this budget typically get{" "}
          <span className="font-semibold text-derby-blue-light">
            {low}&ndash;{high} new customer calls
          </span>{" "}
          per month.
        </p>
      </motion.div>
    </AnimatePresence>
  );
}
