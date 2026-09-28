// End-to-end API check against a running app with seeded data: npm run smoke [-- BASE_URL]
const BASE = process.env.BASE_URL || process.argv[2] || "http://localhost:3000";

let failures = 0;
function check(name, ok, detail = "") {
  console.log(`${ok ? "✓" : "✗"} ${name}${ok ? "" : `  ${detail}`}`);
  if (!ok) failures++;
}

/** Tiny client that keeps the session cookie between requests. */
function session() {
  let cookie = "";
  return async (method, path, body) => {
    const res = await fetch(BASE + path, {
      method,
      headers: { ...(body && { "Content-Type": "application/json" }), ...(cookie && { Cookie: cookie }) },
      body: body && JSON.stringify(body),
      redirect: "manual",
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  };
}

const user = session();
const email = `smoke-${Date.now()}@test.local`;

let r = await user("POST", "/api/auth/register", { name: "Smoke Test", email, password: "secret123" });
check("register", r.status === 201, JSON.stringify(r));

r = await user("POST", "/api/auth/login", { email, password: "wrong" });
check("wrong password rejected", r.status === 401, JSON.stringify(r));

r = await user("POST", "/api/auth/login", { email, password: "secret123" });
check("login", r.status === 200, JSON.stringify(r));

r = await user("GET", "/api/trips?from=Colombo");
const trip = r.data?.trips?.find((t) => t.seatsLeft >= 10);
check("search trips", r.status === 200 && Boolean(trip), JSON.stringify(r).slice(0, 200));
if (!trip) {
  console.error("No bookable trip found — is the database seeded?");
  process.exit(1);
}

r = await user("GET", `/api/trips/${trip.id}`);
const free = [];
for (let s = 1; s <= trip.totalSeats && free.length < 4; s++) if (!r.data.trip.bookedSeats.includes(s)) free.push(s);
const [a, b, c, raceSeat] = free;

r = await user("POST", "/api/bookings", { tripId: trip.id, seats: [a, b] });
check("book two seats", r.status === 201 && r.data.bookings.length === 2, JSON.stringify(r));

r = await user("POST", "/api/bookings", { tripId: trip.id, seats: [b, c] });
check("double booking rejected (409)", r.status === 409, JSON.stringify(r));

r = await user("GET", "/api/bookings");
const booking = r.data?.bookings?.find((x) => x.tripId === trip.id && x.seatNumber === b && x.status === "booked");
check("list my bookings", r.status === 200 && Boolean(booking), JSON.stringify(r).slice(0, 200));

r = await user("DELETE", `/api/bookings/${booking?.id}`);
check("cancel booking", r.status === 200, JSON.stringify(r));

r = await user("POST", "/api/bookings", { tripId: trip.id, seats: [b] });
check("re-book cancelled seat", r.status === 201, JSON.stringify(r));

r = await user("POST", "/api/trips", {});
check("non-admin can't create trips (403)", r.status === 403, JSON.stringify(r));

r = await session()("POST", "/api/bookings", { tripId: trip.id, seats: [c] });
check("logged-out booking rejected (401)", r.status === 401, JSON.stringify(r));

const race = await Promise.all(
  Array.from({ length: 5 }, () => user("POST", "/api/bookings", { tripId: trip.id, seats: [raceSeat] })),
);
const codes = race.map((x) => x.status).sort();
check("5 parallel bookings of one seat → exactly one wins", codes.join() === "201,409,409,409,409", codes.join());

// Clean up so repeated runs against the same database don't fill the bus.
r = await user("GET", "/api/bookings");
for (const bk of r.data.bookings.filter((x) => x.status === "booked")) await user("DELETE", `/api/bookings/${bk.id}`);

console.log(failures ? `\n${failures} check(s) failed` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
