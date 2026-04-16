import type { Trajectory, GraderResult, ValidationRule, EvalDB } from "../types.js";

function getNested(obj: unknown, path: string): unknown {
  let current = obj;
  for (const key of path.split(".")) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return current;
}

export function stateGrader(
  trajectory: Trajectory,
  expected: Record<string, string> | null,
  validationRule?: ValidationRule
): GraderResult {
  // expected=null → DB must not change (read-only task)
  if (expected === null) {
    const unchanged = JSON.stringify(trajectory.db_before) === JSON.stringify(trajectory.db_after);
    return {
      pass: unchanged,
      details: [unchanged ? "state unchanged" : "state changed unexpectedly"],
    };
  }

  const details: string[] = [];
  let allOk = true;

  // Check basic expected state changes
  for (const [path, expectedVal] of Object.entries(expected)) {
    const actual = getNested(trajectory.db_after, path);
    const ok = actual === expectedVal;
    details.push(`  ${path}: expected=${expectedVal}, actual=${actual} ${ok ? "PASS" : "FAIL"}`);
    if (!ok) allOk = false;
  }

  // Apply validation rule if provided
  if (validationRule && allOk && trajectory.db_before && trajectory.db_after) {
    const bookingPath = validationRule.booking_path ?? "bookings.ABC123";
    const field = validationRule.field ?? "price";
    const operator = validationRule.operator ?? "min";
    const dbAfter = trajectory.db_after;
    const dbBefore = trajectory.db_before;

    if (validationRule.type === "compare_time") {
      const newKey = getNested(dbAfter, `${bookingPath}.flight_key`) as string | undefined;
      const oldKey = getNested(dbBefore, `${bookingPath}.flight_key`) as string | undefined;
      if (newKey && oldKey) {
        const newVal = dbAfter.flights[newKey]?.[field as keyof typeof dbAfter.flights[string]] as string;
        const oldVal = dbBefore.flights[oldKey]?.[field as keyof typeof dbBefore.flights[string]] as string;
        if (operator === "gt" && newVal <= oldVal) {
          allOk = false;
          details.push(`  FAIL: New ${field} (${newVal}) is not greater than old (${oldVal})`);
        } else if (operator === "lt" && newVal >= oldVal) {
          allOk = false;
          details.push(`  FAIL: New ${field} (${newVal}) is not less than old (${oldVal})`);
        } else {
          details.push(`  PASS: ${field} constraint satisfied: ${oldVal} -> ${newVal}`);
        }
      }
    } else if (validationRule.type === "compare_price") {
      const newKey = getNested(dbAfter, `${bookingPath}.flight_key`) as string | undefined;
      if (newKey) {
        const newVal = dbAfter.flights[newKey]?.[field as keyof typeof dbAfter.flights[string]] as number;
        // Filter candidate flights
        let candidates = dbAfter.flights;
        const dateFilter = validationRule.filter?.date;
        if (dateFilter) {
          candidates = Object.fromEntries(
            Object.entries(candidates).filter(([k]) => k.includes(dateFilter))
          ) as EvalDB["flights"];
        }
        const values = Object.values(candidates).map((f) => f[field as keyof typeof f] as number);
        const optimal = operator === "min" ? Math.min(...values) : Math.max(...values);
        if (newVal !== optimal) {
          allOk = false;
          details.push(`  FAIL: Chose ${field}=${newVal}, but better option exists (${optimal})`);
        } else {
          details.push(`  PASS: Chose the optimal option (${field}=${newVal})`);
        }
      }
    }
  }

  return { pass: allOk, details };
}
