import { searchFlights } from "./searchFlights.js";
import { lookupPolicy } from "./lookupPolicy.js";
import { updatePassengerProfile } from "./updateProfile.js";
import { bookFlight } from "./bookFlight.js";

export { searchFlights, lookupPolicy, updatePassengerProfile, bookFlight };

export const ALL_TOOLS = [
  searchFlights,
  lookupPolicy,
  updatePassengerProfile,
  bookFlight,
];
