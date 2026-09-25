import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/session";

// Optimistic check: send logged-out visitors to /login. Pages and APIs still verify the user themselves.
export async function proxy(request: NextRequest) {
  const user = await verifyToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/bookings/:path*", "/admin/:path*"],
};
