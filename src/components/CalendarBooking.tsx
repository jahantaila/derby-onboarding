"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";

const CALENDAR_URL = process.env.NEXT_PUBLIC_CALENDAR_EMBED_URL ?? "";
const LOAD_TIMEOUT_MS = 5_000;

function getCalendarDomain(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "";
  }
}

type EmbedType = "cal" | "calendly" | "iframe";

function detectEmbed(url: string): EmbedType {
  if (url.includes("cal.com")) return "cal";
  if (url.includes("calendly.com")) return "calendly";
  return "iframe";
}

export default function CalendarBooking({ token }: { token: string }) {
  const [booked, setBooked] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const bookedRef = useRef(false);

  const recordBooking = useCallback(() => {
    if (bookedRef.current) return;
    bookedRef.current = true;
    setBooked(true);
    // Best-effort — the booking already happened in the vendor system
    fetch(`/api/sessions/${encodeURIComponent(token)}/booking`, {
      method: "PATCH",
    }).catch(() => {});
  }, [token]);

  const onScriptReady = useCallback(() => setScriptLoaded(true), []);
  const onScriptError = useCallback(() => setLoadFailed(true), []);

  // postMessage listener for booking confirmation
  useEffect(() => {
    if (!CALENDAR_URL) return;
    const expectedOrigin = getCalendarDomain(CALENDAR_URL);
    if (!expectedOrigin) return;
    const embedType = detectEmbed(CALENDAR_URL);

    function handleMessage(event: MessageEvent) {
      if (event.origin !== expectedOrigin) return;

      if (embedType === "cal") {
        // Cal.com fires: { data: { type: "cal:bookingSuccessful", ... } }
        const payload = event.data;
        if (
          payload?.data?.type === "cal:bookingSuccessful" ||
          payload?.type === "cal:bookingSuccessful"
        ) {
          recordBooking();
        }
      } else if (embedType === "calendly") {
        // Calendly fires: { event: "calendly.event_scheduled" }
        if (event.data?.event === "calendly.event_scheduled") {
          recordBooking();
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [recordBooking]);

  // Load timeout: if vendor script hasn't loaded within timeout, show fallback
  useEffect(() => {
    if (!CALENDAR_URL || scriptLoaded || loadFailed) return;
    const embedType = detectEmbed(CALENDAR_URL);
    if (embedType === "iframe") return;
    const timer = setTimeout(() => {
      if (!scriptLoaded) setLoadFailed(true);
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [scriptLoaded, loadFailed]);

  // No calendar configured — show fallback CTA
  if (!CALENDAR_URL) {
    return <FallbackCTA />;
  }

  // Booking confirmed
  if (booked) {
    return (
      <motion.div
        className="w-full max-w-sm bg-green-500/10 border border-green-500/20 rounded-lg p-5 mb-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
          <svg
            className="w-5 h-5 text-green-400"
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
        </div>
        <p className="font-heading text-sm text-white">KICKOFF SCHEDULED!</p>
        <p className="font-body text-white/50 text-xs mt-1">
          Check your email for confirmation details.
        </p>
      </motion.div>
    );
  }

  // Embed load failed — show fallback
  if (loadFailed) {
    return <FallbackCTA />;
  }

  const embedType = detectEmbed(CALENDAR_URL);

  return (
    <motion.div
      className="w-full max-w-sm mb-8"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    >
      <p className="font-heading text-sm text-white/80 mb-3 text-center">
        Schedule your kickoff call
      </p>
      <div
        className="w-full rounded-lg overflow-hidden border border-white/10 bg-white"
        style={{ minHeight: 400 }}
      >
        {embedType === "cal" && (
          <CalEmbed url={CALENDAR_URL} onReady={onScriptReady} onError={onScriptError} />
        )}
        {embedType === "calendly" && (
          <CalendlyEmbed url={CALENDAR_URL} onReady={onScriptReady} onError={onScriptError} />
        )}
        {embedType === "iframe" && <IframeEmbed url={CALENDAR_URL} />}
      </div>
    </motion.div>
  );
}

function CalEmbed({
  url,
  onReady,
  onError,
}: {
  url: string;
  onReady: () => void;
  onError: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.cal.com/embed/embed.js";
    script.async = true;
    script.onload = () => {
      onReady();
      // @ts-expect-error Cal is injected by the embed script
      if (typeof window.Cal === "function") {
        // @ts-expect-error Cal is injected by the embed script
        window.Cal("inline", {
          elementOrSelector: ref.current,
          calLink: url.replace(/^https?:\/\/cal\.com\//, ""),
          layout: "month_view",
        });
      }
    };
    script.onerror = onError;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [url, onReady, onError]);

  return <div ref={ref} style={{ width: "100%", minHeight: 400 }} />;
}

function CalendlyEmbed({
  url,
  onReady,
  onError,
}: {
  url: string;
  onReady: () => void;
  onError: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => {
      onReady();
      // @ts-expect-error Calendly is injected by the widget script
      if (typeof window.Calendly?.initInlineWidget === "function") {
        // @ts-expect-error Calendly is injected by the widget script
        window.Calendly.initInlineWidget({
          url,
          parentElement: ref.current,
        });
      }
    };
    script.onerror = onError;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [url, onReady, onError]);

  return <div ref={ref} style={{ width: "100%", minHeight: 400 }} />;
}

function IframeEmbed({ url }: { url: string }) {
  return (
    <iframe
      src={url}
      title="Schedule your kickoff call"
      style={{ width: "100%", minHeight: 400, border: "none" }}
      allow="payment"
    />
  );
}

function FallbackCTA() {
  return (
    <motion.div
      className="w-full max-w-sm bg-white/5 border border-white/10 rounded-lg p-5 mb-8 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.7 }}
    >
      <div className="w-10 h-10 rounded-full bg-derby-blue-light/20 flex items-center justify-center mx-auto mb-3">
        <svg
          className="w-5 h-5 text-derby-blue-light"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="font-heading text-sm text-white">KICKOFF CALL</p>
      <p className="font-body text-white/50 text-sm mt-1">
        We&apos;ll reach out within 24 hours to schedule your kickoff call.
      </p>
    </motion.div>
  );
}
