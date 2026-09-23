import type { ProbeResult } from "./types";

export type ProbeProvider = "openai" | "anthropic" | "google";
export type ProbeTier = ProbeResult["tier"];

export interface ProbeModelEntry {
  model: string;
  displayName: string;
  tier: ProbeTier;
}

/**
 * Curated list of models to probe per provider.
 * This is the single source of truth — update here when models change.
 */
export const PROBE_MODELS: Record<ProbeProvider, readonly ProbeModelEntry[]> = {
  openai: [
    { model: "gpt-5.6-sol", displayName: "GPT 5.6 Sol", tier: "flagship" },
    { model: "gpt-5.6-terra", displayName: "GPT 5.6 Terra", tier: "flagship" },
    { model: "gpt-5.6-luna", displayName: "GPT 5.6 Luna", tier: "fast" },
  ],
  anthropic: [
    { model: "claude-fable-5", displayName: "Fable 5", tier: "flagship" },
    { model: "claude-opus-5", displayName: "Opus 5", tier: "flagship" },
    { model: "claude-sonnet-5", displayName: "Sonnet 5", tier: "flagship" },
    { model: "claude-haiku-4-5", displayName: "Haiku 4.6", tier: "fast" },
  ],
  google: [
    { model: "gemini-3.1-pro-preview", displayName: "Gemini 3.1 Pro Preview", tier: "flagship" },
    { model: "gemini-3.6-flash", displayName: "Gemini 3.6 Flash", tier: "fast" },
  ],
} as const;
