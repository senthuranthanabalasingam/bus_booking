import { requireUser } from "@/lib/auth";
import { cancelBooking } from "@/lib/data";
import { handler } from "@/lib/http";
import { idSchema } from "@/lib/validation";

export const DELETE = handler(async (_req, ctx: RouteContext<"/api/bookings/[id]">) => {
  const user = await requireUser();
  await cancelBooking(user, idSchema.parse((await ctx.params).id));
  return Response.json({ ok: true });
});
