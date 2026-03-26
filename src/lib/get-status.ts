import {
  fetchOpenAIStatus,
  fetchAnthropicStatus,
  fetchGoogleStatus,
  fetchOpenAIProbes,
  fetchAnthropicProbes,
  fetchGoogleProbes,
} from "./providers";
import { getCheckOriginLabel } from "./check-origin";
import { PROVIDER_SLUGS } from "./types";
import type { ProviderStatus, ProbeResult, StatusData } from "./types";

// No unstable_cache — all caching is handled by Vercel CDN (s-maxage on
// each route) and Cloudflare in front. This avoids Vercel Data Cache
// inconsistency that caused stale/missing data across edge nodes.

export const statusFetchers: Record<string, () => Promise<ProviderStatus>> = {
  openai: fetchOpenAIStatus,
  anthropic: fetchAnthropicStatus,
  google: fetchGoogleStatus,
};

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
  const check_origin = getCheckOriginLabel();
  return {
    checked_at: oldest,
    ...(check_origin ? { check_origin } : {}),
    providers,
  };
}
