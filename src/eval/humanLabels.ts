import type { JudgeResult, Rating, Criterion, CRITERIA } from "./types.js";
import { SCORE_MAP } from "./types.js";

// ── Human Ground Truth Labels ──

export const HUMAN_GT: Record<string, JudgeResult> = {
  t01: { usefulness: "good", groundedness: "good", efficiency: "good" },
  t02: { usefulness: "good", groundedness: "good", efficiency: "good" },
  t03: { usefulness: "good", groundedness: "good", efficiency: "good" },
  t04: { usefulness: "good", groundedness: "good", efficiency: "good" },
  t05: { usefulness: "good", groundedness: "good", efficiency: "good" },
  t06: { usefulness: "good", groundedness: "good", efficiency: "so-so" },
  t07: { usefulness: "good", groundedness: "good", efficiency: "good" },
  t08: { usefulness: "good", groundedness: "good", efficiency: "so-so" },
  t09: { usefulness: "good", groundedness: "good", efficiency: "good" },
  t10: { usefulness: "so-so", groundedness: "good", efficiency: "good" },
  t11: { usefulness: "good", groundedness: "good", efficiency: "so-so" },
  t12: { usefulness: "so-so", groundedness: "good", efficiency: "good" },
};

// ── Quality Score ──

export function qualityScore(labels: JudgeResult): number {
  return (
    SCORE_MAP[labels.usefulness] +
    SCORE_MAP[labels.groundedness] +
    SCORE_MAP[labels.efficiency]
  );
}

// ── Cohen's Kappa ──

export function cohensKappa(labelsA: Rating[], labelsB: Rating[]): number {
  const n = labelsA.length;
  if (n === 0) return 0;
  const cats = [...new Set([...labelsA, ...labelsB])];
  const pO = labelsA.filter((a, i) => a === labelsB[i]).length / n;
  const pE = cats.reduce((sum, c) => {
    const countA = labelsA.filter((l) => l === c).length;
    const countB = labelsB.filter((l) => l === c).length;
    return sum + (countA / n) * (countB / n);
  }, 0);
  return pE < 1 ? (pO - pE) / (1 - pE) : 1.0;
}

export function percentAgreement(labelsA: Rating[], labelsB: Rating[]): number {
  if (labelsA.length === 0) return 0;
  return (labelsA.filter((a, i) => a === labelsB[i]).length / labelsA.length) * 100;
}

export function kappaInterpretation(k: number): string {
  if (k > 0.8) return "almost perfect";
  if (k > 0.6) return "substantial";
  if (k > 0.4) return "moderate";
  if (k > 0.2) return "fair";
  return "poor";
}
