// ── Policies ──

export const POLICIES = [
  "Request confirmation before any booking change or cancellation",
  "Retrieve the current booking first, then suggest changes",
  "Report the price difference when changing a flight",
  "Do not disclose other passengers' data",
  "If information is insufficient — ask the user",
];

// ── Agent System Prompt ──

export const SYSTEM_PROMPT =
  "You are a virtual airline assistant. Reply in English.\n" +
  "Today: February 20, 2026 (2026-02-20).\n\n" +
  "Available tools:\n" +
  "- get_booking(booking_id) — get a booking\n" +
  "- search_flights(origin, destination, date) — search for flights (codes: MOW, PAR, LON; date: YYYY-MM-DD)\n" +
  "- change_booking(booking_id, new_flight_key) — change a booking (flight key: e.g. SU2456_0220)\n" +
  "- cancel_booking(booking_id) — cancel a booking\n\n" +
  "Rules (MUST be followed):\n" +
  POLICIES.map((p, i) => `${i + 1}. ${p}`).join("\n");

// ── Iron User v2 Prompt ──

export const IRON_USER_PROMPT_V2 =
  "You are simulating an airline customer in a dialogue with the assistant.\n\n" +
  "Your goal: {scenario}\n\n" +
  "Your details:\n{user_context}\n\n" +
  "Rules:\n" +
  "- Reply briefly (1-2 sentences), like a real user\n" +
  "- If the assistant asks for confirmation — confirm, if it matches your goal\n" +
  "- If the assistant offers options — choose the one that fits your goal\n" +
  "- Do not make up data that is not in your context\n" +
  "- If the assistant reports an error or says the request is impossible — accept an alternative or say 'Ok, never mind then. Thank you'\n" +
  "- Do NOT repeat the same request if the assistant already said it is impossible\n" +
  "- If the task is completed — say 'Thank you' and end the conversation";

// ── Judge v1: Naive ──

export const JUDGE_V1_PROMPT =
  "Evaluate the quality of the airline agent's response.\n\n" +
  "User task: {query}\n\n" +
  "Agent trajectory:\n{trajectory}\n\n" +
  "Agent final response: {response}\n\n" +
  "Rate on three criteria (good / so-so / bad):\n" +
  "- usefulness: how much the agent helped the user\n" +
  "- groundedness: whether all facts are supported by data\n" +
  "- efficiency: how optimally the agent used its tools\n\n" +
  'Respond strictly in JSON format:\n' +
  '{{"usefulness": "...", "groundedness": "...", "efficiency": "..."}}';

// ── Judge v2: Concrete rubric definitions ──

export const JUDGE_V2_PROMPT =
  "Evaluate the quality of the airline agent's response.\n\n" +
  "User task: {query}\n\n" +
  "Agent trajectory:\n{trajectory}\n\n" +
  "Agent final response: {response}\n\n" +
  "Rate on three criteria:\n\n" +
  "usefulness:\n" +
  "- good: user goal fully achieved, all constraints respected\n" +
  "- so-so: partially achieved, minor issues or clarification needed\n" +
  "- bad: goal not achieved, agent did not help or acted against the request\n\n" +
  "groundedness:\n" +
  "- good: all facts (prices, numbers, dates) confirmed by tool data\n" +
  "- so-so: some facts unconfirmed, but no critical errors\n" +
  "- bad: hallucinations or made-up data present\n\n" +
  "efficiency:\n" +
  "- good: minimum necessary steps, no redundant calls\n" +
  "- so-so: some extra steps, but result was achieved\n" +
  "- bad: looping, repeated calls, many unnecessary steps\n\n" +
  'Respond strictly in JSON: {{"usefulness": "...", "groundedness": "...", "efficiency": "..."}}';

// ── Judge v3: Per-criterion prompts with CoT ──

export const PROMPT_USEFULNESS =
  "You are an expert at evaluating the quality of AI airline agents.\n" +
  "Evaluate the USEFULNESS of the agent's response to the user.\n\n" +
  "{few_shot}" +
  "User task: {query}\n" +
  "Agent trajectory: {trajectory}\n" +
  "Final response: {response}\n\n" +
  "CRITICALLY IMPORTANT: Check the trajectory CAREFULLY!\n\n" +
  "Reason step by step:\n" +
  "1. What was the user's goal?\n" +
  "2. What tool calls were made? Check parameters (especially dates).\n" +
  "3. What did the agent tell the user in the final response?\n" +
  "4. Was the goal achieved? Were constraints respected?\n\n" +
  "Rating criteria:\n" +
  "- good: goal FULLY achieved, all constraints respected\n" +
  "- so-so: goal PARTIALLY achieved OR minor issues\n" +
  "- bad: goal NOT achieved OR major errors\n\n" +
  "Automatically good if:\n" +
  "  - User requested a NON-EXISTENT resource and agent responded 'not found' — correct answer.\n" +
  "  - Agent requested CONFIRMATION before change, user confirmed, and agent PERFORMED the action.\n\n" +
  'Respond ONLY in JSON: {{"reasoning": "<step-by-step reasoning>", "score": "good|so-so|bad"}}';

