"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = Object.fromEntries(new FormData(e.currentTarget));
      await api(`/api/auth/${mode}`, { body });
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  const otherHref = `${isLogin ? "/register" : "/login"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-bold">{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLogin ? "Log in to book and manage your seats." : "It takes less than a minute."}
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="label">
                Full name
              </label>
              <input id="name" name="name" required minLength={2} className="input" autoComplete="name" />
            </div>
          )}
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input id="email" name="email" type="email" required className="input" autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={isLogin ? 1 : 6}
              className="input"
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link href={otherHref} className="font-semibold text-indigo-600 hover:underline">
            {isLogin ? "Create an account" : "Log in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
