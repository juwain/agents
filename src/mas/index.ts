import { SpecializedAgent } from "./specialistAgent.js";
import { FLIGHT_TOOLS, POLICY_TOOLS, BOOKING_TOOLS_MAS } from "../agent/tools/index.js";
import {
  FLIGHT_AGENT_PROMPT,
  POLICY_AGENT_PROMPT,
  BOOKING_AGENT_PROMPT,
} from "./prompts.js";

export function createSpecialists(): Record<string, SpecializedAgent> {
  return {
    flight_agent: new SpecializedAgent("FlightAgent", FLIGHT_TOOLS, FLIGHT_AGENT_PROMPT),
    policy_agent: new SpecializedAgent("PolicyAgent", POLICY_TOOLS, POLICY_AGENT_PROMPT),
    booking_agent: new SpecializedAgent("BookingAgent", BOOKING_TOOLS_MAS, BOOKING_AGENT_PROMPT),
  };
}
