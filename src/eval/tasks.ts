import { HumanMessage } from "@langchain/core/messages";
import { createEvalLLM } from "./llm.js";
import { TASK_GEN_PROMPT } from "./prompts.js";
import type { EvalTask } from "./types.js";

// ── 12 Hand-crafted tasks from the notebook ──

export const TASKS: EvalTask[] = [
  // Easy: simple informational queries
  {
    id: "t01", query: "Show information about booking ABC123",
    category: "info", difficulty: "easy", needs_dialogue: false,
    expected_state_changes: null, policies_to_check: [],
    scenario: null, user_context: null,
  },
  {
    id: "t02", query: "Find flights from Moscow to Paris on February 20",
    category: "search", difficulty: "easy", needs_dialogue: false,
    expected_state_changes: null, policies_to_check: [],
    scenario: null, user_context: null,
    comment: "Without an explicit date in the system prompt the agent may use the wrong year",
  },
  {
    id: "t03", query: "What is the status of booking XYZ789?",
    category: "info", difficulty: "easy", needs_dialogue: false,
    expected_state_changes: null, policies_to_check: [],
    scenario: null, user_context: null,
  },

  // Medium: require multiple steps or dialogue
  {
    id: "t04", query: "I want to move booking ABC123 to a later flight on the same day",
    category: "change", difficulty: "medium", needs_dialogue: true,
    expected_state_changes: { "bookings.ABC123.status": "changed" },
    validation_rule: { type: "compare_time", booking_path: "bookings.ABC123", field: "time", operator: "gt" },
    policies_to_check: [0, 1, 2],
    scenario: "You want to move booking ABC123 to a later flight on the same day",
    user_context: "Booking ABC123, passenger Ivan Petrov, current flight in the morning",
  },
  {
    id: "t05", query: "Cancel my booking ABC123",
    category: "cancel", difficulty: "medium", needs_dialogue: true,
    expected_state_changes: { "bookings.ABC123.status": "cancelled" },
    policies_to_check: [0],
    scenario: "You want to cancel booking ABC123",
    user_context: "Booking ABC123, passenger Ivan Petrov",
  },
  {
    id: "t06", query: "Find flights to London and compare with Paris on price on February 20",
    category: "search", difficulty: "medium", needs_dialogue: false,
    expected_state_changes: null, policies_to_check: [],
    scenario: null, user_context: null,
  },
  {
    id: "t07", query: "Move booking ABC123 to the afternoon flight at 12:30",
    category: "change", difficulty: "medium", needs_dialogue: true,
    expected_state_changes: { "bookings.ABC123.flight_key": "SU2456_0220", "bookings.ABC123.status": "changed" },
    policies_to_check: [0, 1, 2],
    scenario: "You want to move booking ABC123 to the 12:30 flight",
    user_context: "Booking ABC123, you want flight SU2456 at 12:30",
  },

  // Hard: complex conditions and edge cases
  {
    id: "t08", query: "Move ABC123 to tomorrow, but only if it will be cheaper than the current flight",
    category: "change", difficulty: "hard", needs_dialogue: true,
    expected_state_changes: { "bookings.ABC123.flight_key": "SU2454_0221", "bookings.ABC123.status": "changed" },
    policies_to_check: [0, 1, 2],
    scenario: "You want to move ABC123 to tomorrow, but ONLY if it is cheaper. If more expensive — refuse",
    user_context: "Booking ABC123, current price 25000",
  },
  {
    id: "t09", query: "Show booking FAKE000",
    category: "edge", difficulty: "hard", needs_dialogue: false,
    expected_state_changes: null, policies_to_check: [],
    scenario: null, user_context: null,
  },
  {
    id: "t10", query: "I want to change my flight but I don't remember my booking number. My last name is Petrov.",
    category: "edge", difficulty: "hard", needs_dialogue: true,
    expected_state_changes: null, policies_to_check: [4],
    scenario: "You want to change your flight but don't remember your booking number. Your last name is Petrov, you're flying to Paris.",
    user_context: "Booking number: ABC123, but you 'don't remember' it. Last name Petrov.",
  },

  // Extra Hard: provoking agent errors
  {
    id: "t11", query: "Move ABC123 to the cheapest flight tomorrow",
    category: "change", difficulty: "extra_hard", needs_dialogue: true,
    expected_state_changes: { "bookings.ABC123.flight_key": "SU2454_0221", "bookings.ABC123.status": "changed" },
    validation_rule: { type: "compare_price", booking_path: "bookings.ABC123", field: "price", operator: "min", filter: { date: "0221" } },
    policies_to_check: [0, 1, 2],
    scenario: "You want to move ABC123 to the cheapest flight tomorrow",
    user_context: "Booking ABC123, savings are important — pick the minimum price",
    comment: "Requires comparing prices of all flights — agent sometimes doesn't pick the minimum",
  },
  {
    id: "t12", query: "Cancel ABC123, but only if the cancellation fee is less than 5000",
    category: "cancel", difficulty: "extra_hard", needs_dialogue: true,
    expected_state_changes: null,
    policies_to_check: [0],
    scenario: "You want to cancel ABC123, but ONLY if the fee is less than 5000. If the assistant doesn't know the fee — refuse.",
    user_context: "Booking ABC123, willing to pay up to 5000 in fees, no more",
    comment: "Requires checking a condition that is not in the API — agent should refuse or ask",
  },
];

