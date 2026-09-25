import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { HttpError } from "./http";
import { SESSION_COOKIE, SESSION_MAX_AGE, signToken, verifyToken, type SessionUser } from "./session";

export const hashPassword = (password: string) => bcrypt.hash(password, 10);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, "Please log in first");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") throw new HttpError(403, "Admins only");
  return user;
}

export async function startSession(user: SessionUser) {
  const store = await cookies();
  store.set(SESSION_COOKIE, await signToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
