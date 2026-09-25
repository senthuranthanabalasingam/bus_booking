import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";

export async function Navbar() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-white">
            <BusIcon />
          </span>
          BusGo
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium sm:gap-2">
          <NavLink href="/">Search</NavLink>
          {user && <NavLink href="/bookings">My bookings</NavLink>}
          {user?.role === "admin" && <NavLink href="/admin">Admin</NavLink>}
          {user ? (
            <div className="ml-2 flex items-center gap-3 border-l border-slate-200 pl-3">
              <span className="hidden text-slate-600 sm:inline">Hi, {user.name.split(" ")[0]}</span>
              <LogoutButton />
            </div>
          ) : (
            <>
              <NavLink href="/login">Log in</NavLink>
              <Link href="/register" className="btn-primary ml-1 py-2">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
      {children}
    </Link>
  );
}

export function BusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 17h12M5 17V6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v11M5 11h14M8 17v2M16 17v2" />
      <circle cx="8" cy="14" r="0.5" fill="currentColor" />
      <circle cx="16" cy="14" r="0.5" fill="currentColor" />
    </svg>
  );
}
