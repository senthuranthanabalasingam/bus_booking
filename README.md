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
npm run db:migrate # creates tables (applies db/migrations/*.sql)
npm run db:seed    # demo users, buses and a week of trips (wipes existing data)

# 4. Run
npm run dev        # http://localhost:3000 (or the next free port)

# Start over locally (refuses to run against a non-local database)
npm run db:reset && npm run db:seed
```

All times are Sri Lanka time (`Asia/Colombo`), whatever time zone the server runs in.

Demo logins: `user@bus.test / user123`, admin `admin@bus.test / admin123`.

## Project structure

```
db/migrations/*.sql      Schema changes, applied in filename order
scripts/db-migrate.mjs   Applies pending migrations (tracked in schema_migrations)
scripts/db-reset.mjs     Local only: wipe DB and re-run migrations
scripts/db-seed.mjs      Demo data
scripts/smoke-test.mjs   End-to-end API test (npm run smoke)
.github/workflows/ci.yml GitHub Actions CI
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

## CI/CD

**CI – GitHub Actions** (`.github/workflows/ci.yml`) runs on every push and pull request, against a fresh PostgreSQL 15:
lint → type check → migrate (twice, to prove it's idempotent) → seed → build → start → `npm run smoke`.
It needs no secrets and never touches the production database.

**CD – Vercel Git integration.** Pushing to `main` deploys production; other branches and PRs get preview URLs.
Vercel runs `npm run vercel-build`, which applies pending migrations **only for production deploys** and then builds.
Migrations use `DATABASE_URL_UNPOOLED` (Neon's direct connection) when set, otherwise `DATABASE_URL`.

### Changing the database schema

Never edit an applied migration. Add a new file instead, e.g. `db/migrations/002_add_bus_type.sql`, run
`npm run db:migrate` locally, then push. The next production deploy applies it.

### One-time production setup

1. Vercel → Project → Settings → Environment Variables: `DATABASE_URL` / `DATABASE_URL_UNPOOLED` (added by the Neon
   integration) and `JWT_SECRET` (a new random value) for Production and Preview.
2. After the first production deploy has created the tables, load the demo data once:
   `DATABASE_URL="<Neon direct connection URL>" npm run db:seed`.
   Seeding refuses to run against a non-local database that already has users.
3. Recommended: GitHub → Settings → Branches → protect `main` and require the **CI** check.

Preview deployments use the same database as production unless you enable Neon preview branches in the Vercel integration.
