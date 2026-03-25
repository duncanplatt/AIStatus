import { probeFetchers } from "@/lib/get-status";
import { corsHeaders, handleOptions } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return handleOptions(req) ?? new Response(null, { status: 204 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const fetcher = probeFetchers[slug];

  if (!fetcher) {
    return Response.json({ error: "Unknown provider" }, { status: 404 });
  }

  const probes = await fetcher();
  return Response.json(probes, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      ...corsHeaders(req),
    },
  });
}
