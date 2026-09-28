import bcrypt from "bcryptjs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const users = [
  { name: "Admin", email: "admin@bus.test", password: "admin123", role: "admin" },
  { name: "Demo User", email: "user@bus.test", password: "user123", role: "user" },
];

const buses = [
  { name: "Yutong Super Luxury", plate: "NC-4521", total_seats: 40, seats_per_row: 4 },
  { name: "Ashok Leyland Viking", plate: "NB-7788", total_seats: 32, seats_per_row: 4 },
  { name: "Toyota Coaster", plate: "ND-1290", total_seats: 15, seats_per_row: 3 },
];

// [origin, destination, departure hour, duration hours, price (LKR), bus index]
const routes = [
  ["Colombo", "Kandy", 6, 3.5, 1200, 0],
  ["Colombo", "Kandy", 14, 3.5, 1100, 1],
  ["Kandy", "Colombo", 9, 3.5, 1200, 0],
  ["Colombo", "Galle", 7, 2, 1150, 2],
  ["Galle", "Colombo", 16, 2, 1150, 2],
  ["Colombo", "Jaffna", 20, 9, 3500, 1],
  ["Colombo", "Nuwara Eliya", 8, 5.5, 1800, 0],
  ["Colombo", "Trincomalee", 10, 6, 2200, 1],
];

try {
  await client.connect();

  // Seeding truncates every table, so never do it to a remote database that already has data.
  const host = new URL(process.env.DATABASE_URL).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    const { rows } = await client.query("SELECT count(*)::int AS n FROM users");
    if (rows[0].n > 0) throw new Error(`${host} already has data; refusing to overwrite it.`);
  }

  await client.query("BEGIN");
  await client.query("TRUNCATE bookings, trips, buses, users RESTART IDENTITY CASCADE");

  const userIds = [];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    const { rows } = await client.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [u.name, u.email, hash, u.role],
    );
    userIds.push(rows[0].id);
  }

  const busIds = [];
  for (const b of buses) {
    const { rows } = await client.query(
      "INSERT INTO buses (name, plate, total_seats, seats_per_row) VALUES ($1, $2, $3, $4) RETURNING id",
      [b.name, b.plate, b.total_seats, b.seats_per_row],
    );
    busIds.push(rows[0].id);
  }

  let tripCount = 0;
  let firstTripId;
  for (let day = 0; day < 7; day++) {
    for (const [origin, destination, hour, duration, price, busIdx] of routes) {
      const departure = new Date();
      departure.setDate(departure.getDate() + day);
      departure.setHours(hour, 0, 0, 0);
      if (departure <= new Date()) continue; // skip trips that already left today
      const arrival = new Date(departure.getTime() + duration * 3600_000);
      const { rows } = await client.query(
        `INSERT INTO trips (bus_id, origin, destination, departure_at, arrival_at, price)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [busIds[busIdx], origin, destination, departure, arrival, price],
      );
      firstTripId ??= rows[0].id;
      tripCount++;
    }
  }

  // A few existing bookings so the seat map isn't empty.
  for (const seat of [1, 2, 5, 9, 10]) {
    await client.query("INSERT INTO bookings (user_id, trip_id, seat_number) VALUES ($1, $2, $3)", [
      userIds[0],
      firstTripId,
      seat,
    ]);
  }

  await client.query("COMMIT");
  console.log(`Seeded ${users.length} users, ${buses.length} buses, ${tripCount} trips.`);
  console.log("Logins: admin@bus.test / admin123, user@bus.test / user123");
} catch (err) {
  await client.query("ROLLBACK").catch(() => {});
  console.error("Seeding failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
