import type { ProviderStatus, ServiceStatus, ServiceStatusLevel } from "@/lib/types";
import { StatusDot, StatusBadge } from "./status-dot";
import Image from "next/image";

const STATUS_SEVERITY: Record<ServiceStatusLevel, number> = {
  major_outage: 0,
  partial_outage: 1,
  degraded_performance: 2,
  unknown: 3,
  operational: 4,
};

interface ServiceGroupDef {
  label: string;
  ids: Set<string>;
  featured: Set<string>;
}

// Mapped from https://status.openai.com component IDs
const OPENAI_GROUPS: ServiceGroupDef[] = [
  {
    label: "ChatGPT",
    ids: new Set([
      "01JMXBNJXGV1T5GT2M9XA83XNG", // Conversations
      "01JSFK5QX36ZRW0TW0ZV0ZYFXQ", // GPTs
      "01JMXBNJXGKKP51D4DEJ2HZJ8Q", // Search
      "01JQ7EKW990MSPSWVXC7VPV2ZJ", // Image Generation
      "01JSG1XMJ9RVJJQ0E85NVSJ2AZ", // Agent
      "01JMXCAX0Q10KMN6TADJHQNBSJ", // Login
      "01JMXBNJXGGT5SR5DB9J7GYY48", // Voice mode
      "01JMXBNJXG1YMQPPCPCQX3MPA2", // File uploads
      "01JSYVYQSWMJ9QG35XHP08BHA7", // Deep Research
      "01K6TVGGGDCP0PPGCHXAG3AQX8", // Connectors/Apps
      "01K8C008QVXHA6JX98PAS42VPD", // ChatGPT Atlas
    ]),
    featured: new Set([
      "01JMXBNJXGV1T5GT2M9XA83XNG", // Conversations
      "01JSFK5QX36ZRW0TW0ZV0ZYFXQ", // GPTs
      "01JQ7EKW990MSPSWVXC7VPV2ZJ", // Image Generation
      "01JSG1XMJ9RVJJQ0E85NVSJ2AZ", // Agent
    ]),
  },
  {
    label: "API",
    ids: new Set([
      "01JMXBRMFE6N2NNT7DG6XZQ6PW", // Chat Completions
      "01JP8CD9JR3HR6Y7G4Q75N4DVW", // Responses
      "01JMXBRMFE5ESNNV8JDHVCGSRD", // Batch
      "01JMXBRMFEQW613TFE89F45035", // Realtime
      "01JMXBRMFESJCBGJR10PDD3WCQ", // Files
      "01JMXBRMFEKVBWKK82B44QFMCE", // Audio
      "01JMXBRMFEV0AJ0VVS68N9CD6R", // Embeddings
      "01JMXBRMFEMZK0HPK19RYET250", // Fine-tuning
      "01JMXBRMFEVZ7E0X9GD9FWR9WX", // Moderations
      "01JMXBRMFE4MAP2BHSJNZ787WX", // Images
      "01JMXBNJXG1S2D9V65P1ZZTD94", // Login
      "01JNKS9D9S72PMP1938PVFFQN4", // Compliance API
      "01JVCV8YSWZFRSM1G5CVP253SK", // Codex
    ]),
    featured: new Set([
      "01JMXBRMFE6N2NNT7DG6XZQ6PW", // Chat Completions
      "01JP8CD9JR3HR6Y7G4Q75N4DVW", // Responses
      "01JMXBRMFEKVBWKK82B44QFMCE", // Audio
      "01JMXBRMFE4MAP2BHSJNZ787WX", // Images
    ]),
  },
  {
    label: "Sora",
    ids: new Set([
      "01K9G527YRPY1EFRMHTKB5BKT5", // Sora
      "01JMXCAX0QN2ZHVMS54EEN1HXB", // Video generation
      "01JMXCAX0QM438N5CDG2RMJ07X", // Video viewing
      "01JMXCAX0Q6C4KFTHY65EP0ZB2", // Feed
      "01JQ7EJWA29C5X2B3QW8P9BEFF", // Image Generation
      "01JSM5RTJWHRWDTS6Q604VEW3B", // Login
    ]),
    featured: new Set([
      "01K9G527YRPY1EFRMHTKB5BKT5", // Sora
    ]),
  },
  {
    label: "FedRAMP",
    ids: new Set([
      "01KKAD7C71MCCH3FTREMJH4AAS", // FedRAMP
    ]),
    featured: new Set([
      "01KKAD7C71MCCH3FTREMJH4AAS", // FedRAMP
    ]),
  },
];

const SERVICE_GROUPS: Record<string, ServiceGroupDef[]> = {
  openai: OPENAI_GROUPS,
};

interface RenderedGroup {
  label: string;
  worstStatus: ServiceStatusLevel;
  troubled: ServiceStatus[];
  totalCount: number;
}

function worstOf(services: ServiceStatus[]): ServiceStatusLevel {
  let worst: ServiceStatusLevel = "operational";
  for (const svc of services) {
    if (STATUS_SEVERITY[svc.status] < STATUS_SEVERITY[worst]) {
      worst = svc.status;
    }
  }
  return worst;
}

