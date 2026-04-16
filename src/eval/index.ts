import { createInterface } from "readline/promises";
import { TASKS, generateTasks, showTaskStats } from "./tasks.js";
import { runSingleTurn, runMultiTurn } from "./runner.js";
import { HUMAN_GT, qualityScore, cohensKappa, kappaInterpretation } from "./humanLabels.js";
import { ALL_JUDGES, getJudge } from "./judges/index.js";
import {
  updateScoreboard,
  printScoreboard,
  printDiff,
  printConfusionMatrix,
  printKappaProgression,
  analyzeDisagreements,
} from "./analysis.js";
import type { EvalTask, Trajectory, JudgeResult, Rating, ScoreboardEntry } from "./types.js";
import { CRITERIA, SCORE_MAP } from "./types.js";

// Cost estimates per call
const COST_PER_CALL_MINI = 0.00025;
const COST_PER_CALL_GPT4O = 0.00525;

let currentTasks = [...TASKS];
let currentTrajectories: Record<string, Trajectory> = {};

async function runJudgeOnTasks(
  judgeVersion: number,
  tasks: EvalTask[],
  trajectories: Record<string, Trajectory>
): Promise<Record<string, JudgeResult>> {
  const judge = getJudge(judgeVersion);
  if (!judge) {
    console.log(`  Judge v${judgeVersion} not found`);
    return {};
  }

  console.log(`\n=== ${judge.name} ===\n`);
  const results: Record<string, JudgeResult> = {};
  let nCalls = 0;
  const start = Date.now();

  for (const task of tasks) {
    const t = trajectories[task.id];
    if (!t) {
      console.log(`  ${task.id}: no trajectory, skipping`);
      continue;
    }
    process.stdout.write(`  ${task.id}... `);
    results[task.id] = await judge.call(task.query, t);
    // v1/v2 = 1 call, v3/v4/v5 = 3 calls per task
    nCalls += judgeVersion >= 3 ? 3 : 1;
    console.log(`${results[task.id].usefulness} / ${results[task.id].groundedness} / ${results[task.id].efficiency}`);
  }

  const elapsed = (Date.now() - start) / 1000;
  const costPerCall = judgeVersion === 5 ? COST_PER_CALL_GPT4O : COST_PER_CALL_MINI;

  // Compute metrics
  const tasksWithHuman = tasks.filter((t) => HUMAN_GT[t.id] && results[t.id]);
  const allH: Rating[] = [];
  const allL: Rating[] = [];
  for (const task of tasksWithHuman) {
    for (const crit of CRITERIA) {
      allH.push(HUMAN_GT[task.id][crit]);
      allL.push(results[task.id][crit]);
    }
  }

  const kappa = allH.length > 0 ? cohensKappa(allH, allL) : 0;
  const avgScore =
    tasksWithHuman.reduce((sum, t) => {
      const r = results[t.id];
      return sum + SCORE_MAP[r.usefulness] + SCORE_MAP[r.groundedness] + SCORE_MAP[r.efficiency];
    }, 0) / Math.max(1, tasksWithHuman.length);

  updateScoreboard({
    version: judge.name,
    avg_score: avgScore,
    kappa,
    time_sec: elapsed,
    n_calls: nCalls,
    est_cost: nCalls * costPerCall,
  });

  // Print diff and analysis
  const nDisagreements = printDiff(judge.name, results, tasksWithHuman);
  analyzeDisagreements(judge.name, results, tasksWithHuman);

  console.log(`\n  Kappa: ${kappa.toFixed(2)} (${kappaInterpretation(kappa)})`);
  console.log(`  Time: ${elapsed.toFixed(1)}s | Calls: ${nCalls} | Est. cost: $${(nCalls * costPerCall).toFixed(4)}`);

  return results;
}

export async function runEvaluation(): Promise<void> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  // Add human GT to scoreboard
  const avgHuman =
    Object.values(HUMAN_GT).reduce((s, l) => s + qualityScore(l), 0) /
    Object.keys(HUMAN_GT).length;
  updateScoreboard({
    version: "Human GT",
    avg_score: avgHuman,
    kappa: null,
    time_sec: null,
    n_calls: null,
    est_cost: null,
  });

  console.log("\nEvaluation Pipeline");
  console.log("=".repeat(40));
  console.log("  1. Single-turn run (all tasks)");
  console.log("  2. Multi-turn run (Iron User v2)");
  console.log("  3. Run single judge (1-5)");
  console.log("  4. Run all judges + scoreboard");
  console.log("  5. Generate additional tasks");
  console.log("  6. Full pipeline");
  console.log("  7. Show task basket statistics");

  const choice = (await rl.question("\n> ")).trim();

  switch (choice) {
    case "1": {
      currentTrajectories = await runSingleTurn(currentTasks);
      break;
    }

    case "2": {
      currentTrajectories = await runMultiTurn(currentTasks);
      break;
    }

    case "3": {
      if (Object.keys(currentTrajectories).length === 0) {
        console.log("  Running multi-turn first to generate trajectories...");
        currentTrajectories = await runMultiTurn(currentTasks);
      }
      const vStr = (await rl.question("  Judge version (1-5): ")).trim();
      const v = parseInt(vStr, 10);
      if (v >= 1 && v <= 5) {
        await runJudgeOnTasks(v, currentTasks, currentTrajectories);
        printScoreboard();
      } else {
        console.log("  Invalid version");
      }
      break;
    }

    case "4": {
      if (Object.keys(currentTrajectories).length === 0) {
        console.log("  Running multi-turn first to generate trajectories...");
        currentTrajectories = await runMultiTurn(currentTasks);
      }
      const allResults: Array<{ name: string; labels: Record<string, JudgeResult> }> = [];
      for (const judge of ALL_JUDGES) {
        const results = await runJudgeOnTasks(judge.version, currentTasks, currentTrajectories);
        allResults.push({ name: judge.name, labels: results });
      }
      printScoreboard();
      printKappaProgression(allResults, currentTasks);

      // Confusion matrices for the best judge (v4)
      const v4Labels = allResults.find((r) => r.name.includes("v4"))?.labels;
      if (v4Labels) {
        console.log(`\n${"=".repeat(50)}`);
        console.log("Confusion Matrices (v4 vs Human GT)");
        for (const crit of CRITERIA) {
          printConfusionMatrix(crit, HUMAN_GT, v4Labels);
        }
      }
      break;
    }

    case "5": {
      console.log("  Generating tasks via LLM...");
      const generated = await generateTasks();
      currentTasks = [...TASKS, ...generated];
      showTaskStats(currentTasks);
      break;
    }

    case "6": {
      // Full pipeline
      console.log("\n--- Step 1: Generate additional tasks ---");
      const generated = await generateTasks();
      currentTasks = [...TASKS, ...generated];
      showTaskStats(currentTasks);

      console.log("\n--- Step 2: Multi-turn run ---");
      currentTrajectories = await runMultiTurn(currentTasks);

      console.log("\n--- Step 3: Run all judges ---");
      const allResults: Array<{ name: string; labels: Record<string, JudgeResult> }> = [];
      for (const judge of ALL_JUDGES) {
        const results = await runJudgeOnTasks(judge.version, currentTasks, currentTrajectories);
        allResults.push({ name: judge.name, labels: results });
      }

      console.log("\n--- Step 4: Final scoreboard ---");
      printScoreboard();
      printKappaProgression(allResults, currentTasks);
      break;
    }

    case "7": {
      showTaskStats(currentTasks);
      break;
    }

    default:
      console.log("Invalid choice");
  }

  rl.close();
}
