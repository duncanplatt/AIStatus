import { getStatus } from "@/lib/get-status";

export async function GET() {
  const data = await getStatus();
  return Response.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
    },
  });
}
