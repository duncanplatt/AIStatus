import { probeFetchers } from "@/lib/get-status";

export async function GET(
  _req: Request,
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
    },
  });
}
