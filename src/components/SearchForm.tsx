"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchForm({
  cities,
  initial,
}: {
  cities: string[];
  initial: { from: string; to: string; date?: string };
}) {
  const router = useRouter();
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [date, setDate] = useState(initial.date ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (from.trim()) params.set("from", from.trim());
    if (to.trim()) params.set("to", to.trim());
    if (date) params.set("date", date);
    router.push(params.size ? `/?${params}` : "/");
  }

  function swap() {
    setFrom(to);
    setTo(from);
  }

  return (
    <form onSubmit={submit} className="card grid gap-4 p-4 sm:p-5 md:grid-cols-[1fr_auto_1fr_200px_auto] md:items-end">
      <datalist id="cities">
        {cities.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <div>
        <label htmlFor="from" className="label">
          From
        </label>
        <input id="from" list="cities" className="input" placeholder="Any city" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <button
        type="button"
        onClick={swap}
        aria-label="Swap origin and destination"
        className="mx-auto grid h-10 w-10 place-items-center rounded-full border border-slate-300 bg-white text-slate-500 transition hover:rotate-180 hover:text-indigo-600"
      >
        ⇄
      </button>
      <div>
        <label htmlFor="to" className="label">
          To
        </label>
        <input id="to" list="cities" className="input" placeholder="Any city" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <div>
        <label htmlFor="date" className="label">
          Date
        </label>
        <input id="date" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button type="submit" className="btn-primary h-[42px] px-6">
        Search
      </button>
    </form>
  );
}
