import { statusFetchers } from "@/lib/get-status";
import { corsHeaders, handleOptions } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return handleOptions(req) ?? new Response(null, { status: 204 });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const fetcher = statusFetchers[slug];

  if (!fetcher) {
    return Response.json({ error: "Unknown provider" }, { status: 404 });
  }

  const data = await fetcher();
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      ...corsHeaders(req),
    },
  });
}
