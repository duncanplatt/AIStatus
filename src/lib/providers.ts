import type {
  ProviderStatus,
  ServiceStatus,
  ServiceStatusLevel,
  Incident,
  ProbeResult,
} from "./types";

// ---------------------------------------------------------------------------
// Statuspage.io helper (shared by OpenAI and Anthropic)
// ---------------------------------------------------------------------------

interface StatuspageComponent {
  id: string;
  name: string;
  status: string;
  group: boolean;
}

interface StatuspageIncident {
  name: string;
  status: string;
  impact: string;
  created_at: string;
  shortlink?: string;
}

interface StatuspageSummary {
  status: { indicator: string };
  components: StatuspageComponent[];
  incidents: StatuspageIncident[];
}

function normalizeStatuspageStatus(raw: string): ServiceStatusLevel {
  const map: Record<string, ServiceStatusLevel> = {
    operational: "operational",
    degraded_performance: "degraded_performance",
    partial_outage: "partial_outage",
    major_outage: "major_outage",
    under_maintenance: "degraded_performance",
  };
  return map[raw] ?? "unknown";
}

function overallFromIndicator(indicator: string): ServiceStatusLevel {
  const map: Record<string, ServiceStatusLevel> = {
    none: "operational",
    minor: "degraded_performance",
    major: "major_outage",
    critical: "major_outage",
  };
  return map[indicator] ?? "unknown";
}

async function fetchStatuspage(apiUrl: string): Promise<{
  services: ServiceStatus[];
  overall_status: ServiceStatusLevel;
  incidents: Incident[];
}> {
  let data: StatuspageSummary;
  try {
    const res = await fetch(apiUrl, { cache: "no-store" });
    if (!res.ok) {
      return { services: [], overall_status: "unknown", incidents: [] };
    }
    data = await res.json();
  } catch {
    return { services: [], overall_status: "unknown", incidents: [] };
  }

  const services: ServiceStatus[] = data.components
    .filter((c) => !c.group)
    .map((c) => ({
      id: c.id,
      name: c.name,
      status: normalizeStatuspageStatus(c.status),
    }));

  const incidents: Incident[] = data.incidents.map((inc) => ({
    title: inc.name,
    status: inc.status,
    impact: inc.impact,
    created_at: inc.created_at,
    url: inc.shortlink,
  }));

  return {
    services,
    overall_status: overallFromIndicator(data.status.indicator),
    incidents,
  };
}

// ---------------------------------------------------------------------------
// Probe helpers
// ---------------------------------------------------------------------------

function parseErrorBody(raw: string): string {
  try {
    const json = JSON.parse(raw);
    // Anthropic: { type: "error", error: { type: "overloaded_error", message: "Overloaded" } }
    if (json?.error?.message) return json.error.message;
    // Anthropic short form: { error: { type: "overloaded_error" } }
    if (json?.error?.type) return json.error.type.replace(/_/g, " ");
    // OpenAI: { error: { message: "..." } }
    if (json?.message) return json.message;
    // Google: { error: { status: "RESOURCE_EXHAUSTED", message: "..." } }
    if (json?.error?.status) return json.error.status.replace(/_/g, " ").toLowerCase();
  } catch {
    // not JSON
  }
  return raw.slice(0, 80);
}

const PROBE_TIMEOUT_MS = 3100;

async function probeModel(
  tier: "fast" | "flagship",
  model: string,
  displayName: string,
  fn: (signal: AbortSignal) => Promise<Response>
): Promise<ProbeResult> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fn(controller.signal);
    clearTimeout(timer);
    const latency = Date.now() - start;
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        model,
        display_name: displayName,
        tier,
        success: false,
        latency_ms: latency,
        http_status: res.status,
        error: parseErrorBody(body),
      };
    }
    return {
      model,
      display_name: displayName,
      tier,
      success: true,
      latency_ms: latency,
      http_status: res.status,
      error: null,
    };
  } catch (err) {
    clearTimeout(timer);
    const latency = Date.now() - start;
    const isTimeout = controller.signal.aborted;
    return {
      model,
      display_name: displayName,
      tier,
      success: false,
      latency_ms: latency,
      http_status: null,
      error: isTimeout ? "Timeout" : (err instanceof Error ? err.message : "Unknown error"),
    };
  }
}

function probeOpenAI(
  apiKey: string,
  model: string,
  displayName: string,
  tier: "fast" | "flagship"
): Promise<ProbeResult> {
  return probeModel(tier, model, displayName, (signal) =>
    fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [{ role: "user", content: "ok" }],
        max_output_tokens: 16,
        store: false,
      }),
      cache: "no-store",
      signal,
    })
  );
}

function probeAnthropic(
  apiKey: string,
  model: string,
  displayName: string,
  tier: "fast" | "flagship"
): Promise<ProbeResult> {
  return probeModel(tier, model, displayName, (signal) =>
    fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ok" }],
        max_tokens: 1,
      }),
      cache: "no-store",
      signal,
    })
  );
}

