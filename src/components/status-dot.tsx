import type { ServiceStatusLevel } from "@/lib/types";

const statusColors: Record<ServiceStatusLevel, string> = {
  operational: "bg-status-green",
  degraded_performance: "bg-status-yellow",
  partial_outage: "bg-status-orange",
  major_outage: "bg-status-red",
  unknown: "bg-muted",
};

const statusLabels: Record<ServiceStatusLevel, string> = {
  operational: "Operational",
  degraded_performance: "Degraded",
  partial_outage: "Partial Outage",
  major_outage: "Major Outage",
  unknown: "Unknown",
};

export function StatusDot({
  status,
  size = "sm",
}: {
  status: ServiceStatusLevel;
  size?: "sm" | "md";
}) {
  const dim = size === "md" ? "h-3 w-3" : "h-2 w-2";
  return (
    <span
      className={`inline-block rounded-full ${dim} ${statusColors[status]}`}
      title={statusLabels[status]}
    />
  );
}

export function StatusBadge({ status }: { status: ServiceStatusLevel }) {
  const colorMap: Record<ServiceStatusLevel, string> = {
    operational: "text-status-green",
    degraded_performance: "text-status-yellow",
    partial_outage: "text-status-orange",
    major_outage: "text-status-red",
    unknown: "text-muted",
  };

  return (
    <span className={`text-sm font-medium ${colorMap[status]}`}>
      {statusLabels[status]}
    </span>
  );
}
