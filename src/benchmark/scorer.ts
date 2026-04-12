import { EXPECTED_FACTS } from "./queries.js";

export interface ScoreResult {
  score: number;
  found: string[];
  missed: string[];
}

export function scoreResponse(
  response: string,
  complexity: string
): ScoreResult {
  const patterns = EXPECTED_FACTS[complexity];
  if (!patterns) {
    return { score: 0, found: [], missed: [] };
  }

  const found: string[] = [];
  const missed: string[] = [];

  for (const { pattern, label } of patterns) {
    // All patterns use /i flag, so no need to lowercase the response
    if (pattern.test(response)) {
      found.push(label);
    } else {
      missed.push(label);
    }
  }

  const score = Math.round((found.length / patterns.length) * 10 * 10) / 10;
  return { score, found, missed };
}
