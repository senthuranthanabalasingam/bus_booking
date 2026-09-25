"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";

export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }
  return (
    <button onClick={logout} className="rounded-lg px-2.5 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900">
      Log out
    </button>
  );
}
