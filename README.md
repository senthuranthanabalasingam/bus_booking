# BusGo – Bus Seat Booking

A Next.js 16 (App Router) + PostgreSQL app for searching bus trips, picking seats on an interactive seat map, and managing bookings.

- **Users:** register / log in (JWT in an httpOnly cookie), search trips, book up to 6 seats at a time, view and cancel bookings.
- **Admins:** add buses and schedule trips, see occupancy per trip.
- **No double booking:** a partial unique index on `bookings(trip_id, seat_number) WHERE status = 'booked'` makes the database reject a seat that's already taken, even under concurrent requests. Cancelled seats become bookable again.

## Setup

Requires Node 20+ and PostgreSQL.

```bash
# 1. Start PostgreSQL and create the database (Homebrew example)
brew services start postgresql@15
createdb bus_booking

# 2. Configure environment
cp .env.example .env.local   # then edit DATABASE_URL and JWT_SECRET

# 3. Install, create tables, add demo data
npm install
npm run db:init    # drops and recreates all tables
npm run db:seed    # demo users, buses and a week of trips

# 4. Run
npm run dev        # http://localhost:3000 (or the next free port)
```

Demo logins: `user@bus.test / user123`, admin `admin@bus.test / admin123`.

## Project structure

```
db/schema.sql            Tables, constraints, indexes
scripts/db-init.mjs      Applies schema.sql
scripts/db-seed.mjs      Demo data
src/proxy.ts             Redirects logged-out visitors away from /bookings and /admin
src/lib/db.ts            pg Pool + withTransaction()
src/lib/data.ts          All SQL queries (used by pages and API routes)
src/lib/auth.ts          Password hashing, session cookie, requireUser/requireAdmin
src/lib/session.ts       JWT sign/verify (jose)
src/lib/validation.ts    zod input schemas
src/app/api/**           REST API route handlers
src/app/**/page.tsx      Pages (server components)
src/components/**        UI components (seat map, forms, toasts…)
```

## API

All responses are JSON; errors look like `{ "error": "message" }`.

| Method | Path | Auth | Description |
| ------ | ---- | ---- | ----------- |
| POST | `/api/auth/register` | – | `{ name, email, password }` → creates account and logs in |
| POST | `/api/auth/login` | – | `{ email, password }` |
| POST | `/api/auth/logout` | – | Clears the session cookie |
| GET | `/api/auth/me` | – | Current user or `null` |
| GET | `/api/trips?from=&to=&date=YYYY-MM-DD` | – | Search upcoming trips (city prefix match) |
| GET | `/api/trips/:id` | – | Trip details + `bookedSeats` |
| POST | `/api/trips` | admin | `{ busId, origin, destination, departureAt, arrivalAt, price }` |
| GET | `/api/buses` | – | List buses |
| POST | `/api/buses` | admin | `{ name, plate, totalSeats, seatsPerRow }` |
| GET | `/api/bookings` | user | Your bookings |
| POST | `/api/bookings` | user | `{ tripId, seats: [1, 2] }` – all-or-nothing; `409` if any seat is taken |
| DELETE | `/api/bookings/:id` | owner/admin | Cancel a booking (before departure) |
