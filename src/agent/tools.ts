import { tool } from "@langchain/core/tools";
import { z } from "zod";

// --- Mock database for demonstration ---

interface Flight {
  flight_id: string;
  origin: string;
  destination: string;
  date: string;
  departure: string;
  arrival: string;
  price: number;
  available_seats: number;
}

interface Reservation {
  reservation_id: string;
  user_id: string;
  flight_id: string;
  origin: string;
  destination: string;
  date: string;
  passengers: number;
  total_price: number;
  status: string;
}

interface UserProfile {
  user_id: string;
  name: string;
  membership_tier: string;
  reservations: string[];
}

const _FLIGHTS: Flight[] = [
  { flight_id: "AA123", origin: "SFO", destination: "NYC", date: "2026-04-10", departure: "10:00", arrival: "18:30", price: 299, available_seats: 4 },
  { flight_id: "AA456", origin: "SFO", destination: "NYC", date: "2026-04-10", departure: "14:00", arrival: "22:30", price: 249, available_seats: 2 },
  { flight_id: "UA789", origin: "NYC", destination: "LAX", date: "2026-04-12", departure: "08:00", arrival: "11:00", price: 199, available_seats: 10 },
  { flight_id: "DL001", origin: "LAX", destination: "SFO", date: "2026-04-15", departure: "16:00", arrival: "17:30", price: 129, available_seats: 7 },
];

const _RESERVATIONS: Record<string, Reservation> = {};

const _USER_PROFILES: Record<string, UserProfile> = {
  emma_kim_9957: {
    user_id: "emma_kim_9957",
    name: "Emma Kim",
    membership_tier: "regular",
    reservations: ["EHGLP3"],
  },
};

export const searchFlights = tool(
  async ({ origin, destination, date }) => {
    const results = _FLIGHTS.filter(
      (f) =>
        f.origin.toUpperCase() === origin.toUpperCase() &&
        f.destination.toUpperCase() === destination.toUpperCase() &&
        f.date === date &&
        f.available_seats > 0
    );
    return JSON.stringify(results, null, 2);
  },
  {
    name: "search_flights",
    description:
      "Search for available flights between two cities on a given date.",
    schema: z.object({
      origin: z.string().describe('Departure airport code (e.g. "SFO")'),
      destination: z.string().describe('Arrival airport code (e.g. "NYC")'),
      date: z.string().describe("Date in YYYY-MM-DD format"),
    }),
  }
);

export const getUserProfile = tool(
  async ({ user_id }) => {
    const profile = _USER_PROFILES[user_id];
    if (!profile) {
      return JSON.stringify({ error: `User ${user_id} not found` });
    }
    return JSON.stringify(profile, null, 2);
  },
  {
    name: "get_user_profile",
    description: "Look up a user's profile and membership information.",
    schema: z.object({
      user_id: z.string().describe("The user's unique identifier"),
    }),
  }
);

export const getReservation = tool(
  async ({ reservation_id }) => {
    const res = _RESERVATIONS[reservation_id];
    if (!res) {
      return JSON.stringify({ error: `Reservation ${reservation_id} not found` });
    }
    return JSON.stringify(res, null, 2);
  },
  {
    name: "get_reservation",
    description: "Look up an existing reservation by its ID.",
    schema: z.object({
      reservation_id: z.string().describe('The reservation code (e.g. "EHGLP3")'),
    }),
  }
);

export const bookFlight = tool(
  async ({ user_id, flight_id, passengers }) => {
    const flight = _FLIGHTS.find((f) => f.flight_id === flight_id);
    if (!flight) {
      return JSON.stringify({ error: `Flight ${flight_id} not found` });
    }
    if (flight.available_seats < passengers) {
      return JSON.stringify({
        error: `Not enough seats. Available: ${flight.available_seats}`,
      });
    }

    const reservationId = `RES${String(Object.keys(_RESERVATIONS).length + 1).padStart(4, "0")}`;
    _RESERVATIONS[reservationId] = {
      reservation_id: reservationId,
      user_id,
      flight_id,
      origin: flight.origin,
      destination: flight.destination,
      date: flight.date,
      passengers,
      total_price: flight.price * passengers,
      status: "confirmed",
    };
    flight.available_seats -= passengers;
    return JSON.stringify(_RESERVATIONS[reservationId], null, 2);
  },
  {
    name: "book_flight",
    description: "Book a flight for a user.",
    schema: z.object({
      user_id: z.string().describe("The user's unique identifier"),
      flight_id: z.string().describe('The flight to book (e.g. "AA123")'),
      passengers: z.number().describe("Number of passengers"),
    }),
  }
);

export const cancelReservation = tool(
  async ({ reservation_id, user_id }) => {
    const res = _RESERVATIONS[reservation_id];
    if (!res) {
      return JSON.stringify({ error: `Reservation ${reservation_id} not found` });
    }
    if (res.user_id !== user_id) {
      return JSON.stringify({ error: "Reservation does not belong to this user" });
    }
    if (res.status === "cancelled") {
      return JSON.stringify({ error: "Reservation is already cancelled" });
    }

    res.status = "cancelled";
    const flight = _FLIGHTS.find((f) => f.flight_id === res.flight_id)!;
    flight.available_seats += res.passengers;
    return JSON.stringify({ status: "cancelled", reservation_id });
  },
  {
    name: "cancel_reservation",
    description:
      "Cancel an existing reservation. Only allowed within 24 hours of booking.",
    schema: z.object({
      reservation_id: z.string().describe("The reservation code to cancel"),
      user_id: z.string().describe("The user requesting cancellation (for verification)"),
    }),
  }
);

export const ALL_TOOLS = [
  searchFlights,
  getUserProfile,
  getReservation,
  bookFlight,
  cancelReservation,
];
