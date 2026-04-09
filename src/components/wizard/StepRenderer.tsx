"use client";

import { useWizard, STEPS } from "./WizardContext";
import WelcomeStep from "./steps/WelcomeStep";
import BusinessInfoStep from "./steps/BusinessInfoStep";

function StepPlaceholder({ step }: { step: (typeof STEPS)[number] }) {
  const { goNext, goBack, currentStep } = useWizard();
  const isFirst = currentStep === 1;
  const isLast = currentStep === STEPS.length;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center mb-6">
        <span className="text-2xl font-bold text-white">{step.number}</span>
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">{step.title}</h2>
      <p className="text-gray-400 mb-8">This step will be implemented soon.</p>

      <div className="flex gap-4">
        {!isFirst && (
          <button
            onClick={goBack}
            className="px-6 py-3 rounded-xl border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-all"
          >
            Back
          </button>
        )}
        {!isLast && (
          <button
            onClick={goNext}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold hover:shadow-lg hover:shadow-derby-blue/25 transition-all"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}

export default function StepRenderer() {
  const { currentStep } = useWizard();

  if (currentStep === 1) return <WelcomeStep />;
  if (currentStep === 2) return <BusinessInfoStep />;

  const step = STEPS[currentStep - 1];
  return <StepPlaceholder step={step} />;
}
