// ── Eval Domain Types ──

export interface EvalFlight {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  fare_rules?: string;
}

export interface EvalBooking {
  passenger: string;
  flight_key: string;
  status: "confirmed" | "cancelled" | "changed";
  class: string;
}

export interface EvalDB {
  flights: Record<string, EvalFlight>;
  bookings: Record<string, EvalBooking>;
}

// ── Trajectory Types ──

export interface Step {
  type: "action" | "observation" | "response";
  content: unknown;
}

export interface Trajectory {
  task_id: string;
  query: string;
  steps: Step[];
  final_response: string;
  db_before: EvalDB | null;
  db_after: EvalDB | null;
}

// ── Task Types ──

export interface ValidationRule {
  type: "compare_time" | "compare_price";
  booking_path?: string;
  field?: string;
  operator?: "gt" | "lt" | "min" | "max";
  filter?: Record<string, string>;
}

export interface EvalTask {
  id: string;
  query: string;
  category: string;
  difficulty: "easy" | "medium" | "hard" | "extra_hard";
  needs_dialogue: boolean;
  expected_state_changes: Record<string, string> | null;
  validation_rule?: ValidationRule;
  policies_to_check: number[];
  scenario: string | null;
  user_context: string | null;
  comment?: string;
}

// ── Judge Types ──

export type Rating = "good" | "so-so" | "bad";

export interface JudgeResult {
  usefulness: Rating;
  groundedness: Rating;
  efficiency: Rating;
  _raw_response?: string;
  _raw_responses?: Record<string, string>;
}

export type JudgeFn = (query: string, trajectory: Trajectory) => Promise<JudgeResult>;

export interface JudgeVersion {
  name: string;
  version: number;
  call: JudgeFn;
}

// ── Grader Types ──

export interface GraderResult {
  pass: boolean;
  details: string[];
}

// ── Scoreboard ──

export interface ScoreboardEntry {
  version: string;
  avg_score: number;
  kappa: number | null;
  time_sec: number | null;
  n_calls: number | null;
  est_cost: number | null;
}

export const CRITERIA = ["usefulness", "groundedness", "efficiency"] as const;
export type Criterion = (typeof CRITERIA)[number];

export const SCORE_MAP: Record<Rating, number> = { good: 2, "so-so": 1, bad: 0 };
