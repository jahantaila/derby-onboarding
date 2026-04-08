"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useWizard } from "@/components/wizard/WizardProvider";

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}

export default function AdPreview() {
  const { formData } = useWizard();
  const isMobile = useIsMobile();
  const prefersReduced = useReducedMotion();
  const [expanded, setExpanded] = useState(false);

  const name = formData.businessName?.trim() || "Your Business Name";
  const services = formData.services ?? [];
  const city = formData.businessCity?.trim() || "Your City";
  const state = formData.businessState?.trim() || "ST";

  const servicesText =
    services.length === 0
      ? "Your services will appear here"
      : services.length <= 3
        ? services.join(" · ")
        : `${services.slice(0, 3).join(" · ")} +${services.length - 3} more`;

  const stars = Array.from({ length: 5 }, (_, i) => (
    <svg
      key={i}
      className="w-4 h-4"
      viewBox="0 0 20 20"
      fill={i < 5 ? "#FFD700" : "#374151"}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ));

  const cardContent = (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <p className="text-white/60 text-xs uppercase tracking-wider font-body mb-3">
        Your Ad Preview
      </p>
      <div className="bg-white rounded-lg p-4 text-gray-900">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="bg-green-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            &#10003; Derby Verified
          </span>
        </div>
        <motion.p
          className="font-bold text-lg truncate"
          layout={!prefersReduced}
        >
          {name}
        </motion.p>
        <div className="flex items-center gap-1 mt-1">
          <div className="flex">{stars}</div>
          <span className="text-sm text-gray-500 ml-1">4.8</span>
        </div>
        <motion.p
          className="text-sm text-gray-600 mt-2"
          layout={!prefersReduced}
        >
          {servicesText}
        </motion.p>
        <p className="text-sm text-gray-500 mt-1">
          {city}, {state}
        </p>
        <div className="mt-3">
          <span className="inline-block bg-derby-blue text-white rounded-full px-4 py-2 text-sm font-body">
            Get a Free Quote
          </span>
        </div>
      </div>
      <p className="text-white/40 text-xs font-body mt-3 text-center">
        This is how customers will find you online.
      </p>
    </div>
  );

  if (isMobile) {
    return (
      <div className="mt-4 mb-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-derby-blue-light font-body flex items-center gap-1"
        >
          Preview Your Ad {expanded ? "▲" : "▼"}
        </button>
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={prefersReduced ? undefined : { opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-2"
            >
              {cardContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div
      className="mt-4 mb-2"
      initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {cardContent}
    </motion.div>
  );
}
