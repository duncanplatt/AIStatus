import { statusFetchers } from "@/lib/get-status";

export async function GET(
  _req: Request,
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
    },
  });
}
