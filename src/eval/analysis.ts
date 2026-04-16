import type { ScoreboardEntry, JudgeResult, Rating, EvalTask } from "./types.js";
import { CRITERIA, SCORE_MAP } from "./types.js";
import { HUMAN_GT, qualityScore, cohensKappa, percentAgreement, kappaInterpretation } from "./humanLabels.js";

// ── Scoreboard ──

const SCOREBOARD: ScoreboardEntry[] = [];

export function updateScoreboard(entry: ScoreboardEntry): void {
  const idx = SCOREBOARD.findIndex((e) => e.version === entry.version);
  if (idx >= 0) {
    SCOREBOARD[idx] = entry;
  } else {
    SCOREBOARD.push(entry);
  }
}

export function printScoreboard(): void {
  console.log(`\n${"=".repeat(90)}`);
  console.log("SCOREBOARD");
  console.log("=".repeat(90));
  console.log(
    `${"Version".padEnd(32)} ${"Avg Score".padStart(10)} ${"Kappa".padStart(8)} ` +
    `${"Agreement".padStart(10)} ${"Time(s)".padStart(8)} ${"Calls".padStart(6)} ${"Cost($)".padStart(8)}`
  );
  console.log("-".repeat(90));

  for (const e of SCOREBOARD) {
    const kStr = e.kappa !== null ? e.kappa.toFixed(2) : "—";
    const tStr = e.time_sec !== null ? e.time_sec.toFixed(1) : "—";
    const nStr = e.n_calls !== null ? String(e.n_calls) : "—";
    const cStr = e.est_cost !== null ? e.est_cost.toFixed(4) : "—";
    const interp = e.kappa !== null ? ` (${kappaInterpretation(e.kappa)})` : "";
    console.log(
      `  ${e.version.padEnd(30)} ${e.avg_score.toFixed(1).padStart(10)} ` +
      `${kStr.padStart(8)}${interp.padEnd(20)} ${tStr.padStart(8)} ${nStr.padStart(6)} ${cStr.padStart(8)}`
    );
  }
}

// ── Diff: Human GT vs LLM Judge ──

export function printDiff(
  versionName: string,
  llmLabels: Record<string, JudgeResult>,
  tasks: EvalTask[]
): number {
  let nMatch = 0;
  let nTotal = 0;

  console.log(`\n${"─".repeat(85)}`);
  console.log(`DIFF: Human GT  vs  ${versionName}`);
  console.log("─".repeat(85));
  console.log(`${"ID".padEnd(5)} ${"Criterion".padEnd(16)} ${"Human".padEnd(10)} ${"LLM".padEnd(10)} ${"Match"}`);
  console.log("─".repeat(85));

  for (const task of tasks) {
    const tid = task.id;
    const human = HUMAN_GT[tid];
    const llm = llmLabels[tid];
    if (!human || !llm) continue;

    for (let ci = 0; ci < CRITERIA.length; ci++) {
      const crit = CRITERIA[ci];
      const hVal = human[crit];
      const lVal = llm[crit];
      const match = hVal === lVal;
      nTotal++;
      if (match) nMatch++;

      const prefix = ci === 0 ? `  ${tid.padEnd(3)}` : "      ";
      const icon = match ? "  MATCH" : "  DIFF";
      console.log(`${prefix} ${crit.padEnd(16)} ${hVal.padEnd(10)} ${lVal.padEnd(10)} ${icon}`);
    }
  }

  console.log("─".repeat(85));
  const pct = nTotal > 0 ? ((nMatch / nTotal) * 100).toFixed(0) : "0";
  console.log(`  Accuracy: ${nMatch}/${nTotal} = ${pct}%`);

  return nTotal - nMatch;
}

// ── Confusion Matrix (text-based) ──

export function printConfusionMatrix(
  criterion: string,
  humanLabels: Record<string, JudgeResult>,
  llmLabels: Record<string, JudgeResult>
): void {
  const labels: Rating[] = ["good", "so-so", "bad"];
  const matrix = labels.map(() => labels.map(() => 0));

  for (const tid of Object.keys(humanLabels)) {
    const h = humanLabels[tid]?.[criterion as keyof JudgeResult] as Rating;
    const l = llmLabels[tid]?.[criterion as keyof JudgeResult] as Rating;
    if (!h || !l) continue;
    const hi = labels.indexOf(h);
    const li = labels.indexOf(l);
    if (hi >= 0 && li >= 0) matrix[hi][li]++;
  }

  console.log(`\n  Confusion Matrix: ${criterion}`);
  console.log(`  ${"".padEnd(10)} ${"good".padStart(6)} ${"so-so".padStart(6)} ${"bad".padStart(6)}`);
  for (let i = 0; i < labels.length; i++) {
    const row = matrix[i].map((v) => String(v).padStart(6)).join("");
    console.log(`  ${labels[i].padEnd(10)} ${row}`);
  }
}

// ── Kappa Progression ──

export function printKappaProgression(
  versions: Array<{ name: string; labels: Record<string, JudgeResult> }>,
  tasks: EvalTask[]
): void {
  console.log(`\n${"=".repeat(70)}`);
  console.log("Cohen's Kappa Progression");
  console.log("=".repeat(70));
  console.log(
    `${"Version".padEnd(32)} ${"usefulness".padStart(12)} ${"groundedness".padStart(13)} ` +
    `${"efficiency".padStart(12)} ${"OVERALL".padStart(10)}`
  );
  console.log("-".repeat(70));

  for (const v of versions) {
    const kappas: number[] = [];
    const perCrit: string[] = [];

    for (const crit of CRITERIA) {
      const hLabels: Rating[] = [];
      const lLabels: Rating[] = [];
      for (const task of tasks) {
        const h = HUMAN_GT[task.id]?.[crit];
        const l = v.labels[task.id]?.[crit];
        if (h && l) {
          hLabels.push(h);
          lLabels.push(l);
        }
      }
      const k = cohensKappa(hLabels, lLabels);
      kappas.push(k);
      perCrit.push(k.toFixed(2).padStart(12));
    }

    // Overall kappa across all criteria
    const allH: Rating[] = [];
    const allL: Rating[] = [];
    for (const task of tasks) {
      for (const crit of CRITERIA) {
        const h = HUMAN_GT[task.id]?.[crit];
        const l = v.labels[task.id]?.[crit];
        if (h && l) {
          allH.push(h);
          allL.push(l);
        }
      }
    }
    const overall = cohensKappa(allH, allL);

    console.log(
      `  ${v.name.padEnd(30)} ${perCrit.join("")} ${overall.toFixed(2).padStart(10)}`
    );
  }
}

// ── Analyze disagreements ──

export function analyzeDisagreements(
  versionName: string,
  llmLabels: Record<string, JudgeResult>,
  tasks: EvalTask[]
): void {
  const disagreements: Array<{ task: EvalTask; criterion: string; human: Rating; llm: Rating }> = [];

  for (const task of tasks) {
    const h = HUMAN_GT[task.id];
    const l = llmLabels[task.id];
    if (!h || !l) continue;

    for (const crit of CRITERIA) {
      if (h[crit] !== l[crit]) {
        disagreements.push({ task, criterion: crit, human: h[crit], llm: l[crit] });
      }
    }
  }

  if (disagreements.length === 0) {
    console.log(`\n  ${versionName}: No disagreements!`);
    return;
  }

  console.log(`\n  ${versionName}: ${disagreements.length} disagreements`);
  for (const d of disagreements) {
    console.log(
      `    ${d.task.id} [${d.criterion}]: human=${d.human}, llm=${d.llm} — "${d.task.query.slice(0, 50)}..."`
    );
  }
}
