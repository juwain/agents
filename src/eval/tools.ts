import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getDB } from "./db.js";

export const getBooking = tool(
  async ({ booking_id }) => {
    const DB = getDB();
    const b = DB.bookings[booking_id];
    if (!b) {
      return JSON.stringify({ error: `Booking ${booking_id} not found` });
    }
    const f = DB.flights[b.flight_key] ?? {};
    return JSON.stringify({ booking_id, ...b, flight: f });
  },
  {
    name: "get_booking",
    description: "Get a booking by ID.",
    schema: z.object({
      booking_id: z.string().describe("Booking ID, e.g. ABC123"),
    }),
  }
);

export const searchFlights = tool(
  async ({ origin, destination, date }) => {
    const DB = getDB();
    // v2: returns flight_key so agent can use it in change_booking
    const results = Object.entries(DB.flights)
      .filter(([, f]) => f.from === origin && f.to === destination && f.date === date && f.seats > 0)
      .map(([flight_key, f]) => ({ flight_key, ...f }))
      .sort((a, b) => a.time.localeCompare(b.time));
    return JSON.stringify(results);
  },
  {
    name: "search_flights",
    description: "Search for available flights. origin/destination — codes (MOW, PAR, LON). date — YYYY-MM-DD.",
    schema: z.object({
      origin: z.string().describe('Departure city code (e.g. "MOW")'),
      destination: z.string().describe('Arrival city code (e.g. "PAR")'),
      date: z.string().describe("Travel date — YYYY-MM-DD"),
    }),
  }
);

export const changeBooking = tool(
  async ({ booking_id, new_flight_key }) => {
    const DB = getDB();
    const b = DB.bookings[booking_id];
    if (!b) {
      return JSON.stringify({ error: "Booking not found" });
    }
    const nf = DB.flights[new_flight_key];
    if (!nf) {
      return JSON.stringify({ error: "Flight not found" });
    }
    if (nf.seats <= 0) {
      return JSON.stringify({ error: "No seats available" });
    }
    const oldF = DB.flights[b.flight_key];
    const diff = nf.price - (oldF?.price ?? 0);
    b.flight_key = new_flight_key;
    b.status = "changed";
    nf.seats -= 1;
    return JSON.stringify({ success: true, new_flight: nf.id, price_diff: diff });
  },
  {
    name: "change_booking",
    description: "Change a booking to a different flight. new_flight_key — flight key, e.g. SU2456_0220.",
    schema: z.object({
      booking_id: z.string().describe("Booking ID"),
      new_flight_key: z.string().describe("New flight key, e.g. SU2456_0220"),
    }),
  }
);

export const cancelBooking = tool(
  async ({ booking_id }) => {
    const DB = getDB();
    const b = DB.bookings[booking_id];
    if (!b) {
      return JSON.stringify({ error: "Booking not found" });
    }
    const f = DB.flights[b.flight_key];
    b.status = "cancelled";
    if (f) {
      f.seats += 1;
    }
    return JSON.stringify({ success: true, refund: f?.price ?? 0 });
  },
  {
    name: "cancel_booking",
    description: "Cancel a booking.",
    schema: z.object({
      booking_id: z.string().describe("Booking ID"),
    }),
  }
);

export const EVAL_TOOLS = [getBooking, searchFlights, changeBooking, cancelBooking];
