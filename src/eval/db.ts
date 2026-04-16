import type { EvalDB } from "./types.js";

const INITIAL_DB: EvalDB = {
  flights: {
    SU2454_0220: { id: "SU2454", from: "MOW", to: "PAR", date: "2026-02-20", time: "08:30", price: 25000, seats: 5 },
    SU2456_0220: { id: "SU2456", from: "MOW", to: "PAR", date: "2026-02-20", time: "12:30", price: 27000, seats: 25 },
    SU2458_0220: { id: "SU2458", from: "MOW", to: "PAR", date: "2026-02-20", time: "18:30", price: 29000, seats: 10 },
    AF1845_0220: { id: "AF1845", from: "MOW", to: "PAR", date: "2026-02-20", time: "10:00", price: 32000, seats: 15 },
    SU2580_0220: { id: "SU2580", from: "MOW", to: "LON", date: "2026-02-20", time: "09:00", price: 28000, seats: 12 },
    BA234_0220:  { id: "BA234",  from: "MOW", to: "LON", date: "2026-02-20", time: "14:00", price: 35000, seats: 8 },
    SU2454_0221: { id: "SU2454", from: "MOW", to: "PAR", date: "2026-02-21", time: "08:30", price: 24000, seats: 30 },
    SU2456_0221: { id: "SU2456", from: "MOW", to: "PAR", date: "2026-02-21", time: "12:30", price: 26000, seats: 20 },
  },
  bookings: {
    ABC123: { passenger: "Ivan Petrov",    flight_key: "SU2454_0220", status: "confirmed", class: "economy" },
    XYZ789: { passenger: "Maria Sidorova", flight_key: "SU2580_0220", status: "confirmed", class: "business" },
  },
};

let DB: EvalDB = structuredClone(INITIAL_DB);

export function freshDB(): EvalDB {
  DB = structuredClone(INITIAL_DB);
  return DB;
}

export function getDB(): EvalDB {
  return DB;
}

export function setDB(db: EvalDB): void {
  DB = db;
}

export function snapshotDB(): EvalDB {
  return structuredClone(DB);
}
