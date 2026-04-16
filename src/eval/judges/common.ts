import type { Rating, JudgeResult, Criterion } from "../types.js";

const VALID_RATINGS = new Set<string>(["good", "so-so", "bad"]);

export function parseJudgeResponse(
  text: string,
  criteria?: readonly string[]
): Record<string, string> | null {
  // Try minimal {no-nested-braces} match first
  let m = text.match(/\{[^{}]*\}/s);
  if (!m) {
    // Fallback greedy
    m = text.match(/\{.*?\}/s);
  }
  if (!m) return null;

  try {
    const parsed = JSON.parse(m[0]) as Record<string, string>;
    if (criteria) {
      for (const c of criteria) {
        if (!VALID_RATINGS.has(parsed[c])) {
          parsed[c] = "so-so";
        }
      }
    } else if ("score" in parsed && !VALID_RATINGS.has(parsed.score)) {
      parsed.score = "so-so";
    }
    return parsed;
  } catch {
    return null;
  }
}

export function defaultResult(): JudgeResult {
  return { usefulness: "so-so", groundedness: "so-so", efficiency: "so-so" };
}
