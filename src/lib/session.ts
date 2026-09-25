// Token helpers with no database dependency, so they can be imported from proxy.ts.
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export type SessionUser = { id: number; name: string; email: string; role: "user" | "admin" };

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(value);
}

export async function signToken(user: SessionUser) {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function verifyToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return {
      id: Number(payload.sub),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role === "admin" ? "admin" : "user",
    };
  } catch {
    return null;
  }
}
