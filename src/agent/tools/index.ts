import { searchFlights } from "./searchFlights.js";
import { lookupPolicy } from "./lookupPolicy.js";
import { updatePassengerProfile } from "./updateProfile.js";
import { bookFlight } from "./bookFlight.js";
import { bookFlightAutoApprove } from "./bookFlightAutoApprove.js";

export { searchFlights, lookupPolicy, updatePassengerProfile, bookFlight, bookFlightAutoApprove };

export const ALL_TOOLS = [
  searchFlights,
  lookupPolicy,
  updatePassengerProfile,
  bookFlight,
];

export const FLIGHT_TOOLS = [searchFlights];
export const POLICY_TOOLS = [lookupPolicy];
export const BOOKING_TOOLS = [searchFlights, bookFlight, updatePassengerProfile];
// MAS version: auto-approve booking (no interrupt, no checkpointer needed)
export const BOOKING_TOOLS_MAS = [searchFlights, bookFlightAutoApprove, updatePassengerProfile];
