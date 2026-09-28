"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { APP_UTC_OFFSET } from "@/lib/constants";
import type { Bus } from "@/lib/types";
import { useToast } from "./Toast";

function useSubmit(url: string, successMessage: string, toBody: (form: FormData) => unknown) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setBusy(true);
    try {
      await api(url, { body: toBody(new FormData(form)) });
      toast(successMessage);
      form.reset();
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }
  return { busy, onSubmit };
}

export function BusForm() {
  const { busy, onSubmit } = useSubmit("/api/buses", "Bus added", (f) => Object.fromEntries(f));
  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Add a bus</h2>
      <Field label="Name" name="name" placeholder="Ashok Leyland Viking" />
      <Field label="Plate" name="plate" placeholder="NB-1234" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Total seats" name="totalSeats" type="number" min={1} max={80} defaultValue="40" />
        <Field label="Seats per row" name="seatsPerRow" type="number" min={2} max={6} defaultValue="4" />
      </div>
      <button className="btn-primary w-full" disabled={busy}>
        {busy ? "Saving…" : "Add bus"}
      </button>
    </form>
  );
}

export function TripForm({ buses }: { buses: Bus[] }) {
  const { busy, onSubmit } = useSubmit("/api/trips", "Trip added", (f) => {
    const data = Object.fromEntries(f) as Record<string, string>;
    // datetime-local values have no zone; they're entered in Sri Lanka time.
    const iso = (v: string) => (v ? `${v}:00${APP_UTC_OFFSET}` : "");
    return { ...data, departureAt: iso(data.departureAt), arrivalAt: iso(data.arrivalAt) };
  });
  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Schedule a trip</h2>
      <div>
        <label htmlFor="busId" className="label">
          Bus
        </label>
        <select id="busId" name="busId" required className="input" defaultValue="">
          <option value="" disabled>
            Choose a bus…
          </option>
          {buses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} · {b.plate} ({b.totalSeats} seats)
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="From" name="origin" placeholder="Colombo" />
        <Field label="To" name="destination" placeholder="Kandy" />
        <Field label="Departure (SL time)" name="departureAt" type="datetime-local" />
        <Field label="Arrival (SL time)" name="arrivalAt" type="datetime-local" />
      </div>
      <Field label="Price (LKR)" name="price" type="number" min={0} step="1" placeholder="1200" />
      <button className="btn-primary w-full" disabled={busy || !buses.length}>
        {busy ? "Saving…" : "Add trip"}
      </button>
    </form>
  );
}

function Field({ label, name, ...props }: { label: string; name: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="label">
        {label}
      </label>
      <input id={name} name={name} required className="input" {...props} />
    </div>
  );
}
