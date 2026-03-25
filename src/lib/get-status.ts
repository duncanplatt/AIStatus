import { unstable_cache } from "next/cache";
import {
  fetchOpenAIStatus,
  fetchAnthropicStatus,
  fetchGoogleStatus,
  fetchOpenAIProbes,
  fetchAnthropicProbes,
  fetchGoogleProbes,
} from "./providers";
import { PROVIDER_SLUGS } from "./types";
import type { ProviderStatus, ProbeResult, StatusData } from "./types";

const STATUS_REVALIDATE = Number(process.env.STATUS_REVALIDATE) || 60;
const PROBES_REVALIDATE = Number(process.env.PROBES_REVALIDATE) || 300;

// Status caches (fast — status page JSON only)
const getCachedOpenAIStatus = unstable_cache(fetchOpenAIStatus, ["status-openai"], {
  revalidate: STATUS_REVALIDATE,
});
const getCachedAnthropicStatus = unstable_cache(fetchAnthropicStatus, ["status-anthropic"], {
  revalidate: STATUS_REVALIDATE,
});
const getCachedGoogleStatus = unstable_cache(fetchGoogleStatus, ["status-google"], {
  revalidate: STATUS_REVALIDATE,
});

// Probe caches (slow — actual API calls, cost tokens)
const getCachedOpenAIProbes = unstable_cache(fetchOpenAIProbes, ["probes-openai"], {
  revalidate: PROBES_REVALIDATE,
});
const getCachedAnthropicProbes = unstable_cache(fetchAnthropicProbes, ["probes-anthropic"], {
  revalidate: PROBES_REVALIDATE,
});
const getCachedGoogleProbes = unstable_cache(fetchGoogleProbes, ["probes-google"], {
  revalidate: PROBES_REVALIDATE,
});

export const statusFetchers: Record<string, () => Promise<ProviderStatus>> = {
  openai: getCachedOpenAIStatus,
  anthropic: getCachedAnthropicStatus,
  google: getCachedGoogleStatus,
};

export const probeFetchers: Record<string, () => Promise<ProbeResult[]>> = {
  openai: getCachedOpenAIProbes,
  anthropic: getCachedAnthropicProbes,
  google: getCachedGoogleProbes,
};

export { PROVIDER_SLUGS };

export async function getStatus(): Promise<StatusData> {
  const [statuses, allProbes] = await Promise.all([
    Promise.all(PROVIDER_SLUGS.map((slug) => statusFetchers[slug]())),
    Promise.all(PROVIDER_SLUGS.map((slug) => probeFetchers[slug]())),
  ]);

  const providers = statuses.map((status, i) => ({
    ...status,
    probes: allProbes[i],
  }));

  const oldest = providers.reduce(
    (min, p) => (p.fetched_at < min ? p.fetched_at : min),
    providers[0]?.fetched_at ?? new Date().toISOString()
  );
  return { checked_at: oldest, providers };
}