function probeGoogle(
  apiKey: string,
  model: string,
  displayName: string,
  tier: "fast" | "flagship"
): Promise<ProbeResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  return probeModel(tier, model, displayName, (signal) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ok" }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
      cache: "no-store",
      signal,
    })
  );
}

// ---------------------------------------------------------------------------
// Provider status (fast — just status page JSON)
// ---------------------------------------------------------------------------

export async function fetchOpenAIStatus(): Promise<ProviderStatus> {
  const { services, overall_status, incidents } = await fetchStatuspage(
    "https://status.openai.com/api/v2/summary.json"
  );
  return {
    name: "OpenAI",
    slug: "openai",
    icon: "/icons/openai.svg",
    url: "https://status.openai.com",
    fetched_at: new Date().toISOString(),
    overall_status,
    services,
    probes: [],
    incidents,
  };
}

export async function fetchAnthropicStatus(): Promise<ProviderStatus> {
  const { services, overall_status, incidents } = await fetchStatuspage(
    "https://status.anthropic.com/api/v2/summary.json"
  );
  return {
    name: "Anthropic",
    slug: "anthropic",
    icon: "/icons/anthropic.svg",
    url: "https://status.anthropic.com",
    fetched_at: new Date().toISOString(),
    overall_status,
    services,
    probes: [],
    incidents,
  };
}

export async function fetchGoogleStatus(): Promise<ProviderStatus> {
  let overall_status: ServiceStatusLevel = "operational";
  const incidents: Incident[] = [];
  const services: ServiceStatus[] = [];

  try {
    const res = await fetch(
      "https://status.cloud.google.com/incidents.json",
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const aiIncidents = (data as Array<Record<string, unknown>>).filter(
        (inc) => {
          const affectedProducts = inc.affected_products as
            | Array<{ title: string }>
            | undefined;
          const isAI = affectedProducts?.some(
            (p) =>
              p.title?.toLowerCase().includes("ai platform") ||
              p.title?.toLowerCase().includes("vertex") ||
              p.title?.toLowerCase().includes("gemini")
          );
          const created = new Date(inc.begin as string);
          return isAI && created > oneDayAgo;
        }
      );

      for (const inc of aiIncidents) {
        const severity = (inc.severity as string) ?? "medium";
        if (severity === "high") overall_status = "major_outage";
        else if (severity === "medium" && overall_status === "operational")
          overall_status = "partial_outage";

        incidents.push({
          title: inc.external_desc as string,
          status: (inc.status_impact as string) ?? "unknown",
          impact: severity,
          created_at: inc.begin as string,
          url: inc.uri as string,
        });
      }

      services.push(
        { id: "gemini-api", name: "Gemini API", status: overall_status },
        { id: "vertex-ai", name: "Vertex AI", status: overall_status }
      );
    }
  } catch {
    overall_status = "unknown";
  }

  if (services.length === 0) {
    services.push(
      { id: "gemini-api", name: "Gemini API", status: "unknown" },
      { id: "vertex-ai", name: "Vertex AI", status: "unknown" }
    );
  }

  return {
    name: "Google",
    slug: "google",
    icon: "/icons/google.svg",
    url: "https://status.cloud.google.com",
    fetched_at: new Date().toISOString(),
    overall_status,
    services,
    probes: [],
    incidents,
  };
}

// ---------------------------------------------------------------------------
// Provider probes (slow — actual API calls)
// ---------------------------------------------------------------------------

export async function fetchOpenAIProbes(): Promise<ProbeResult[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];
  return Promise.all([
    probeOpenAI(apiKey, "gpt-5.4", "GPT 5.4", "flagship"),
    probeOpenAI(apiKey, "gpt-5.4-mini", "GPT 5.4 Mini", "flagship"),
    probeOpenAI(apiKey, "gpt-5.4-nano", "GPT 5.4 Nano", "fast"),
  ]);
}

export async function fetchAnthropicProbes(): Promise<ProbeResult[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return [];
  return Promise.all([
    probeAnthropic(apiKey, "claude-opus-4-6", "Opus 4.6", "flagship"),
    probeAnthropic(apiKey, "claude-sonnet-4-6", "Sonnet 4.6", "flagship"),
    probeAnthropic(apiKey, "claude-haiku-4-5", "Haiku 4.6", "fast"),
  ]);
}

export async function fetchGoogleProbes(): Promise<ProbeResult[]> {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) return [];
  return Promise.all([
    probeGoogle(apiKey, "gemini-3.1-pro-preview", "Gemini 3.1 Pro Preview", "flagship"),
    probeGoogle(apiKey, "gemini-3.1-flash-lite-preview", "Gemini 3.1 Flash Preview", "fast"),
  ]);
}
