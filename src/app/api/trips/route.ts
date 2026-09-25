import { requireAdmin } from "@/lib/auth";
import { createTrip, searchTrips } from "@/lib/data";
import { handler } from "@/lib/http";
import { tripSchema, tripSearchSchema } from "@/lib/validation";

export const GET = handler(async (req) => {
  const params = Object.fromEntries(new URL(req.url).searchParams);
  const trips = await searchTrips(tripSearchSchema.parse(params));
  return Response.json({ trips });
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const trip = await createTrip(tripSchema.parse(await req.json()));
  return Response.json({ trip }, { status: 201 });
});
