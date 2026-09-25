import { redirect } from "next/navigation";
import Link from "next/link";
import { BusForm, TripForm } from "@/components/AdminForms";
import { getCurrentUser } from "@/lib/auth";
import { listBuses, listUpcomingTrips } from "@/lib/data";
import { formatDate, formatPrice, formatTime } from "@/lib/format";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin") redirect("/");
  const [buses, trips] = await Promise.all([listBuses(), listUpcomingTrips()]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">Admin</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <BusForm />
        <TripForm buses={buses} />
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Fleet ({buses.length})</h2>
        <div className="flex flex-wrap gap-3">
          {buses.map((b) => (
            <div key={b.id} className="card px-4 py-3 text-sm">
              <div className="font-semibold">{b.name}</div>
              <div className="text-slate-500">
                {b.plate} · {b.totalSeats} seats · {b.seatsPerRow}/row
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Upcoming trips</h2>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Departure</th>
                <th className="px-4 py-3">Route</th>
                <th className="px-4 py-3">Bus</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trips.map((t) => {
                const sold = t.totalSeats - t.seatsLeft;
                const pct = Math.round((sold / t.totalSeats) * 100);
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(t.departureAt)} {formatTime(t.departureAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/trips/${t.id}`} className="font-medium hover:text-indigo-600">
                        {t.origin} → {t.destination}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{t.plate}</td>
                    <td className="px-4 py-3">{formatPrice(t.price)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200">
                          <div className="h-full rounded-full bg-indigo-600" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-600 tabular-nums">
                          {sold}/{t.totalSeats}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