// ── LLM Task Generation ──

export async function generateTasks(count = 15): Promise<EvalTask[]> {
  const genLLM = createEvalLLM(undefined, 0.7);
  const resp = await genLLM.invoke([new HumanMessage(TASK_GEN_PROMPT)]);
  const content = resp.content as string;

  const match = content.match(/\[[\s\S]*\]/);
  if (!match) {
    console.log("  Failed to parse generated tasks");
    return [];
  }

  try {
    const raw = JSON.parse(match[0]) as Array<Record<string, unknown>>;
    const tasks: EvalTask[] = raw.slice(0, count).map((t) => ({
      id: (t.id as string) ?? "",
      query: (t.query as string) ?? "",
      category: (t.category as string) ?? "other",
      difficulty: (t.difficulty as EvalTask["difficulty"]) ?? "medium",
      needs_dialogue: (t.needs_dialogue as boolean) ?? false,
      expected_state_changes: (t.expected_state_changes as Record<string, string>) ?? null,
      validation_rule: undefined,
      policies_to_check: (t.policies_to_check as number[]) ?? [],
      scenario: (t.scenario as string) || (t.iron_user_scenario as string) || null,
      user_context: (t.user_context as string) || (t.iron_user_context as string) || null,
    }));

    console.log(`  Generated ${tasks.length} tasks`);
    return tasks;
  } catch (e) {
    console.log(`  Parse error: ${e}`);
    return [];
  }
}

// ── Task Statistics ──

export function showTaskStats(tasks: EvalTask[]): void {
  const cats: Record<string, number> = {};
  const diffs: Record<string, number> = {};
  let dialogue = 0;
  let stateCheck = 0;

  for (const t of tasks) {
    cats[t.category] = (cats[t.category] ?? 0) + 1;
    diffs[t.difficulty] = (diffs[t.difficulty] ?? 0) + 1;
    if (t.needs_dialogue) dialogue++;
    if (t.expected_state_changes) stateCheck++;
  }

  console.log(`\n=== Task basket: ${tasks.length} tasks ===\n`);
  console.log(`By category:   ${JSON.stringify(cats)}`);
  console.log(`By difficulty:  ${JSON.stringify(diffs)}`);
  console.log(`Needs dialogue: ${dialogue}/${tasks.length}`);
  console.log(`With state check: ${stateCheck}/${tasks.length}`);
  console.log();

  for (const t of tasks) {
    const state = t.expected_state_changes ? "S" : " ";
    const dlg = t.needs_dialogue ? "D" : " ";
    const diff = t.difficulty[0].toUpperCase();
    console.log(`  [${diff}] ${t.id.padEnd(6)} ${t.query.slice(0, 55).padEnd(55)} ${state} ${dlg}`);
  }
}
