"use client";

interface FunnelData {
  new: number;
  in_progress: number;
  active: number;
  new_to_ip_rate: number;
  ip_to_active_rate: number;
}

const STAGES = [
  { key: "new" as const, label: "New", color: "bg-blue-500" },
  { key: "in_progress" as const, label: "In Progress", color: "bg-yellow-500" },
  { key: "active" as const, label: "Active", color: "bg-green-500" },
];

export function ConversionFunnel({ data }: { data: FunnelData }) {
  const max = Math.max(data.new, data.in_progress, data.active, 1);

  return (
    <div className="space-y-3">
      {STAGES.map((stage, i) => {
        const count = data[stage.key];
        const width = Math.max((count / max) * 100, 8);
        return (
          <div key={stage.key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{stage.label}</span>
              <span className="text-sm text-gray-500">{count}</span>
            </div>
            <div className="h-8 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className={`h-full ${stage.color} rounded-lg transition-all duration-700`}
                style={{ width: `${width}%` }}
              />
            </div>
            {i < STAGES.length - 1 && (
              <div className="flex justify-center my-1">
                <span className="text-xs text-gray-400">
                  {i === 0 ? `${data.new_to_ip_rate}%` : `${data.ip_to_active_rate}%`} conversion
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
