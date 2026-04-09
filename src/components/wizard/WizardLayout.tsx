"use client";

import { useWizard, STEPS, TOTAL_STEPS } from "./WizardContext";

function ProgressBar() {
  const { completionPercent, currentStep } = useWizard();

  return (
    <div className="w-full">
      {/* Step indicators */}
      <div className="flex justify-between mb-2">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className={`hidden sm:flex flex-col items-center flex-1 ${
              step.number <= currentStep ? "text-white" : "text-gray-500"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                step.number < currentStep
                  ? "bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white"
                  : step.number === currentStep
                  ? "bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white ring-2 ring-derby-blue/50 ring-offset-2 ring-offset-derby-dark"
                  : "bg-derby-card text-gray-500 border border-gray-700"
              }`}
            >
              {step.number < currentStep ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.number
              )}
            </div>
            <span className="text-xs mt-1 whitespace-nowrap">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Mobile step indicator */}
      <div className="flex sm:hidden items-center justify-between mb-2">
        <span className="text-sm text-gray-400">
          Step {currentStep} of {TOTAL_STEPS}
        </span>
        <span className="text-sm font-medium text-white">
          {STEPS[currentStep - 1].title}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-derby-card rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-derby-blue to-derby-blue-deep rounded-full transition-all duration-500 ease-out"
          style={{ width: `${completionPercent}%` }}
        />
      </div>
      <div className="text-right mt-1">
        <span className="text-xs text-gray-500">{completionPercent}% complete</span>
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

export default function WizardLayout({ children }: { children: React.ReactNode }) {
  const { currentStep, goBack } = useWizard();

  return (
    <div className="min-h-screen bg-derby-dark flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/50 px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <span className="text-lg font-semibold text-white tracking-tight">
              Derby Digital
            </span>
          </div>
          {currentStep > 1 && currentStep < TOTAL_STEPS && (
            <button
              onClick={goBack}
              className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <div className="max-w-4xl mx-auto">
          <ProgressBar />
        </div>
      </div>

      {/* Step Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <StepTransition>{children}</StepTransition>
        </div>
      </main>
    </div>
  );
}
