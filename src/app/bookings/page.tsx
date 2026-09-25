import { redirect } from "next/navigation";
import { BookingList } from "@/components/BookingList";
import { getCurrentUser } from "@/lib/auth";
import { getUserBookings } from "@/lib/data";

export default async function BookingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/bookings");
  const bookings = await getUserBookings(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-8 text-3xl font-bold">My bookings</h1>
      <BookingList bookings={bookings} />
    </div>
  );
}
