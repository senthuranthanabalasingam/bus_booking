"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { formatDate, formatPrice, formatTime } from "@/lib/format";
import type { Booking } from "@/lib/types";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";
import { useToast } from "./Toast";

export function BookingList({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const toast = useToast();
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [busy, setBusy] = useState(false);

  const now = new Date();
  const upcoming = bookings.filter((b) => b.status === "booked" && new Date(b.departureAt) > now).reverse();
  const past = bookings.filter((b) => !(b.status === "booked" && new Date(b.departureAt) > now));

  async function confirmCancel() {
    if (!cancelling) return;
    setBusy(true);
    try {
      await api(`/api/bookings/${cancelling.id}`, { method: "DELETE" });
      toast(`Seat ${cancelling.seatNumber} cancelled`);
      router.refresh();
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
      setCancelling(null);
    }
  }

  if (!bookings.length) {
    return (
      <EmptyState
        title="No bookings yet"
        text="When you book a seat it will show up here."
        action={
          <Link href="/" className="btn-primary">
            Find a trip
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Section title="Upcoming" bookings={upcoming} onCancel={setCancelling} empty="No upcoming trips." />
      {past.length > 0 && <Section title="Past & cancelled" bookings={past} muted />}
      <ConfirmDialog
        open={Boolean(cancelling)}
        title="Cancel this booking?"
        message={
          cancelling
            ? `Seat ${cancelling.seatNumber} on ${cancelling.origin} → ${cancelling.destination}, ${formatDate(cancelling.departureAt)} at ${formatTime(cancelling.departureAt)}. The seat will be released for others.`
            : ""
        }
        confirmLabel="Cancel booking"
        busy={busy}
        onConfirm={confirmCancel}
        onCancel={() => setCancelling(null)}
      />
    </>
  );
}

function Section({
  title,
  bookings,
  onCancel,
  muted,
  empty,
}: {
  title: string;
  bookings: Booking[];
  onCancel?: (b: Booking) => void;
  muted?: boolean;
  empty?: string;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
      {bookings.length === 0 && <p className="text-sm text-slate-500">{empty}</p>}
      <div className="grid gap-3">
        {bookings.map((b) => (
          <div key={b.id} className={`card flex flex-col gap-4 p-5 sm:flex-row sm:items-center ${muted ? "opacity-70" : ""}`}>
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
              <div className="text-center leading-tight">
                <div className="text-[10px] font-semibold uppercase">Seat</div>
                <div className="text-lg font-bold">{b.seatNumber}</div>
              </div>
            </div>
            <div className="flex-1">
              <Link href={`/trips/${b.tripId}`} className="font-semibold hover:text-indigo-600">
                {b.origin} → {b.destination}
              </Link>
              <p className="text-sm text-slate-600">
                {formatDate(b.departureAt)} · {formatTime(b.departureAt)} – {formatTime(b.arrivalAt)} · {b.busName}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-semibold">{formatPrice(b.price)}</span>
              {b.status === "cancelled" ? (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Cancelled</span>
              ) : onCancel ? (
                <button className="btn-secondary py-2 text-rose-600" onClick={() => onCancel(b)}>
                  Cancel
                </button>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Completed</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
