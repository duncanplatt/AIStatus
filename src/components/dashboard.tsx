"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PROVIDER_SLUGS } from "@/lib/types";
import type { StatusData, ProviderStatus, ProbeResult, ServiceStatusLevel } from "@/lib/types";
import { ProviderCard } from "./provider-card";
import { ProviderSkeleton } from "./provider-skeleton";
import { ThemeToggle } from "./theme-toggle";
const FRESH_INTERVAL = 30_000;
const STALE_INTERVAL = 10_000;
const STALE_THRESHOLD = 2 * 60 * 1000;

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function overallSummary(providers: ProviderStatus[]): {
  label: string;
  level: ServiceStatusLevel;
} {
  if (providers.length === 0) {
    return { label: "Checking systems…", level: "unknown" };
  }
  const statuses = providers.map((p) => p.overall_status);
  if (statuses.every((s) => s === "operational")) {
    return { label: "All systems operational", level: "operational" };
  }
  const degraded = statuses.filter((s) => s !== "operational").length;
  const hasOutage = statuses.some(
    (s) => s === "major_outage" || s === "partial_outage"
  );
  if (hasOutage) {
    return {
      label: `${degraded} provider${degraded > 1 ? "s" : ""} experiencing issues`,
      level: "partial_outage",
    };
  }
  return {
    label: `${degraded} provider${degraded > 1 ? "s" : ""} degraded`,
    level: "degraded_performance",
  };
}

const summaryColors: Record<ServiceStatusLevel, string> = {
  operational: "text-status-green",
  degraded_performance: "text-status-yellow",
  partial_outage: "text-status-orange",
  major_outage: "text-status-red",
  unknown: "text-muted",
};

function updateCheckedAt(
  providers: Record<string, ProviderStatus>,
  setCheckedAt: (v: string) => void
) {
  const values = Object.values(providers);
  if (values.length === 0) return;
  const oldest = values.reduce(
    (min, p) => (p.fetched_at < min ? p.fetched_at : min),
    values[0].fetched_at
  );
  setCheckedAt(oldest);
}

export function Dashboard({ initialData }: { initialData?: StatusData }) {
  const [providers, setProviders] = useState<Record<string, ProviderStatus>>(
    () => {
      const map: Record<string, ProviderStatus> = {};
      if (initialData) {
        for (const p of initialData.providers) map[p.slug] = p;
      }
      return map;
    }
  );
  const [probesLoaded, setProbesLoaded] = useState<Set<string>>(
    () => new Set(initialData ? PROVIDER_SLUGS : [])
  );
  const [checkedAt, setCheckedAt] = useState(
    initialData?.checked_at ?? ""
  );
  const [agoText, setAgoText] = useState("");
  const [isStale, setIsStale] = useState(!initialData);
  const mountedRef = useRef(true);
  const pendingProbesRef = useRef<Record<string, ProbeResult[]>>({});

  // On mount: fetch status (fast) then probes (slow) independently
  useEffect(() => {
    mountedRef.current = true;
    pendingProbesRef.current = {};

    if (initialData) return;

    PROVIDER_SLUGS.forEach(async (slug) => {
      try {
        const res = await fetch(`/api/status/${slug}`);
        if (!res.ok || !mountedRef.current) return;
        const data: ProviderStatus = await res.json();
        const buffered = pendingProbesRef.current[slug];
        if (buffered) delete pendingProbesRef.current[slug];
        setProviders((prev) => {
          const existing = prev[slug];
          const probes = buffered ?? existing?.probes ?? data.probes;
          const next = { ...prev, [slug]: { ...data, probes } };
          updateCheckedAt(next, setCheckedAt);
          return next;
        });
        if (buffered) {
          setProbesLoaded((prev) => new Set(prev).add(slug));
        }
      } catch {
        // Will retry on next poll
      }
    });

    PROVIDER_SLUGS.forEach(async (slug) => {
      try {
        const res = await fetch(`/api/probes/${slug}`);
        if (!res.ok || !mountedRef.current) return;
        const probes: ProbeResult[] = await res.json();
        setProviders((prev) => {
          const existing = prev[slug];
          if (!existing) {
            pendingProbesRef.current[slug] = probes;
            return prev;
          }
          return { ...prev, [slug]: { ...existing, probes } };
        });
        setProbesLoaded((prev) => new Set(prev).add(slug));
      } catch {
        setProbesLoaded((prev) => new Set(prev).add(slug));
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, [initialData]);

  // Polling: fetch aggregate (includes both status + probes)
  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) return;
      const data: StatusData = await res.json();
      setCheckedAt(data.checked_at);
      setProviders((prev) => {
        const next: Record<string, ProviderStatus> = {};
        for (const p of data.providers) {
          const existing = prev[p.slug];
          next[p.slug] = {
            ...p,
            probes: p.probes.length > 0 ? p.probes : (existing?.probes ?? []),
          };
        }
        return next;
      });
      setProbesLoaded(new Set(PROVIDER_SLUGS));
    } catch {
      // Will retry next interval
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;

    let id: ReturnType<typeof setInterval> | null = null;

    function startPolling() {
      stopPolling();
      const interval = isStale ? STALE_INTERVAL : FRESH_INTERVAL;
      id = setInterval(refresh, interval);
    }

    function stopPolling() {
      if (id !== null) {
        clearInterval(id);
        id = null;
      }
    }

    function onVisibilityChange() {
      if (document.hidden) {
        stopPolling();
      } else {
        refresh();
        startPolling();
      }
    }

    if (!document.hidden) startPolling();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isStale, refresh]);

  // Update "ago" text and staleness every second
  useEffect(() => {
    if (!checkedAt) return;
    const id = setInterval(() => {
      const age = Date.now() - new Date(checkedAt).getTime();
      setIsStale(age > STALE_THRESHOLD);
      setAgoText(timeAgo(checkedAt));
    }, 1000);
    setAgoText(timeAgo(checkedAt));
    return () => clearInterval(id);
  }, [checkedAt]);

  const providerList = PROVIDER_SLUGS.map((slug) => providers[slug]);
  const loadedProviders = providerList.filter(Boolean) as ProviderStatus[];
  const summary = overallSummary(loadedProviders);

  return (
    <>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Status</h1>
          <p className={`mt-1 text-lg ${summaryColors[summary.level]}`}>
            {summary.label}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            {isStale && checkedAt && (
              <span className="flex items-center gap-1.5 text-status-yellow">
                <span className="inline-block h-2 w-2 rounded-full bg-status-yellow animate-pulse-dot" />
                Refreshing&hellip;
              </span>
            )}
            {checkedAt && (
              <span>
                Last checked{" "}
                <time dateTime={checkedAt} className="font-mono">
                  {agoText}
                </time>
              </span>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="grid gap-x-4 gap-y-0 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDER_SLUGS.map((slug) => {
          const provider = providers[slug];
          return provider ? (
            <ProviderCard
              key={slug}
              provider={provider}
              probesLoading={!probesLoaded.has(slug)}
            />
          ) : (
            <ProviderSkeleton key={slug} />
          );
        })}
      </div>
    </>
  );
}
