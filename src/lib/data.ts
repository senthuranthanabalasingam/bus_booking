import "server-only";
import { query, withTransaction } from "./db";
import { HttpError, isUniqueViolation } from "./http";
import type { SessionUser } from "./session";
import type { Booking, Bus, TripDetail, TripSummary } from "./types";

// Shared SELECT for trip listings: trip + bus + how many seats are still free.
const TRIP_SUMMARY_SQL = `
  SELECT t.id, t.origin, t.destination, t.departure_at AS "departureAt", t.arrival_at AS "arrivalAt",
         t.price, b.id AS "busId", b.name AS "busName", b.plate, b.total_seats AS "totalSeats",
         b.seats_per_row AS "seatsPerRow",
         b.total_seats - COUNT(bk.id)::int AS "seatsLeft"
    FROM trips t
    JOIN buses b ON b.id = t.bus_id
    LEFT JOIN bookings bk ON bk.trip_id = t.id AND bk.status = 'booked'`;

export async function searchTrips({ from, to, date }: { from: string; to: string; date?: string }) {
  return query<TripSummary>(
    `${TRIP_SUMMARY_SQL}
      WHERE t.departure_at > now()
        AND ($1 = '' OR t.origin ILIKE $1 || '%')
        AND ($2 = '' OR t.destination ILIKE $2 || '%')
        AND ($3::date IS NULL OR t.departure_at::date = $3::date)
      GROUP BY t.id, b.id
      ORDER BY t.departure_at
      LIMIT 100`,
    [from, to, date ?? null],
  );
}

export async function listCities() {
  const rows = await query<{ city: string }>(
    `SELECT origin AS city FROM trips UNION SELECT destination FROM trips ORDER BY city`,
  );
  return rows.map((r) => r.city);
}

export async function getTrip(id: number): Promise<TripDetail | null> {
  const [trip] = await query<TripSummary>(
    `${TRIP_SUMMARY_SQL}
      WHERE t.id = $1
      GROUP BY t.id, b.id`,
    [id],
  );
  if (!trip) return null;
  const seats = await query<{ seatNumber: number; userId: number }>(
    `SELECT seat_number AS "seatNumber", user_id AS "userId"
       FROM bookings WHERE trip_id = $1 AND status = 'booked' ORDER BY seat_number`,
    [id],
  );
  return { ...trip, bookedSeats: seats };
}

export async function getUserBookings(userId: number) {
  return query<Booking>(
    `SELECT bk.id, bk.seat_number AS "seatNumber", bk.status, bk.created_at AS "createdAt",
            t.id AS "tripId", t.origin, t.destination, t.departure_at AS "departureAt",
            t.arrival_at AS "arrivalAt", t.price, b.name AS "busName", b.plate
       FROM bookings bk
       JOIN trips t ON t.id = bk.trip_id
       JOIN buses b ON b.id = t.bus_id
      WHERE bk.user_id = $1
      ORDER BY t.departure_at DESC, bk.seat_number`,
    [userId],
  );
}

export async function createBookings(userId: number, tripId: number, seats: number[]) {
  try {
    return await withTransaction(async (client) => {
      const { rows } = await client.query<{ totalSeats: number; departed: boolean }>(
        `SELECT b.total_seats AS "totalSeats", t.departure_at <= now() AS departed
           FROM trips t JOIN buses b ON b.id = t.bus_id WHERE t.id = $1`,
        [tripId],
      );
      const trip = rows[0];
      if (!trip) throw new HttpError(404, "Trip not found");
      if (trip.departed) throw new HttpError(400, "This trip has already departed");
      const invalid = seats.filter((s) => s > trip.totalSeats);
      if (invalid.length) throw new HttpError(400, `Seat ${invalid.join(", ")} does not exist on this bus`);

      // The partial unique index rejects any seat that already has an active booking.
      const inserted = await client.query<{ id: number; seatNumber: number }>(
        `INSERT INTO bookings (user_id, trip_id, seat_number)
         SELECT $1, $2, unnest($3::int[])
         RETURNING id, seat_number AS "seatNumber"`,
        [userId, tripId, seats],
      );
      return inserted.rows;
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HttpError(409, "Sorry, one or more of those seats were just booked. Please pick again.");
    }
    throw err;
  }
}

export async function cancelBooking(user: SessionUser, bookingId: number) {
  const [booking] = await query<{ userId: number; status: string; departed: boolean }>(
    `SELECT bk.user_id AS "userId", bk.status, t.departure_at <= now() AS departed
       FROM bookings bk JOIN trips t ON t.id = bk.trip_id WHERE bk.id = $1`,
    [bookingId],
  );
  if (!booking || (booking.userId !== user.id && user.role !== "admin")) {
    throw new HttpError(404, "Booking not found");
  }
  if (booking.status === "cancelled") throw new HttpError(400, "Booking is already cancelled");
  if (booking.departed) throw new HttpError(400, "Can't cancel a trip that has already departed");
  await query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [bookingId]);
}

export async function listBuses() {
  return query<Bus>(
    `SELECT id, name, plate, total_seats AS "totalSeats", seats_per_row AS "seatsPerRow"
       FROM buses ORDER BY name`,
  );
}

export async function createBus(bus: Omit<Bus, "id">) {
  try {
    const [row] = await query<Bus>(
      `INSERT INTO buses (name, plate, total_seats, seats_per_row) VALUES ($1, $2, $3, $4)
       RETURNING id, name, plate, total_seats AS "totalSeats", seats_per_row AS "seatsPerRow"`,
      [bus.name, bus.plate, bus.totalSeats, bus.seatsPerRow],
    );
    return row;
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, "A bus with that plate already exists");
    throw err;
  }
}

export async function createTrip(trip: {
  busId: number;
  origin: string;
  destination: string;
  departureAt: Date;
  arrivalAt: Date;
  price: number;
}) {
  const [bus] = await query(`SELECT id FROM buses WHERE id = $1`, [trip.busId]);
  if (!bus) throw new HttpError(400, "Bus not found");
  const [row] = await query<{ id: number }>(
    `INSERT INTO trips (bus_id, origin, destination, departure_at, arrival_at, price)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [trip.busId, trip.origin, trip.destination, trip.departureAt, trip.arrivalAt, trip.price],
  );
  return row;
}

export async function listUpcomingTrips() {
  return query<TripSummary>(
    `${TRIP_SUMMARY_SQL}
      WHERE t.departure_at > now()
      GROUP BY t.id, b.id
      ORDER BY t.departure_at
      LIMIT 50`,
  );
}

export async function findUserByEmail(email: string) {
  const [user] = await query<SessionUser & { passwordHash: string }>(
    `SELECT id, name, email, role, password_hash AS "passwordHash" FROM users WHERE email = $1`,
    [email],
  );
  return user ?? null;
}

export async function createUser(name: string, email: string, passwordHash: string) {
  try {
    const [user] = await query<SessionUser>(
      `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
       RETURNING id, name, email, role`,
      [name, email, passwordHash],
    );
    return user;
  } catch (err) {
    if (isUniqueViolation(err)) throw new HttpError(409, "An account with that email already exists");
    throw err;
  }
}
