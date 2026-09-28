import { AdBanner } from "@/components/AdBanner";
import { EmptyState } from "@/components/EmptyState";
import { SearchForm } from "@/components/SearchForm";
import { TripCard } from "@/components/TripCard";
import { ads } from "@/lib/ads";
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
      <AdBanner ads={ads} />

      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4">
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