function buildServiceGroups(
  slug: string,
  services: ServiceStatus[]
): RenderedGroup[] | null {
  const groupDefs = SERVICE_GROUPS[slug];
  if (!groupDefs) return null;

  const claimed = new Set<string>();
  const groups: RenderedGroup[] = [];

  for (const def of groupDefs) {
    const members = services.filter((s) => def.ids.has(s.id));
    members.forEach((s) => claimed.add(s.id));
    if (members.length === 0) continue;

    const troubled = members
      .filter((s) => s.status !== "operational")
      .sort((a, b) => STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status]);

    groups.push({
      label: def.label,
      worstStatus: worstOf(members),
      troubled,
      totalCount: members.length,
    });
  }

  const unclaimed = services.filter((s) => !claimed.has(s.id));
  if (unclaimed.length > 0) {
    const troubled = unclaimed
      .filter((s) => s.status !== "operational")
      .sort((a, b) => STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status]);
    groups.push({
      label: "Other",
      worstStatus: worstOf(unclaimed),
      troubled,
      totalCount: unclaimed.length,
    });
  }

  return groups;
}

function ProbeRow({ probe }: { probe: ProviderStatus["probes"][number] }) {
  const latencyColor = probe.success
    ? probe.latency_ms < 1000
      ? "text-status-green"
      : probe.latency_ms < 3000
        ? "text-status-yellow"
        : "text-status-orange"
    : "text-status-red";

  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${probe.success ? "bg-status-green" : "bg-status-red"}`}
        />
        <span className="text-xs font-medium truncate">{probe.display_name}</span>
        <span className="text-xs text-muted/60 shrink-0">
          {probe.tier === "fast" ? "Fast" : "Flagship"}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {probe.success ? (
          <span className={`font-mono text-xs ${latencyColor}`}>
            {probe.latency_ms}ms
          </span>
        ) : (
          <span
            className="inline-flex items-center gap-1 text-xs text-status-red"
            title={probe.error ?? "Failed"}
          >
            {probe.http_status && (
              <span className="rounded bg-status-red/10 px-1 py-0.5 font-mono text-[10px] font-semibold text-status-red">
                {probe.http_status}
              </span>
            )}
            <span className="truncate max-w-48">
              {probe.error ?? "Failed"}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

function ServiceRow({ svc }: { svc: ServiceStatus }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <StatusDot status={svc.status} />
        <span>{svc.name}</span>
      </div>
    </div>
  );
}

function ServiceList({ provider }: { provider: ProviderStatus }) {
  const groups = buildServiceGroups(provider.slug, provider.services);

  if (groups) {
    return (
      <div className="grid gap-1.5">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="flex items-center gap-2 text-sm">
              <StatusDot status={group.worstStatus} />
              <span className="font-medium">{group.label}</span>
            </div>
            {group.troubled.length > 0 && (
              <div className="ml-4 mt-0.5 grid gap-0.5">
                {group.troubled.map((svc) => (
                  <ServiceRow key={svc.id} svc={svc} />
                ))}
              </div>
            )}
          </div>
        ))}
        <a
          href={provider.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted/60 hover:text-muted transition-colors"
        >
          View all on status page &rarr;
        </a>
      </div>
    );
  }

  const sorted = [...provider.services].sort(
    (a, b) => STATUS_SEVERITY[a.status] - STATUS_SEVERITY[b.status]
  );
  return (
    <div className="grid gap-1">
      {sorted.map((svc) => (
        <ServiceRow key={svc.id} svc={svc} />
      ))}
    </div>
  );
}

export function ProviderCard({
  provider,
  probesLoading = false,
}: {
  provider: ProviderStatus;
  probesLoading?: boolean;
}) {
  const hasProbes = provider.probes.length > 0;
  const hasIncidents = provider.incidents.length > 0;

  return (
    <div className="row-span-4 grid grid-rows-subgrid gap-0 rounded-xl border border-card-border bg-card p-5 transition-shadow hover:shadow-md animate-in fade-in duration-300">
      {/* Row 1: Header */}
      <div className="pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={provider.icon}
            alt={provider.name}
            width={28}
            height={28}
            className="dark:invert"
          />
          <h2 className="text-lg font-semibold">{provider.name}</h2>
        </div>
        <StatusBadge status={provider.overall_status} />
      </div>

      {/* Row 2: Probes */}
      <div className={hasProbes || probesLoading ? "pb-4 space-y-1.5" : ""}>
        {probesLoading ? (
          <>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
              Our Checks
            </h3>
            <div className="grid gap-1.5 animate-pulse">
              <div className="h-3 w-3/4 rounded bg-card-border" />
              <div className="h-3 w-2/3 rounded bg-card-border" />
              <div className="h-3 w-1/2 rounded bg-card-border" />
            </div>
          </>
        ) : hasProbes ? (
          <>
            <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
              Our Checks
            </h3>
            <div className="grid gap-1">
              {provider.probes.map((probe) => (
                <ProbeRow key={probe.model} probe={probe} />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* Row 3: Services */}
      <div className="pb-4 space-y-1.5">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
          Services
        </h3>
        <ServiceList provider={provider} />
      </div>

      {/* Row 4: Incidents / hint */}
      <div>
        {hasIncidents && (
          <div className="space-y-1.5">
            <h3 className="text-xs font-medium uppercase tracking-wide text-status-orange">
              Active Incidents
            </h3>
            <div className="grid gap-2">
              {provider.incidents.map((inc, i) => (
                <div key={`${inc.created_at}-${i}`} className="text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <span>{inc.title}</span>
                    {inc.url && (
                      <a
                        href={inc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-xs text-status-blue hover:underline"
                      >
                        Details
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-muted">
                    {inc.status} &middot;{" "}
                    {new Date(inc.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!hasProbes && !probesLoading && (
          <p className="text-xs text-muted/60 italic">
            No API key configured — showing official status only
          </p>
        )}
      </div>
    </div>
  );
}
