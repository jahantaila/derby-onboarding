"use client";

import { useEffect, useState, useRef } from "react";
import { useWizard, STEPS, TOTAL_STEPS } from "./WizardContext";

function AnimatedPercent({ value }: { value: number }) {
  const [display, setDisplay] = useState(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 400;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(start + diff * eased));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{display}%</>;
}

function StepIcon({ icon, className }: { icon: string; className?: string }) {
  return (
    <svg
      className={className || "w-5 h-5"}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function VerticalStepTracker() {
  const { currentStep, goBack, goNext, completionPercent } = useWizard();
  const nextStep = STEPS.find((s) => s.number === currentStep + 1);
  // Hide tracker on welcome (step 1) and confirmation (step 7)
  const isWizardStep = currentStep > 1 && currentStep < TOTAL_STEPS;

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-[320px] lg:min-w-[320px] bg-white border-r border-gray-200 p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center">
          <span className="text-white font-bold text-sm">D</span>
        </div>
        <span className="text-lg font-heading text-gray-900 tracking-tight uppercase">
          Derby Digital
        </span>
      </div>

      {/* Step list */}
      <div className="flex-1">
        <div className="space-y-1">
          {STEPS.filter((s) => s.number >= 2 && s.number <= 6).map((step) => {
            const isCompleted = step.number < currentStep;
            const isActive = step.number === currentStep;
            const isUpcoming = step.number > currentStep;

            return (
              <div key={step.number} className="flex items-start gap-3 py-3">
                {/* Icon circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                    isCompleted
                      ? "bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white"
                      : isActive
                      ? "bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white ring-2 ring-derby-blue/30 ring-offset-2 ring-offset-white animate-step-pulse"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <span className="animate-icon-pop-in inline-flex"><CheckIcon /></span>
                  ) : (
                    <StepIcon icon={step.icon} className="w-5 h-5" />
                  )}
                </div>
                {/* Label */}
                <div className="pt-0.5">
                  <span
                    className={`text-[11px] font-semibold uppercase tracking-wider ${
                      isActive ? "text-derby-blue" : isCompleted ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Step {step.number - 1}
                  </span>
                  <p
                    className={`text-base font-bold leading-tight ${
                      isActive
                        ? "text-gray-900"
                        : isCompleted
                        ? "text-gray-600"
                        : isUpcoming
                        ? "text-gray-400"
                        : "text-gray-600"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">Progress</span>
            <span className="text-xs font-semibold text-derby-blue"><AnimatedPercent value={completionPercent} /></span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom CTA and navigation */}
      <div className="mt-auto pt-6 space-y-3">
        {isWizardStep && currentStep > 1 && (
          <button
            onClick={goBack}
            className="w-full px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        )}
        {isWizardStep && nextStep && currentStep < 6 && (
          <button
            onClick={goNext}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold text-sm hover:shadow-lg hover:shadow-derby-blue/25 transition-all flex items-center justify-center gap-2 btn-interactive"
          >
            Next: {nextStep.title}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

function MobileStepBar() {
  const { currentStep, completionPercent, goBack } = useWizard();
  const isWizardStep = currentStep > 1 && currentStep < TOTAL_STEPS;

  if (!isWizardStep) return null;

  return (
    <div className="lg:hidden border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <button
              onClick={goBack}
              className="text-gray-400 hover:text-gray-600 transition-colors mr-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span className="text-sm font-medium text-gray-900">
            Step {currentStep - 1} of {TOTAL_STEPS - 2}
          </span>
        </div>
        <span className="text-sm font-semibold text-derby-blue truncate max-w-[140px]">
          {STEPS[currentStep - 1].title}
        </span>
      </div>
      {/* Mini progress bar */}
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-full transition-all duration-500 ease-out"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
    </div>
  );
}

function MobileHeader() {
  const { currentStep } = useWizard();
  const isWizardStep = currentStep > 1 && currentStep < TOTAL_STEPS;

  // Show logo header on welcome and confirmation, or always on mobile above step bar
  if (isWizardStep) return null;

  return (
    <div className="lg:hidden px-4 py-3 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center">
            <span className="text-white font-bold text-xs">D</span>
          </div>
          <span className="text-base font-semibold text-gray-900">Derby Digital</span>
        </div>
        <a
          href="tel:5027026268"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-derby-blue transition-colors"
        >
          <PhoneIcon />
          <span>(502) 702-6268</span>
        </a>
      </div>
    </div>
  );
}

function StepTransition({ children }: { children: React.ReactNode }) {
  const { currentStep, direction } = useWizard();

  return (
    <div
      key={currentStep}
      className={`animate-step-${direction === "forward" ? "in" : "in-reverse"}`}
    >
      {children}
    </div>
  );
}

function WizardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar skeleton */}
      <div className="hidden lg:flex lg:flex-col lg:w-[320px] bg-white border-r border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-lg animate-shimmer" />
          <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full animate-shimmer" />
              <div>
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mb-1" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-2xl animate-shimmer mb-8" />
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const { isRestoring } = useWizard();

  if (isRestoring) return <WizardSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Desktop sidebar */}
      <VerticalStepTracker />

      {/* Mobile header + step bar */}
      <MobileHeader />
      <MobileStepBar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Call us - desktop only, top right */}
        <div className="hidden lg:flex items-center justify-end px-8 py-3 border-b border-gray-100">
          <a
            href="tel:5027026268"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-derby-blue transition-colors"
          >
            <PhoneIcon />
            <span>Call us for help: <span className="font-medium">(502) 702-6268</span></span>
          </a>
        </div>

        {/* Step content */}
        <main className="flex-1 px-4 sm:px-8 lg:px-12 py-6 lg:py-10 overflow-y-auto">
          <div className="max-w-3xl mx-auto">
            <StepTransition>{children}</StepTransition>
          </div>
        </main>
      </div>
    </div>
  );
}
