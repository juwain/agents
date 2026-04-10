import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { resolve } from "path";

const DATA_DIR = resolve(process.cwd(), "data");
const PROFILE_PATH = resolve(DATA_DIR, "passenger_profile.json");

export function loadProfile(): Record<string, string> {
  if (existsSync(PROFILE_PATH)) {
    try {
      return JSON.parse(readFileSync(PROFILE_PATH, "utf-8"));
    } catch {
      saveProfile({});
      return {};
    }
  }
  return {};
}

export function saveProfile(profile: Record<string, string>): void {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(PROFILE_PATH, JSON.stringify(profile, null, 2));
}

export const updatePassengerProfile = tool(
  async ({ key, value }) => {
    console.log(`[TOOL] update_passenger_profile(key='${key}', value='${value}')`);
    const profile = loadProfile();
    profile[key] = value;
    saveProfile(profile);
    return `Profile updated: ${key} = '${value}'`;
  },
  {
    name: "update_passenger_profile",
    description:
      "Update a field in the passenger's persistent profile. Recommended fields: name, passport, email, seat_preference, meal_preference.",
    schema: z.object({
      key: z.string().describe("Field name to update (e.g. 'meal_preference')"),
      value: z.string().describe("New value for the field (e.g. 'vegetarian')"),
    }),
  }
);
