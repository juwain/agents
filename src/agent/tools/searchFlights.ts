import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { FLIGHTS } from "../data/flights.js";

const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function resolveDate(dateStr: string): string {
  const s = dateStr.trim().toLowerCase();
  const today = new Date();

  if (s === "today") return fmt(today);
  if (s === "tomorrow") {
    today.setDate(today.getDate() + 1);
    return fmt(today);
  }
  if (s === "next week") {
    today.setDate(today.getDate() + 7);
    return fmt(today);
  }

  for (const prefix of ["next ", ""]) {
    for (let i = 0; i < WEEKDAYS.length; i++) {
      if (s === prefix + WEEKDAYS[i]) {
        const targetDay = (i + 1) % 7; // JS: 0=Sun, notebook: 0=Mon
        const currentDay = today.getDay();
        let daysAhead = (targetDay - currentDay + 7) % 7 || 7;
        today.setDate(today.getDate() + daysAhead);
        return fmt(today);
      }
    }
  }

  return dateStr; // already YYYY-MM-DD
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const searchFlights = tool(
  async ({ origin, destination, date }) => {
    const resolved = resolveDate(date);
    console.log(
      `[TOOL] search_flights(origin='${origin}', destination='${destination}', date='${date}' → ${resolved})`
    );

    const results = FLIGHTS.filter(
      (f) =>
        f.origin.toLowerCase() === origin.toLowerCase() &&
        f.destination.toLowerCase() === destination.toLowerCase() &&
        f.date === resolved
    );

    console.log(`[TOOL] search_flights → found ${results.length} flights`);

    if (results.length === 0) {
      return `No flights found from ${origin} to ${destination} on ${resolved}.`;
    }
    return JSON.stringify(results, null, 2);
  },
  {
    name: "search_flights",
    description:
      "Search for available flights between two cities on a given date.",
    schema: z.object({
      origin: z.string().describe('Departure city (e.g. "Moscow")'),
      destination: z.string().describe('Arrival city (e.g. "London")'),
      date: z
        .string()
        .describe(
          'Travel date — YYYY-MM-DD or relative expression like "tomorrow", "next week", "next friday"'
        ),
    }),
  }
);
