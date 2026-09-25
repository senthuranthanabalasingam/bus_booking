import { requireAdmin } from "@/lib/auth";
import { createBus, listBuses } from "@/lib/data";
import { handler } from "@/lib/http";
import { busSchema } from "@/lib/validation";

export const GET = handler(async () => Response.json({ buses: await listBuses() }));

export const POST = handler(async (req) => {
  await requireAdmin();
  const bus = await createBus(busSchema.parse(await req.json()));
  return Response.json({ bus }, { status: 201 });
});
