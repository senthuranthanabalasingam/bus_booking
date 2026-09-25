-- Bus seat booking schema. Safe to re-run: drops and recreates all tables.

DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS trips;
DROP TABLE IF EXISTS buses;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE buses (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  plate         TEXT NOT NULL UNIQUE,
  total_seats   INT NOT NULL CHECK (total_seats > 0 AND total_seats <= 80),
  seats_per_row INT NOT NULL DEFAULT 4 CHECK (seats_per_row BETWEEN 2 AND 6)
);

CREATE TABLE trips (
  id           SERIAL PRIMARY KEY,
  bus_id       INT NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  origin       TEXT NOT NULL,
  destination  TEXT NOT NULL,
  departure_at TIMESTAMPTZ NOT NULL,
  arrival_at   TIMESTAMPTZ NOT NULL,
  price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  CHECK (arrival_at > departure_at),
  CHECK (origin <> destination)
);

CREATE INDEX trips_search_idx ON trips (lower(origin), lower(destination), departure_at);

CREATE TABLE bookings (
  id          SERIAL PRIMARY KEY,
  user_id     INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trip_id     INT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  seat_number INT NOT NULL CHECK (seat_number > 0),
  status      TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('booked', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A seat can only have one active booking per trip; cancelled rows don't block re-booking.
CREATE UNIQUE INDEX bookings_active_seat_idx ON bookings (trip_id, seat_number) WHERE status = 'booked';
CREATE INDEX bookings_user_idx ON bookings (user_id);
