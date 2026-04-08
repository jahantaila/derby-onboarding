"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import CalendarBooking from "@/components/CalendarBooking";

const TIMELINE_STEPS = [
  {
    title: "Document Review",
    description: "We verify your business docs within 24 hours",
    daysOffset: 1,
  },
  {
    title: "Profile Setup",
    description: "We configure your ad profile within 48 hours",
    daysOffset: 2,
  },
  {
    title: "Ads Live",
    description: "Your ads start running within 5 business days",
    daysOffset: 5,
  },
];

function addBusinessDays(start: Date, days: number): Date {
  const result = new Date(start);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ThankYouContent({ token }: { token: string }) {
  const prefersReduced = useReducedMotion();
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    setToday(new Date());
  }, []);

  useEffect(() => {
    if (prefersReduced) return;

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    import("canvas-confetti").then((mod) => {
      if (cancelled) return;
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

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [prefersReduced]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* Success icon */}
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

      {/* Heading */}
      <motion.h2
        className="font-heading text-3xl text-white mb-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        YOU&apos;RE IN THE GAME.
      </motion.h2>
      <motion.p
        className="font-body text-white/60 text-lg max-w-md mb-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        Our team is already building your campaign. Here&apos;s what happens
        next:
      </motion.p>

      {/* Calendar booking */}
      <CalendarBooking token={token} />

      {/* Timeline */}
      <motion.div
        className="w-full max-w-sm text-left mb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        {TIMELINE_STEPS.map((step, i) => {
          const isLast = i === TIMELINE_STEPS.length - 1;

          return (
            <motion.div
              key={step.title}
              className="flex gap-4"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.9 + i * 0.15 }}
            >
              {/* Line + dot */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-derby-gradient shrink-0 mt-1.5" />
                {!isLast && (
                  <div className="w-px flex-1 bg-gradient-to-b from-derby-blue-light/60 to-derby-blue-dark/30" />
                )}
              </div>

              {/* Content */}
              <div className={isLast ? "pb-0" : "pb-6"}>
                <p className="font-heading text-sm text-white leading-tight">
                  {step.title}
                </p>
                <p className="font-body text-white/50 text-sm mt-0.5">
                  {step.description}
                </p>
                {today && (
                  <p className="font-body text-derby-blue-light text-xs mt-1">
                    Est. {formatDate(addBusinessDays(today, step.daysOffset))}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Contact section */}
      <motion.div
        className="w-full max-w-sm bg-white/5 border border-white/10 rounded-lg p-5 mb-8 text-left"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 1.3 }}
      >
        <p className="font-heading text-sm text-white/80 mb-3">
          Questions? Reach out directly.
        </p>
        <div className="space-y-2">
          <a
            href="tel:+15551234567"
            className="flex items-center gap-2 font-body text-sm text-derby-blue-light hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            (555) 123-4567
          </a>
          <a
            href="mailto:jahan@derbydigital.us"
            className="flex items-center gap-2 font-body text-sm text-derby-blue-light hover:text-white transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            jahan@derbydigital.us
          </a>
        </div>
      </motion.div>

      {/* Social proof */}
      <motion.p
        className="font-body text-white/40 text-sm mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 1.5 }}
      >
        Join 50+ local businesses already growing with Derby Digital
      </motion.p>

      {/* Derby branding */}
      <motion.div
        className="bg-derby-gradient text-transparent bg-clip-text"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.7 }}
      >
        <span className="font-heading text-xl">DERBY DIGITAL</span>
      </motion.div>
    </div>
  );
}
