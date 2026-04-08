"use client";

import { useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function ThankYouPage() {
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (prefersReduced) return;

    let timeout: ReturnType<typeof setTimeout>;

    import("canvas-confetti").then((mod) => {
      const confetti = mod.default;
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#2093FF", "#0026FF", "#FFD700", "#FFFFFF"],
      });

      timeout = setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.5 },
          colors: ["#2093FF", "#0026FF", "#FFD700", "#FFFFFF"],
        });
      }, 1500);
    });

    return () => clearTimeout(timeout);
  }, [prefersReduced]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <motion.div
        className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
      >
        <svg
          className="w-8 h-8 text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>
      <motion.h2
        className="font-heading text-3xl text-white mb-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        YOU&apos;RE IN THE GAME.
      </motion.h2>
      <motion.p
        className="font-body text-white/60 text-lg max-w-md"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        Our team is already building your campaign. Expect a call within 24
        hours.
      </motion.p>
      <motion.div
        className="mt-8 bg-derby-gradient text-transparent bg-clip-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <span className="font-heading text-xl">DERBY DIGITAL</span>
      </motion.div>
    </div>
  );
}
