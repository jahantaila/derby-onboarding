"use client";

interface StageData {
  status: string;
  avg_days: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-blue-700", bg: "bg-blue-100" },
  in_progress: { label: "In Progress", color: "text-yellow-700", bg: "bg-yellow-100" },
  active: { label: "Active", color: "text-green-700", bg: "bg-green-100" },
};

export function TimeInStage({ data }: { data: StageData[] }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {data.map((d) => {
        const config = STATUS_CONFIG[d.status] || { label: d.status, color: "text-gray-700", bg: "bg-gray-100" };
        return (
          <div key={d.status} className="text-center">
            <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${config.bg} mb-2`}>
              <span className={`text-xl font-bold ${config.color}`}>{d.avg_days}</span>
            </div>
            <p className="text-xs text-gray-500">avg days</p>
            <p className="text-sm font-medium text-gray-700">{config.label}</p>
          </div>
        );
      })}
    </div>
  );
}
