import ThankYouContent from "./ThankYouContent";

export default async function ThankYouPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = await params;
  return <ThankYouContent token={token} />;
}
