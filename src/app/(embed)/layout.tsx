export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-transparent overflow-hidden p-4">{children}</div>
  );
}
