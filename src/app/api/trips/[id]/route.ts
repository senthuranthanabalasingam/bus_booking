import { getTrip } from "@/lib/data";
import { handler, HttpError } from "@/lib/http";
import { idSchema } from "@/lib/validation";

export const GET = handler(async (_req, ctx: RouteContext<"/api/trips/[id]">) => {
  const trip = await getTrip(idSchema.parse((await ctx.params).id));
  if (!trip) throw new HttpError(404, "Trip not found");
  // Don't expose other passengers' ids publicly.
  const bookedSeats = trip.bookedSeats.map((s) => s.seatNumber);
  return Response.json({ trip: { ...trip, bookedSeats } });
});
