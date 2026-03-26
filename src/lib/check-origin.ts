/**
 * Human-readable hint for where API probes run from.
 * Lets the UI explain that round-trip times are not end-user latency.
 *
 * On Vercel, `VERCEL_REGION` is set at runtime to the serverless region executing
 * the function (see project / function region settings). Local `next dev` usually
 * has no region — set `CHECK_ORIGIN_LABEL` for a fixed string in dev.
 */

/** Vercel serverless region code → city/area (codes from Vercel docs; unknown codes fall back to the raw code). */
const VERCEL_REGION_PLACES: Record<string, string> = {
  arn1: "Stockholm, Sweden",
  bom1: "Mumbai, India",
  cdg1: "Paris, France",
  cle1: "Cleveland, USA",
  cpt1: "Cape Town, South Africa",
  dub1: "Dublin, Ireland",
  dxb1: "Dubai, UAE",
  fra1: "Frankfurt, Germany",
  gru1: "São Paulo, Brazil",
  hkg1: "Hong Kong",
  hnd1: "Tokyo, Japan",
  icn1: "Seoul, South Korea",
  iad1: "Washington, D.C., USA",
  kix1: "Osaka, Japan",
  lhr1: "London, UK",
  pdx1: "Portland, USA",
  sfo1: "San Francisco, USA",
  sin1: "Singapore",
  syd1: "Sydney, Australia",
  yul1: "Montréal, Canada",
};

export function getCheckOriginLabel(): string | undefined {
  const custom = process.env.CHECK_ORIGIN_LABEL?.trim();
  if (custom) return custom;

  const region = process.env.VERCEL_REGION?.trim();
  if (!region) return undefined;

  const place = VERCEL_REGION_PLACES[region];
  if (place) {
    return `${place} · Vercel (${region})`;
  }
  return `Vercel (${region})`;
}