export const PROMPT_GROUNDEDNESS =
  "You are an expert at evaluating the factual accuracy of AI agents.\n" +
  "Evaluate the GROUNDEDNESS of facts in the agent's response.\n\n" +
  "{few_shot}" +
  "Task: {query}\n" +
  "Trajectory: {trajectory}\n" +
  "Response: {response}\n\n" +
  "IMPORTANT: If the agent did NOT make tool calls and stated no specific facts — groundedness=good.\n\n" +
  "Reason step by step:\n" +
  "1. What FACTS are in the response? (flight numbers, prices, dates, statuses)\n" +
  "2. For EACH fact: is it in the tool call observations?\n" +
  "3. Are there CONTRADICTIONS between response and tool data?\n\n" +
  "Criteria:\n" +
  "- good: all specific facts confirmed by tool calls (or no facts at all)\n" +
  "- so-so: inaccuracies present, but no clear fabrications\n" +
  "- bad: agent stated a specific fact NOT in the tool data\n\n" +
  'Respond ONLY in JSON: {{"reasoning": "<analysis of each fact>", "score": "good|so-so|bad"}}';

export const PROMPT_EFFICIENCY =
  "You are an expert at evaluating AI agent efficiency.\n" +
  "Evaluate the EFFICIENCY of the agent: how optimally it used its tools.\n\n" +
  "{few_shot}" +
  "Task: {query}\n" +
  "Trajectory: {trajectory}\n" +
  "Response: {response}\n\n" +
  "IMPORTANT: efficiency evaluates ONLY tool call usage, not task completion.\n\n" +
  "Reason step by step:\n" +
  "1. Count ONLY tool calls, do NOT count user messages or agent text responses\n" +
  "2. Were there REPEATED calls with IDENTICAL parameters?\n" +
  "3. What is the MINIMUM required set of tool calls for this task?\n" +
  "   - Show booking: 1 (get_booking)\n" +
  "   - Flight search: 1 (search_flights)\n" +
  "   - Comparing two destinations: 2 (search_flights x 2)\n" +
  "   - Change booking: 3 (get_booking + search_flights + change_booking)\n" +
  "   - Cancel booking: 2 (get_booking + cancel_booking)\n\n" +
  "Rating criteria:\n" +
  "- good: tool calls <= optimum + 1, no repeated calls with same parameters\n" +
  "- so-so: 1-2 extra calls (duplication), but no clear looping\n" +
  "- bad: LOOPING — same call repeated 3+ times with same parameters\n\n" +
  "Automatically good if:\n" +
  "  - Task involved dialogue — additional steps between turns are NOT extra if parameters differ\n" +
  "  - Agent refused task without tool calls — minimum steps = good\n\n" +
  "Do NOT penalize for:\n" +
  "  - Number of dialogue turns (not tool calls)\n" +
  "  - get_booking before change/cancel — this is REQUIRED by policy\n\n" +
  'Respond ONLY in JSON: {{"reasoning": "<step-by-step analysis>", "score": "good|so-so|bad"}}';

// ── Judge v4: Few-shot calibration examples ──

export const FEW_SHOT_USEFULNESS =
  "Expert rating examples:\n\n" +
  "--- GOOD ---\n\n" +
  "Example 1 (good): Task 'Show booking ABC123'. Agent called get_booking, " +
  "got full details, presented them clearly. Goal fully achieved. -> good\n\n" +
  "Example 2 (good): Task 'Move ABC123 to the 12:30 flight'. Agent asked for " +
  "confirmation, user replied 'yes', agent called change_booking and confirmed. " +
  "Confirmation + action = task fully completed. -> good\n\n" +
  "Example 3 (good): Task 'Show booking FAKE000'. Agent called get_booking, " +
  "got 'not found', told user honestly. Correct answer — not bad!\n\n" +
  "Example 4 (good): Task 'What is the cancellation fee?'. Agent called get_booking, " +
  "responded: 'The system does not contain fee information'. Honest about limitation. -> good\n\n" +
  "Example 5 (good): Task 'Compare flights to London and Paris by price'. " +
  "Agent searched both, explicitly stated comparison. Both searches + comparison = good\n\n" +
  "--- SO-SO ---\n\n" +
  "Example 6 (so-so): Task 'Find the cheapest flight to Paris tomorrow'. Agent searched flights, " +
  "listed all options but did NOT name the cheapest one explicitly. Partial help. -> so-so\n\n" +
  "--- BAD ---\n\n" +
  "Example 7 (bad): Task 'Cancel ABC123'. Agent cancelled without asking for confirmation. " +
  "Policy violation — did not request user consent. -> bad\n\n";

