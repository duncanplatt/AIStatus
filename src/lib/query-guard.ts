// Vercel's CDN includes the query string in its cache key, so any unique
// query param (?x=1, ?x=2, ...) is a guaranteed cache miss that would
// trigger a fresh set of paid provider probes. These routes take no query
// params, so redirect anything with a query string to the canonical bare
// path before doing any expensive work. The redirect itself is cheap (no
// provider calls) and cacheable.
export function rejectQueryString(req: Request): Response | null {
  const url = new URL(req.url);
  if (!url.search) return null;
  return new Response(null, {
    status: 308,
    headers: {
      Location: url.pathname,
      "Cache-Control": "public, s-maxage=3600",
    },
  });
}
