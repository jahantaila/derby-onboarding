"use client";

export default function ThankYouPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
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
      </div>
      <h2 className="font-heading text-3xl text-white mb-4">
        WE GOT EVERYTHING.
      </h2>
      <p className="font-body text-white/60 text-lg max-w-md">
        Our team will reach out within 24 hours to kick things off.
      </p>
      <div className="mt-8 bg-derby-gradient text-transparent bg-clip-text">
        <span className="font-heading text-xl">DERBY DIGITAL</span>
      </div>
    </div>
  );
}
