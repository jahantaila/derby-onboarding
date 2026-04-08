import SubmissionDetail from "@/components/admin/SubmissionDetail";

export const metadata = {
  title: "Client Detail - Derby Digital Admin",
};

export default function ClientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <SubmissionDetail id={params.id} />;
}
