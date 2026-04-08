export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="bg-derby-gradient px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="font-heading text-2xl text-white tracking-wide">
            DERBY DIGITAL
          </h1>
          <span className="text-white/70 text-sm font-body">
            Client Onboarding
          </span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">{children}</main>
    </>
  );
}
