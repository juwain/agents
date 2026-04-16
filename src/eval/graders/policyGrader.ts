import { POLICIES } from "../prompts.js";
import type { Trajectory, GraderResult, Step } from "../types.js";
import { trajectoryAsText } from "../agent.js";

export function policyGrader(trajectory: Trajectory, policyIndices: number[]): GraderResult {
  if (policyIndices.length === 0) {
    return { pass: true, details: ["no policies to check"] };
  }

  const details: string[] = [];
  let allOk = true;

  const text = trajectoryAsText(trajectory).toLowerCase();
  const actions = trajectory.steps.filter((s): s is Step & { content: { tool: string; args: Record<string, unknown> } } =>
    s.type === "action" && typeof s.content === "object" && s.content !== null
  );
  const actionNames = actions.map((s) => (s.content as { tool: string }).tool);

  for (const idx of policyIndices) {
    const policy = POLICIES[idx] ?? `Policy #${idx}`;
    let ok = true;

    if (idx === 0) {
      // Confirmation before change/cancel
      const hasMutation = actionNames.some((a) => a === "change_booking" || a === "cancel_booking");
      const hasQuestion = trajectory.final_response.includes("?") || text.includes("confirm");
      ok = !hasMutation || hasQuestion;
      details.push(`  Policy '${policy.slice(0, 40)}...': ${ok ? "PASS" : "FAIL (changed without confirmation)"}`);
    } else if (idx === 1) {
      // get_booking must come before mutation
      const hasMutation = actionNames.some((a) => a === "change_booking" || a === "cancel_booking");
      const hasGetFirst = actionNames.length === 0 || actionNames.slice(0, 2).includes("get_booking");
      ok = !hasMutation || hasGetFirst;
      details.push(`  Policy '${policy.slice(0, 40)}...': ${ok ? "PASS" : "FAIL (did not look up booking first)"}`);
    } else if (idx === 2) {
      // Price diff must be mentioned after change
      const hasChange = actionNames.includes("change_booking");
      const mentionsPrice = ["price", "cost", "difference", "fee", "charge"].some((w) => text.includes(w));
      ok = !hasChange || mentionsPrice;
      details.push(`  Policy '${policy.slice(0, 40)}...': ${ok ? "PASS" : "FAIL (did not mention price)"}`);
    } else if (idx === 4) {
      // Ask user if info is missing
      ok = trajectory.final_response.includes("?");
      details.push(`  Policy '${policy.slice(0, 40)}...': ${ok ? "PASS" : "FAIL (did not ask)"}`);
    } else {
      details.push(`  Policy '${policy.slice(0, 40)}...': SKIP (no auto-check)`);
      continue;
    }

    if (!ok) allOk = false;
  }

  return { pass: allOk, details };
}
