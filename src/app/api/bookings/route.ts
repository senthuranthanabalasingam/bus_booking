import { requireUser } from "@/lib/auth";
import { createBookings, getUserBookings } from "@/lib/data";
import { handler } from "@/lib/http";
import { bookingSchema } from "@/lib/validation";

export const GET = handler(async () => {
  const user = await requireUser();
  return Response.json({ bookings: await getUserBookings(user.id) });
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const { tripId, seats } = bookingSchema.parse(await req.json());
  const bookings = await createBookings(user.id, tripId, seats);
  return Response.json({ bookings }, { status: 201 });
});
