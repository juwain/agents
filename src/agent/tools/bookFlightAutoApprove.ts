import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { createHash } from "crypto";
import { FLIGHTS } from "../data/flights.js";

const flightIds = FLIGHTS.map((f) => f.flight_id);

/**
 * Auto-approved version of book_flight for MAS mode.
 * In MAS the coordinator orchestrates agents without a checkpointer,
 * so interrupt()-based human-in-the-loop is not available.
 */
export const bookFlightAutoApprove = tool(
  async ({ flight_id, passenger_name, email, passport, seat_preference }) => {
    console.log(
      `[TOOL] book_flight(flight_id='${flight_id}', passenger='${passenger_name}', email='${email}', passport='${passport}', seat='${seat_preference ?? "none"}')`
    );

    const flight = FLIGHTS.find((f) => f.flight_id === flight_id);
    if (!flight) {
      return `Error: flight ${flight_id} not found. Available: ${flightIds.join(", ")}`;
    }

    const ref =
      "BK" +
      createHash("md5")
        .update(`${flight_id}${email}`)
        .digest("hex")
        .slice(0, 6)
        .toUpperCase();

    return [
      `\u2705 Booking confirmed (auto-approved in MAS mode)!`,
      `  Reference: ${ref}`,
      `  Flight: ${flight_id} — ${flight.origin} → ${flight.destination}`,
      `  Date: ${flight.date}  Departure: ${flight.departure_time}`,
      `  Class: ${flight.fare_class}  Price: $${flight.price}`,
      `  Passenger: ${passenger_name}`,
      `  Passport: ${passport}`,
      `  Email: ${email}`,
      `  Seat preference: ${seat_preference ?? "no preference"}`,
    ].join("\n");
  },
  {
    name: "book_flight",
    description:
      "Book a flight for a passenger. Requires flight_id, passenger_name, email, and passport. Use data from the passenger profile if available.",
    schema: z.object({
      flight_id: z
        .string()
        .describe("Flight ID from search_flights results (e.g. 'SU-101')"),
      passenger_name: z.string().describe("Full name of the passenger"),
      email: z
        .string()
        .email()
        .describe("Passenger's email address for booking confirmation"),
      passport: z.string().describe("Passport number"),
      seat_preference: z
        .string()
        .optional()
        .describe("Seat preference (e.g. 'window', 'aisle')"),
    }),
  }
);
