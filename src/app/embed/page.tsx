"use client";

import { useEffect } from "react";
import { WizardProvider } from "@/components/wizard/WizardContext";
import WizardLayout from "@/components/wizard/WizardLayout";
import StepRenderer from "@/components/wizard/StepRenderer";

function AutoHeightReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    function reportHeight() {
      const height = document.documentElement.scrollHeight;
      const width = document.documentElement.scrollWidth;
      window.parent.postMessage(
        { type: "derby-onboarding", event: "resize", height, width },
        "*"
      );
    }

    // Report height on load and on changes
    reportHeight();
    const observer = new MutationObserver(reportHeight);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    window.addEventListener("resize", reportHeight);

    // Report periodically for dynamic content
    const interval = setInterval(reportHeight, 500);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", reportHeight);
      clearInterval(interval);
    };
  }, []);

  return null;
}

export default function EmbedPage() {
  return (
    <WizardProvider>
      <AutoHeightReporter />
      <div className="w-full max-w-full overflow-x-hidden">
        <WizardLayout hideHeader>
          <StepRenderer />
        </WizardLayout>
      </div>
    </WizardProvider>
  );
}
