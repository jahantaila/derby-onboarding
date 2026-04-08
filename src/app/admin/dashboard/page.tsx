import { Suspense } from "react";
import SubmissionsTable from "@/components/admin/SubmissionsTable";

export const metadata = {
  title: "Dashboard - Derby Digital Admin",
};

export default function DashboardPage() {
  return (
    <div>
      <h2 className="font-heading text-2xl text-white mb-6">SUBMISSIONS</h2>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-derby-blue-light border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SubmissionsTable />
      </Suspense>
    </div>
  );
}
