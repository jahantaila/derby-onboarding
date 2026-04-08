"use client";

import { useWizard } from "@/components/wizard/WizardProvider";

export default function Welcome() {
  const { goNext } = useWizard();

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h2 className="font-heading text-4xl sm:text-5xl text-white mb-4">
        LET&apos;S GET STARTED
      </h2>
      <p className="font-body text-white/80 text-lg max-w-md mb-8">
        We&apos;ll walk you through setting up your Local Services Ads campaign.
        It only takes a few minutes.
      </p>
      <button
        onClick={goNext}
        className="bg-derby-gradient text-white font-body font-semibold px-10 py-4 rounded-lg hover:opacity-90 transition-opacity text-lg"
      >
        Start Setup
      </button>
    </div>
  );
}
