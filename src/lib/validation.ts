import { z } from "zod";

import { MAX_SEATS_PER_BOOKING } from "./constants";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const busSchema = z.object({
  name: z.string().trim().min(2, "Bus name is required").max(80),
  plate: z.string().trim().min(2, "Plate is required").max(20).transform((p) => p.toUpperCase()),
  totalSeats: z.coerce.number().int().min(1).max(80, "A bus can have at most 80 seats"),
  seatsPerRow: z.coerce.number().int().min(2).max(6),
});

export const tripSchema = z
  .object({
    busId: z.coerce.number().int().positive("Choose a bus"),
    origin: z.string().trim().min(2, "Origin is required").max(80),
    destination: z.string().trim().min(2, "Destination is required").max(80),
    departureAt: z.coerce.date("Departure time is required"),
    arrivalAt: z.coerce.date("Arrival time is required"),
    price: z.coerce.number().min(0, "Price can't be negative").max(100000),
  })
  .refine((t) => t.arrivalAt > t.departureAt, { message: "Arrival must be after departure" })
  .refine((t) => t.departureAt > new Date(), { message: "Departure must be in the future" })
  .refine((t) => t.origin.toLowerCase() !== t.destination.toLowerCase(), {
    message: "Origin and destination must differ",
  });

export const bookingSchema = z.object({
  tripId: z.coerce.number().int().positive(),
  seats: z
    .array(z.number().int().positive())
    .min(1, "Select at least one seat")
    .max(MAX_SEATS_PER_BOOKING, `You can book at most ${MAX_SEATS_PER_BOOKING} seats at once`)
    .refine((s) => new Set(s).size === s.length, "Duplicate seat numbers"),
});

export const tripSearchSchema = z.object({
  from: z.string().trim().max(80).optional().default(""),
  to: z.string().trim().max(80).optional().default(""),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export const idSchema = z.coerce.number().int().positive();
