import { getStatus } from "@/lib/get-status";
import { corsHeaders, handleOptions } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return handleOptions(req) ?? new Response(null, { status: 204 });
}

export async function GET(req: Request) {
  const data = await getStatus();
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      ...corsHeaders(req),
    },
  });
}
