import { hashPassword, startSession } from "@/lib/auth";
import { createUser } from "@/lib/data";
import { handler } from "@/lib/http";
import { registerSchema } from "@/lib/validation";

export const POST = handler(async (req) => {
  const { name, email, password } = registerSchema.parse(await req.json());
  const user = await createUser(name, email, await hashPassword(password));
  await startSession(user);
  return Response.json({ user }, { status: 201 });
});
