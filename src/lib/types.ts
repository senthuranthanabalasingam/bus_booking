// Shapes returned by the data layer and API. Dates arrive as Date on the server and ISO strings over JSON.
type DateValue = Date | string;

export type Bus = {
  id: number;
  name: string;
  plate: string;
  totalSeats: number;
  seatsPerRow: number;
};

export type TripSummary = {
  id: number;
  origin: string;
  destination: string;
  departureAt: DateValue;
  arrivalAt: DateValue;
  price: number;
  busId: number;
  busName: string;
  plate: string;
  totalSeats: number;
  seatsPerRow: number;
  seatsLeft: number;
};

export type TripDetail = TripSummary & {
  bookedSeats: { seatNumber: number; userId: number }[];
};

export type Booking = {
  id: number;
  seatNumber: number;
  status: "booked" | "cancelled";
  createdAt: DateValue;
  tripId: number;
  origin: string;
  destination: string;
  departureAt: DateValue;
  arrivalAt: DateValue;
  price: number;
  busName: string;
  plate: string;
};
