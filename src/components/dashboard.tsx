"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PROVIDER_SLUGS } from "@/lib/types";
import type {
  StatusData,
  ProviderStatus,
  ProbeResult,
  ServiceStatusLevel,
} from "@/lib/types";
import Image from "next/image";
import { ProviderCard } from "./provider-card";
import { ProviderSkeleton } from "./provider-skeleton";
import { ThemeToggle } from "./theme-toggle";

const FRESH_INTERVAL = 30_000;
const STALE_INTERVAL = 10_000;
const STALE_THRESHOLD = 2 * 60 * 1000;
/** If the tab was hidden at least this long, refetch on focus with cache bypass so data is not stale in the browser. */
const LONG_TAB_HIDDEN_MS = 5 * 60 * 1000;

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function formatDataTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function overallSummary(providers: ProviderStatus[]): {
  label: string;
  level: ServiceStatusLevel;
} {
  if (providers.length === 0) {
    return { label: "Checking systems\u2026", level: "unknown" };
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

export function Dashboard({ initialData }: { initialData?: StatusData }) {
  // Status and probes are stored separately — no merge race conditions.
  // They're combined at render time only.
  const [statuses, setStatuses] = useState<Record<string, ProviderStatus>>(
    () => {
      const map: Record<string, ProviderStatus> = {};
      if (initialData) {
        for (const p of initialData.providers) map[p.slug] = p;
      }
      return map;
    }
  );
  const [probes, setProbes] = useState<Record<string, ProbeResult[]>>(
    () => {
      const map: Record<string, ProbeResult[]> = {};
      if (initialData) {
        for (const p of initialData.providers) {
          if (p.probes.length > 0) map[p.slug] = p.probes;
        }
      }
      return map;
    }
  );
  const [probesLoaded, setProbesLoaded] = useState<Set<string>>(
    () => new Set(initialData ? PROVIDER_SLUGS : [])
  );
  const [checkedAt, setCheckedAt] = useState(initialData?.checked_at ?? "");
  const [checkOrigin, setCheckOrigin] = useState<string | undefined>(
    initialData?.check_origin
  );
  const [agoText, setAgoText] = useState("");
  const [isStale, setIsStale] = useState(!initialData);
  const mountedRef = useRef(true);
  const tabHiddenAtRef = useRef<number | null>(null);

  // On mount: fetch status (fast) and probes (slow) independently
  useEffect(() => {
    mountedRef.current = true;
    if (initialData) return;

    PROVIDER_SLUGS.forEach(async (slug) => {
      try {
        const res = await fetch(`/api/status/${slug}`);
        if (!res.ok || !mountedRef.current) return;
        const data: ProviderStatus = await res.json();
        setStatuses((prev) => {
          const next = { ...prev, [slug]: data };
          const values = Object.values(next);
          if (values.length > 0) {
            const oldest = values.reduce(
              (min, p) => (p.fetched_at < min ? p.fetched_at : min),
              values[0].fetched_at
            );
            setCheckedAt(oldest);
          }
          return next;
        });
      } catch {
        // Will retry on next poll
      }
    });

    PROVIDER_SLUGS.forEach(async (slug) => {
      try {
        const res = await fetch(`/api/probes/${slug}`);
        if (!res.ok || !mountedRef.current) return;
        const raw: unknown = await res.json();
        const list: ProbeResult[] = Array.isArray(raw)
          ? raw
          : raw &&
              typeof raw === "object" &&
              "probes" in raw &&
              Array.isArray((raw as { probes: unknown }).probes)
            ? (raw as { probes: ProbeResult[] }).probes
            : [];
        const origin =
          raw &&
          typeof raw === "object" &&
          "check_origin" in raw &&
          typeof (raw as { check_origin: unknown }).check_origin === "string"
            ? (raw as { check_origin: string }).check_origin
            : undefined;
        if (origin) setCheckOrigin(origin);
        if (list.length > 0) {
          setProbes((prev) => ({ ...prev, [slug]: list }));
        }
        setProbesLoaded((prev) => new Set(prev).add(slug));
      } catch {
        setProbesLoaded((prev) => new Set(prev).add(slug));
      }
    });

    return () => {
      mountedRef.current = false;
    };
  }, [initialData]);

  // Polling: fetch aggregate endpoint
  const refresh = useCallback(async (opts?: { bustCache?: boolean }) => {
    try {
      const res = await fetch(
        "/api/status",
        opts?.bustCache ? { cache: "no-store" } : undefined
      );
      if (!res.ok) return;
      const data: StatusData = await res.json();
      setCheckedAt(data.checked_at);
      if (data.check_origin) setCheckOrigin(data.check_origin);

      const nextStatuses: Record<string, ProviderStatus> = {};
      for (const p of data.providers) {
        nextStatuses[p.slug] = p;
      }
      setStatuses(nextStatuses);

      setProbes((prev) => {
        const next = { ...prev };
        for (const p of data.providers) {
          if (p.probes.length > 0) next[p.slug] = p.probes;
        }
        return next;
      });

      setProbesLoaded((prev) => {
        const next = new Set(prev);
        for (const p of data.providers) {
          if (p.probes.length > 0) next.add(p.slug);
        }
        return next;
      });
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
        tabHiddenAtRef.current = Date.now();
        stopPolling();
      } else {
        const hiddenAt = tabHiddenAtRef.current;
        tabHiddenAtRef.current = null;
        const awayMs =
          hiddenAt != null ? Date.now() - hiddenAt : 0;
        const longAbsence = awayMs >= LONG_TAB_HIDDEN_MS;
        void refresh(longAbsence ? { bustCache: true } : undefined);
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

  // Merge statuses + probes at render time — always uses latest of both
  const mergedProviders = PROVIDER_SLUGS.map((slug) => {
    const status = statuses[slug];
    if (!status) return null;
    const slugProbes = probes[slug];
    return slugProbes ? { ...status, probes: slugProbes } : status;
  });
  const loadedProviders = mergedProviders.filter(Boolean) as ProviderStatus[];
  const summary = overallSummary(loadedProviders);

  const latestDataAt =
    loadedProviders.length > 0
      ? loadedProviders.reduce(
          (max, p) => (p.fetched_at > max ? p.fetched_at : max),
          loadedProviders[0].fetched_at
        )
      : "";

  return (
    <>
      <header className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Status</h1>
          <p className={`mt-1 text-lg ${summaryColors[summary.level]}`}>
            {summary.label}
          </p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="flex items-center gap-2 text-sm text-muted">
            {isStale && checkedAt && (
              <span className="flex items-center gap-1.5 text-status-yellow">
                <span className="inline-block h-2 w-2 rounded-full bg-status-yellow animate-pulse-dot" />
                <span className="hidden sm:inline">Refreshing&hellip;</span>
              </span>
            )}
            {checkedAt && (
              <span>
                <span className="hidden sm:inline">Last checked </span>
                <time dateTime={checkedAt} className="font-mono">
                  {agoText}
                </time>
              </span>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Mobile Quick Navigation Pills */}
      <div className="mb-6 flex justify-between gap-2 overflow-x-auto pb-2 sm:hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-4 px-4 snap-x">
        {PROVIDER_SLUGS.map((slug, i) => {
          const provider = mergedProviders[i];
          const status = provider?.overall_status;
          const isDown = status === "major_outage";
          const isDegraded =
            status === "partial_outage" || status === "degraded_performance";
          const isUp = status === "operational";

          const colorClass = isDown
            ? "bg-status-red/10 border-status-red/20 text-status-red"
            : isDegraded
              ? "bg-status-orange/10 border-status-orange/20 text-status-orange"
              : isUp
                ? "bg-status-green/10 border-status-green/20 text-status-green"
                : "bg-muted/10 border-muted/20 text-muted";

          const name =
            provider?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
          const icon = provider?.icon || `/icons/${slug}.svg`;

          return (
            <button
              key={`pill-${slug}`}
              onClick={() => {
                document.getElementById(slug)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className={`flex flex-1 justify-center snap-start items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${colorClass}`}
            >
              <Image
                src={icon}
                alt={name}
                width={16}
                height={16}
                className={slug !== "google" ? "dark:invert opacity-80" : "opacity-80"}
              />
              {name}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDER_SLUGS.map((slug, i) => {
          const provider = mergedProviders[i];
          return provider ? (
            <ProviderCard
              key={slug}
              provider={provider}
              probesLoading={!probesLoaded.has(slug)}
              checkOrigin={checkOrigin}
            />
          ) : (
            <ProviderSkeleton key={slug} slug={slug} />
          );
        })}
      </div>

      <div className="mt-10 border-t border-card-border pt-6 text-xs text-muted/90">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-x-8">
          <p>
            <span className="text-muted">Latest data from provider APIs </span>
            {latestDataAt ? (
              <>
                <time
                  dateTime={latestDataAt}
                  className="font-mono text-foreground/90"
                >
                  {formatDataTimestamp(latestDataAt)}
                </time>
              </>
            ) : (
              <span className="text-muted">—</span>
            )}
          </p>
          <p>
            <span className="text-muted">Independent checks run from </span>
            <span className="text-foreground/90">
              {checkOrigin ?? "—"}
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
