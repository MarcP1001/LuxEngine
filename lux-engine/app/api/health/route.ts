export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    { status: "healthy", service: "lux-engine-web" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
