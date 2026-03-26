export type ServiceStatusLevel =
  | "operational"
  | "degraded_performance"
  | "partial_outage"
  | "major_outage"
  | "unknown";

export interface ServiceStatus {
  id: string;
  name: string;
  status: ServiceStatusLevel;
}

export interface ProbeResult {
  model: string;
  display_name: string;
  tier: "fast" | "flagship";
  success: boolean;
  latency_ms: number;
  http_status: number | null;
  error: string | null;
}

export interface Incident {
  title: string;
  status: string;
  impact: string;
  created_at: string;
  url?: string;
}

export interface ProviderStatus {
  name: string;
  slug: string;
  icon: string;
  url: string;
  fetched_at: string;
  overall_status: ServiceStatusLevel;
  services: ServiceStatus[];
  probes: ProbeResult[];
  incidents: Incident[];
}

export interface StatusData {
  checked_at: string;
  /** Where probes execute (e.g. hosting region); optional human-readable string */
  check_origin?: string;
  providers: ProviderStatus[];
}

export const PROVIDER_SLUGS = ["anthropic", "google", "openai"] as const;
