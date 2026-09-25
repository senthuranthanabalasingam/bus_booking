"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { MAX_SEATS_PER_BOOKING } from "@/lib/constants";
import { SeatLegend, SeatMap, type SeatState } from "./SeatMap";
import { useToast } from "./Toast";

export function SeatBooking({
  tripId,
  totalSeats,
  seatsPerRow,
  price,
  bookedSeats,
  mySeats,
  loggedIn,
}: {
  tripId: number;
  totalSeats: number;
  seatsPerRow: number;
  price: number;
  bookedSeats: number[];
  mySeats: number[];
  loggedIn: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [picked, setPicked] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const booked = new Set(bookedSeats);
  const mine = new Set(mySeats);
  // Drop any picked seat someone else booked since (after a refresh).
  const selected = picked.filter((s) => !booked.has(s));

  const stateOf = (seat: number): SeatState =>
    mine.has(seat) ? "mine" : booked.has(seat) ? "booked" : selected.includes(seat) ? "selected" : "available";

  function toggle(seat: number) {
    if (selected.includes(seat)) return setPicked(selected.filter((s) => s !== seat));
    if (selected.length >= MAX_SEATS_PER_BOOKING) {
      return toast(`You can book up to ${MAX_SEATS_PER_BOOKING} seats at once`, "error");
    }
    setPicked([...selected, seat].sort((a, b) => a - b));
  }

  async function book() {
    setBusy(true);
    try {
      await api("/api/bookings", { body: { tripId, seats: selected } });
      toast(`Booked seat${selected.length > 1 ? "s" : ""} ${selected.join(", ")} 🎉`);
      setPicked([]);
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="card p-6">
        <h2 className="mb-1 text-lg font-semibold">Choose your seats</h2>
        <p className="mb-6 text-sm text-slate-500">
          {totalSeats - booked.size} of {totalSeats} seats available · up to {MAX_SEATS_PER_BOOKING} per booking
        </p>
        <SeatMap totalSeats={totalSeats} seatsPerRow={seatsPerRow} stateOf={stateOf} onToggle={toggle} />
        <div className="mt-6">
          <SeatLegend />
        </div>
      </div>

      <aside className="card h-fit p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold">Booking summary</h2>
        {selected.length ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.map((s) => (
              <button
                key={s}
                onClick={() => toggle(s)}
                className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                title="Remove"
              >
                Seat {s} ✕
              </button>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">No seats selected yet. Tap a seat on the map.</p>
        )}
        <dl className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <dt>
              {selected.length} × {formatPrice(price)}
            </dt>
            <dd>{formatPrice(selected.length * price)}</dd>
          </div>
          <div className="flex justify-between text-base font-bold">
            <dt>Total</dt>
            <dd>{formatPrice(selected.length * price)}</dd>
          </div>
        </dl>
        {loggedIn ? (
          <button className="btn-primary mt-6 w-full" disabled={!selected.length || busy} onClick={book}>
            {busy ? "Booking…" : selected.length ? `Book ${selected.length} seat${selected.length > 1 ? "s" : ""}` : "Select seats"}
          </button>
        ) : (
          <Link href={`/login?next=/trips/${tripId}`} className="btn-primary mt-6 w-full">
            Log in to book
          </Link>
        )}
        {mySeats.length > 0 && (
          <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
            You already have seat{mySeats.length > 1 ? "s" : ""} {mySeats.join(", ")} on this trip.{" "}
            <Link href="/bookings" className="font-semibold underline">
              Manage bookings
            </Link>
          </p>
        )}
      </aside>
    </div>
  );
}
