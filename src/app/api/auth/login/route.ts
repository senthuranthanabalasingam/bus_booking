import { startSession, verifyPassword } from "@/lib/auth";
import { findUserByEmail } from "@/lib/data";
import { handler, HttpError } from "@/lib/http";
import { loginSchema } from "@/lib/validation";

export const POST = handler(async (req) => {
  const { email, password } = loginSchema.parse(await req.json());
  const found = await findUserByEmail(email);
  if (!found || !(await verifyPassword(password, found.passwordHash))) {
    throw new HttpError(401, "Invalid email or password");
  }
  const user = { id: found.id, name: found.name, email: found.email, role: found.role };
  await startSession(user);
  return Response.json({ user });
});
