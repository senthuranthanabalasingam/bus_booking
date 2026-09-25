import Link from "next/link";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/lib/format";
import type { TripSummary } from "@/lib/types";

export function TripCard({ trip }: { trip: TripSummary }) {
  const soldOut = trip.seatsLeft <= 0;
  const fewLeft = !soldOut && trip.seatsLeft <= 5;
  return (
    <div className="card flex flex-col gap-5 p-5 transition hover:border-indigo-300 hover:shadow-md sm:flex-row sm:items-center">
      <div className="flex flex-1 items-center gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums">{formatTime(trip.departureAt)}</div>
          <div className="text-sm text-slate-600">{trip.origin}</div>
        </div>
        <div className="flex flex-1 flex-col items-center px-2 text-xs text-slate-500">
          <span>{formatDuration(trip.departureAt, trip.arrivalAt)}</span>
          <div className="relative my-1 h-px w-full bg-slate-300">
            <span className="absolute -top-1 left-0 h-2 w-2 rounded-full bg-indigo-600" />
            <span className="absolute -top-1 right-0 h-2 w-2 rounded-full border-2 border-indigo-600 bg-white" />
          </div>
          <span>{formatDate(trip.departureAt)}</span>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold tabular-nums">{formatTime(trip.arrivalAt)}</div>
          <div className="text-sm text-slate-600">{trip.destination}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-6 border-t border-slate-100 pt-4 sm:w-64 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
        <div>
          <div className="text-xl font-bold text-slate-900">{formatPrice(trip.price)}</div>
          <div className="text-xs text-slate-500">{trip.busName}</div>
          <div
            className={`mt-1 text-xs font-semibold ${soldOut ? "text-rose-600" : fewLeft ? "text-amber-600" : "text-emerald-600"}`}
          >
            {soldOut ? "Sold out" : `${trip.seatsLeft} seats left`}
          </div>
        </div>
        {soldOut ? (
          <span className="btn-secondary pointer-events-none opacity-50">Full</span>
        ) : (
          <Link href={`/trips/${trip.id}`} className="btn-primary">
            Select
          </Link>
        )}
      </div>
    </div>
  );
}
