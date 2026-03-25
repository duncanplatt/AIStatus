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

// Status caches (fast — status page JSON only, uses Data Cache)
const getCachedOpenAIStatus = unstable_cache(fetchOpenAIStatus, ["status-openai"], {
  revalidate: STATUS_REVALIDATE,
});
const getCachedAnthropicStatus = unstable_cache(fetchAnthropicStatus, ["status-anthropic"], {
  revalidate: STATUS_REVALIDATE,
});
const getCachedGoogleStatus = unstable_cache(fetchGoogleStatus, ["status-google"], {
  revalidate: STATUS_REVALIDATE,
});

export const statusFetchers: Record<string, () => Promise<ProviderStatus>> = {
  openai: getCachedOpenAIStatus,
  anthropic: getCachedAnthropicStatus,
  google: getCachedGoogleStatus,
};

// Probe fetchers — no Data Cache (unstable_cache). Caching is handled by
// Vercel CDN (s-maxage on the route) and Cloudflare in front. This avoids
// Data Cache inconsistency that caused intermittent empty probe responses.
export const probeFetchers: Record<string, () => Promise<ProbeResult[]>> = {
  openai: fetchOpenAIProbes,
  anthropic: fetchAnthropicProbes,
  google: fetchGoogleProbes,
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
