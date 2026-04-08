"use client";

import { useWizard } from "./WizardProvider";

const MOMENTUM_COPY = [
  "LET'S GO",
  "KEEP IT COMING",
  "NICE, KEEP GOING",
  "YOU'RE ON FIRE",
  "ALMOST THERE",
  "ONE MORE",
  "REVIEW & LAUNCH",
];

interface Props {
  canAdvance?: boolean;
}

export default function StepNavigation({ canAdvance = true }: Props) {
  const { step, goNext, goBack, isFirst, isLast } = useWizard();

  return (
    <div className="flex justify-between items-center mt-8">
      {!isFirst ? (
        <button
          type="button"
          onClick={goBack}
          className="text-white/60 hover:text-white font-body transition-colors px-4 py-2"
        >
          Back
        </button>
      ) : (
        <div />
      )}
      {!isLast && (
        <button
          type="button"
          onClick={goNext}
          disabled={!canAdvance}
          className="bg-derby-gradient text-white font-body font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {MOMENTUM_COPY[step] ?? "Next"}
        </button>
      )}
    </div>
  );
}
