export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h2 className="font-heading text-4xl sm:text-5xl text-white mb-4">
        WELCOME
      </h2>
      <p className="font-body text-white/80 text-lg max-w-md mb-8">
        Set up your Local Services Ads campaign in just a few steps.
      </p>
      <button className="bg-derby-gradient text-white font-body font-semibold px-8 py-3 rounded-lg hover:opacity-90 transition-opacity">
        Get Started
      </button>
    </div>
  );
}