export const FEW_SHOT_GROUNDEDNESS =
  "Expert rating examples:\n\n" +
  "Example 1 (good): search_flights returned SU2454 at 25000 and SU2456 at 27000. " +
  "Agent said: 'I found 2 flights: SU2454 at 08:30 for 25000, SU2456 at 12:30 for 27000.' " +
  "All numbers match tool output exactly. -> good\n\n" +
  "Example 2 (good): Agent asked for clarification (no tool calls), " +
  "stated no specific facts. Nothing to verify. -> good\n\n" +
  "Example 3 (good): cancel_booking returned success. Agent said: 'Booking cancelled.' " +
  "Exactly matches tool output. -> good\n\n" +
  "Example 4 (so-so): Agent said flight has 'convenient morning departure'. " +
  "Tool only returned '08:30' — 'convenient' is subjective. Minor overstatement. -> so-so\n\n" +
  "Example 5 (bad): Agent told user 'Your booking is confirmed for March 15' " +
  "but never called get_booking. Pure hallucination. -> bad\n\n" +
  "Example 6 (bad): search_flights returned price 27000. " +
  "Agent told user: 'This flight costs 25000.' Contradicts tool data. -> bad\n\n";

export const FEW_SHOT_EFFICIENCY =
  "Expert rating examples:\n\n" +
  "KEY RULE: Count ONLY tool calls. Do NOT count user messages or agent text replies.\n\n" +
  "CRITICAL: 'bad' means REDUNDANT calls (same tool, same params, repeated). " +
  "Many UNIQUE calls for a complex task is still good.\n\n" +
  "Example 1 (good): Task 'Show booking ABC123'. Agent made 1 call: get_booking('ABC123'). " +
  "Minimum required. -> good\n\n" +
  "Example 2 (good): Task 'Move ABC123 to afternoon flight'. " +
  "3 calls: get_booking -> search_flights -> change_booking. Each necessary. -> good\n\n" +
  "Example 3 (good): Task 'Move to cheapest flight tomorrow'. " +
  "5 distinct calls, no repeats, complex task. -> good (many unique calls != inefficient)\n\n" +
  "Example 4 (good): 3-turn dialogue with 4 distinct tool calls total. " +
  "Large step count from dialogue does NOT affect efficiency. -> good\n\n" +
  "Example 5 (so-so): Agent called get_booking('ABC123') twice with identical params. " +
  "1 redundant call. -> so-so\n\n" +
  "Example 6 (bad): Agent called get_booking('ABC123') 6 times in sequence — " +
  "repeated verification without any change in input. Clear looping. -> bad\n\n";

// ── Task Generation Prompt ──

export const TASK_GEN_PROMPT =
  "You create test tasks to evaluate an AI airline assistant.\n\n" +
  "Agent tools:\n" +
  "- get_booking(booking_id) — get a booking\n" +
  "- search_flights(origin, destination, date) — search flights (cities: MOW, PAR, LON)\n" +
  "- change_booking(booking_id, new_flight_key) — change a booking\n" +
  "- cancel_booking(booking_id) — cancel a booking\n\n" +
  "In DB: ABC123 (Ivan Petrov, MOW->PAR, flight SU2454_0220, Feb 20 2026, economy, 25000)\n" +
  "       XYZ789 (Maria Sidorova, MOW->LON, flight SU2580_0220, Feb 20 2026, business, 28000)\n\n" +
  "Airline policies (by index):\n" +
  "  0 — request user confirmation before any change/cancellation\n" +
  "  1 — show available options before making a change\n" +
  "  2 — report the price difference when changing\n" +
  "  3 — do not disclose other passengers' data\n" +
  "  4 — ask the user for missing information\n\n" +
  "Generate exactly 15 tasks with balanced difficulty:\n" +
  "- 5 medium, 6 hard, 4 extra_hard\n\n" +
  "Distribute across 5 patterns (3 per pattern):\n" +
  "PATTERN 1 — Non-existent resource: booking/flight not found. expected_state_changes=null.\n" +
  "PATTERN 2 — Conditional logic: 'only if cheaper', 'only if before 12:00'. needs_dialogue=true.\n" +
  "PATTERN 3 — Dialogue with confirmation: multi-turn change/cancel. needs_dialogue=true.\n" +
  "PATTERN 4 — Unavailable info: condition can't be checked via API. Do NOT perform action.\n" +
  "PATTERN 5 — Comparison/selection: find + name THE BEST option.\n\n" +
  "For each task return JSON:\n" +
  "{\n" +
  '  "id": "tc01",\n' +
  '  "query": "user request text",\n' +
  '  "category": "edge|conditional|dialogue|unavailable|comparison",\n' +
  '  "difficulty": "medium|hard|extra_hard",\n' +
  '  "needs_dialogue": true|false,\n' +
  '  "expected_state_changes": {"bookings.ABC123.status": "changed"} or null,\n' +
  '  "validation_rule": null,\n' +
  '  "policies_to_check": [0, 1],\n' +
  '  "scenario": "Iron User goal" or "",\n' +
  '  "user_context": "Iron User context" or ""\n' +
  "}\n\n" +
  "For needs_dialogue=false: scenario and user_context — empty strings.\n" +
  "Response — JSON array of exactly 15 objects, no explanations.";
