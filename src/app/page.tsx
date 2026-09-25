import { EmptyState } from "@/components/EmptyState";
import { SearchForm } from "@/components/SearchForm";
import { TripCard } from "@/components/TripCard";
import { listCities, searchTrips } from "@/lib/data";
import { tripSearchSchema } from "@/lib/validation";
import Link from "next/link";

export default async function HomePage(props: PageProps<"/">) {
  const parsed = tripSearchSchema.safeParse(await props.searchParams);
  const filters = parsed.success ? parsed.data : { from: "", to: "", date: undefined };
  const [trips, cities] = await Promise.all([searchTrips(filters), listCities()]);
  const filtered = Boolean(filters.from || filters.to || filters.date);

  return (
    <>
      <section className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 pb-24 pt-14 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">Your seat, your trip.</h1>
          <p className="mt-3 max-w-xl text-indigo-100">
            Search routes, pick exactly the seat you want, and you&apos;re good to go.
          </p>
        </div>
      </section>

      <div className="mx-auto -mt-16 max-w-6xl px-4">
        <SearchForm key={JSON.stringify(filters)} cities={cities} initial={filters} />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">
            {filtered ? `${trips.length} trip${trips.length === 1 ? "" : "s"} found` : "Upcoming departures"}
          </h2>
          {filtered && (
            <Link href="/" className="text-sm font-medium text-indigo-600 hover:underline">
              Clear filters
            </Link>
          )}
        </div>
        {trips.length ? (
          <div className="grid gap-3">
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        ) : (
          <EmptyState title="No trips found" text="Try another date or a different city." />
        )}
      </section>
    </>
  );
}
