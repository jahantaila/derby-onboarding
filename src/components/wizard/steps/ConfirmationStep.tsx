"use client";

export default function ConfirmationStep() {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-[500px] text-center px-4">
      {/* Animated background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-derby-blue/8 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] bg-derby-blue-deep/8 rounded-full blur-[100px] animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 max-w-lg">
        {/* Animated checkmark */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center mx-auto mb-8 shadow-lg shadow-derby-blue/30 animate-checkmark-pop">
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              className="animate-checkmark-draw"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
              strokeDasharray="30"
              strokeDashoffset="30"
            />
          </svg>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading uppercase mb-4 tracking-tight leading-none">
          <span className="bg-gradient-to-r from-derby-blue to-derby-blue-deep bg-clip-text text-transparent">
            You&apos;re All Set!
          </span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-10">
          Welcome to{" "}
          <span className="bg-gradient-to-r from-derby-blue to-derby-blue-deep bg-clip-text text-transparent font-semibold">
            Derby Digital
          </span>
        </p>

        {/* Next steps — vertical timeline */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 lg:p-10 mb-10 text-left shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-6">
            What happens next
          </h3>
          <div className="relative">
            {[
              {
                number: "1",
                title: "We Review Your Application",
                description: "Our team will review everything within 24 hours.",
              },
              {
                number: "2",
                title: "Set Up Your Google Ads",
                description:
                  "We'll build and launch your campaigns for maximum local reach.",
              },
              {
                number: "3",
                title: "Leads Start Coming In",
                description:
                  "Sit back and watch the calls roll in from customers in your area.",
              },
            ].map((step, idx) => (
              <div key={step.number} className="flex gap-4 relative pb-7 last:pb-0">
                {/* Connecting line */}
                {idx < 2 && (
                  <div className="absolute left-5 top-10 w-0.5 h-[calc(100%-10px)] bg-gradient-to-b from-derby-blue/30 to-derby-blue/10" />
                )}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-derby-blue to-derby-blue-deep flex items-center justify-center flex-shrink-0 relative z-10 shadow-md shadow-derby-blue/20">
                  <span className="text-sm font-bold text-white">
                    {step.number}
                  </span>
                </div>
                <div className="pt-1.5">
                  <h4 className="text-gray-900 font-semibold mb-1">
                    {step.title}
                  </h4>
                  <p className="text-gray-500 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-white/80 border border-gray-200 rounded-2xl p-6 mb-10 shadow-sm">
          <p className="text-gray-500 text-sm mb-3">
            Questions? Reach out anytime.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:5027026268"
              className="flex items-center gap-2 text-derby-blue hover:text-derby-blue-deep transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              (502) 702-6268
            </a>
            <span className="hidden sm:inline text-gray-300">|</span>
            <a
              href="mailto:jahan@derbydigital.us"
              className="flex items-center gap-2 text-derby-blue hover:text-derby-blue-deep transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              jahan@derbydigital.us
            </a>
          </div>
        </div>

        {/* Back to Derby Digital link */}
        <a
          href="https://derbydigital.us"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-derby-blue to-derby-blue-deep text-white font-semibold text-lg hover:shadow-lg hover:shadow-derby-blue/25 transition-all"
        >
          Back to Derby Digital
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    </div>
  );
}
