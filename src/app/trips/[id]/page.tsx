import Link from "next/link";
import { notFound } from "next/navigation";
import { SeatBooking } from "@/components/SeatBooking";
import { getCurrentUser } from "@/lib/auth";
import { getTrip } from "@/lib/data";
import { formatDate, formatDuration, formatPrice, formatTime } from "@/lib/format";
import { idSchema } from "@/lib/validation";

export default async function TripPage(props: PageProps<"/trips/[id]">) {
  const id = idSchema.safeParse((await props.params).id);
  if (!id.success) notFound();
  const [trip, user] = await Promise.all([getTrip(id.data), getCurrentUser()]);
  if (!trip) notFound();

  const departed = new Date(trip.departureAt) <= new Date();
  const mySeats = trip.bookedSeats.filter((s) => s.userId === user?.id).map((s) => s.seatNumber);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
        ← Back to search
      </Link>

      <div className="card mt-4 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-500">{formatDate(trip.departureAt)}</p>
          <h1 className="text-2xl font-bold">
            {trip.origin} → {trip.destination}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {formatTime(trip.departureAt)} – {formatTime(trip.arrivalAt)} · {formatDuration(trip.departureAt, trip.arrivalAt)} ·{" "}
            {trip.busName} ({trip.plate})
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{formatPrice(trip.price)}</div>
          <div className="text-xs text-slate-500">per seat</div>
        </div>
      </div>

      <div className="mt-6">
        {departed ? (
          <div className="card p-6 text-center text-slate-600">This trip has already departed.</div>
        ) : (
          <SeatBooking
            tripId={trip.id}
            totalSeats={trip.totalSeats}
            seatsPerRow={trip.seatsPerRow}
            price={trip.price}
            bookedSeats={trip.bookedSeats.map((s) => s.seatNumber)}
            mySeats={mySeats}
            loggedIn={Boolean(user)}
          />
        )}
      </div>
    </div>
  );
}
